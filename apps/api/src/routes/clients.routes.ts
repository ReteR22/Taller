import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { AppError } from '../middlewares/errorHandler'
import { authenticate, AuthRequest } from '../middlewares/auth.middleware'

export const clientsRouter = Router()
clientsRouter.use(authenticate)

// ── Schemas ────────────────────────────────────────────────
const clientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  phone:     z.string().min(7).max(20),
  email:     z.string().email().optional().or(z.literal('')),
  address:   z.string().optional(),
  dni:       z.string().optional(),
  notes:     z.string().optional(),
})

// ── GET /api/clients ───────────────────────────────────────
clientsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query.page)  || 1
    const limit = Number(req.query.limit) || 20
    const q     = req.query.q as string | undefined
    const skip  = (page - 1) * limit

    const where = q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName:  { contains: q } },
            { phone:     { contains: q } },
            { email:     { contains: q } },
          ],
          isActive: true,
        }
      : { isActive: true }

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take:    limit,
        include: { vehicles: { select: { id: true, brand: true, model: true, plate: true } } },
        orderBy: { lastName: 'asc' },
      }),
      prisma.client.count({ where }),
    ])

    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/clients/:id ───────────────────────────────────
clientsRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUniqueOrThrow({
      where:   { id: req.params.id as string },
      include: {
        vehicles: {
          include: {
            workOrders: {
              orderBy: { createdAt: 'desc' },
              take:    5,
              select:  { id: true, number: true, status: true, total: true, entryDate: true },
            },
          },
        },
      },
    })
    res.json(client)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/clients ──────────────────────────────────────
clientsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data   = clientSchema.parse(req.body)
    const client = await prisma.client.create({ data })
    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'Client', entityId: client.id },
    })
    res.status(201).json(client)
  } catch (err) {
    next(err)
  }
})

// ── PUT /api/clients/:id ───────────────────────────────────
clientsRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data   = clientSchema.partial().parse(req.body)
    const client = await prisma.client.update({ where: { id: req.params.id as string }, data })
    res.json(client)
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/clients/:id (soft delete) ─────────────────
clientsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.client.update({ where: { id: req.params.id as string }, data: { isActive: false } })
    res.json({ message: 'Cliente eliminado correctamente' })
  } catch (err) {
    next(err)
  }
})
