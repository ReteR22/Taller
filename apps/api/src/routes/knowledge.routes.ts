import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { authenticate, requireRole, AuthRequest } from '../middlewares/auth.middleware'
import { ragService } from '../services/rag.service'

export const knowledgeRouter = Router()
knowledgeRouter.use(authenticate)

const docSchema = z.object({
  title:    z.string().min(1).max(200),
  type:     z.enum(['MANUAL','PROCEDURE','FAQ','BULLETIN','SPECIFICATION']),
  brand:    z.string().optional(),
  model:    z.string().optional(),
  yearFrom: z.number().int().optional(),
  yearTo:   z.number().int().optional(),
  content:  z.string().min(10),
})

// GET /api/knowledge
knowledgeRouter.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.knowledgeDocument.findMany({
      where:   { isActive: true },
      select: {
        id: true, title: true, type: true,
        brand: true, model: true, yearFrom: true, yearTo: true,
        createdAt: true,
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(docs)
  } catch (err) { next(err) }
})

// POST /api/knowledge — crear y indexar documento (solo admin)
knowledgeRouter.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = docSchema.parse(req.body)
    const doc  = await prisma.knowledgeDocument.create({ data })

    // Indexar chunks en background
    ragService.indexDocument(doc.id).catch(console.error)

    res.status(201).json({ ...doc, message: 'Documento creado. Indexando en segundo plano…' })
  } catch (err) { next(err) }
})

// GET /api/knowledge/:id
knowledgeRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.knowledgeDocument.findUniqueOrThrow({
      where:   { id: req.params.id as string },
      include: { _count: { select: { chunks: true } } },
    })
    res.json(doc)
  } catch (err) { next(err) }
})

// DELETE /api/knowledge/:id (solo admin)
knowledgeRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.knowledgeDocument.update({
      where: { id: req.params.id as string },
      data:  { isActive: false },
    })
    res.json({ message: 'Documento desactivado' })
  } catch (err) { next(err) }
})

// POST /api/knowledge/query — probar búsqueda RAG (solo admin)
knowledgeRouter.post('/query', requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, brand, model } = z.object({
      query: z.string().min(1),
      brand: z.string().optional(),
      model: z.string().optional(),
    }).parse(req.body)

    const results = await ragService.retrieve(query, { brand, model })
    res.json({ query, results })
  } catch (err) { next(err) }
})
