import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma }                    from '../config/database'
import { AppError }                  from '../middlewares/errorHandler'
import { authenticate, requireRole } from '../middlewares/auth.middleware'
import { notifyAllSuppliers, notifyUser } from '../services/notification.service'

export const forumRouter = Router()
forumRouter.use(authenticate)

// ── Schemas ──────────────────────────────────────────────────
const requestSchema = z.object({
  title:       z.string().min(1, 'Título requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  partCode:    z.string().optional(),
  brand:       z.string().optional(),
  quantity:    z.number().int().positive().default(1),
  vehicleId:   z.string().optional(),
})

const quoteSchema = z.object({
  price:        z.number().positive('Precio requerido'),
  currency:     z.string().default('ARS'),
  deliveryDays: z.number().int().positive().optional(),
  notes:        z.string().optional(),
  availability: z.boolean().default(true),
})

const pid = (req: Request): string => req.params['id'] as string

// ── GET /api/forum/requests ───────────────────────────────────
forumRouter.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Number(req.query.page)  || 1
    const limit  = Number(req.query.limit) || 20
    const skip   = (page - 1) * limit
    const where: Prisma.PartRequestWhereInput = {}

    if (req.query.status) where.status = req.query.status as any
    if (req.query.search) {
      where.OR = [
        { title:       { contains: req.query.search as string } },
        { description: { contains: req.query.search as string } },
        { partCode:    { contains: req.query.search as string } },
        { brand:       { contains: req.query.search as string } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.partRequest.findMany({
        where, skip, take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          vehicle:   { select: { brand: true, model: true, year: true, plate: true } },
          quotes:    { select: { id: true, price: true, currency: true, supplierId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partRequest.count({ where }),
    ])

    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

// ── GET /api/forum/requests/:id ───────────────────────────────
forumRouter.get('/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.partRequest.findUniqueOrThrow({
      where:   { id: pid(req) },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        vehicle:   true,
        quotes:    {
          include: {
            supplier: { select: { id: true, name: true, email: true } },
          },
          orderBy: { price: 'asc' },
        },
      },
    })
    res.json(request)
  } catch (err) { next(err) }
})

// ── POST /api/forum/requests ─────────────────────────────────
forumRouter.post('/requests', requireRole('ADMIN', 'MECHANIC'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto     = requestSchema.parse(req.body)
    const request = await prisma.partRequest.create({
      data: {
        ...dto,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        vehicle:   { select: { brand: true, model: true, year: true, plate: true } },
        quotes:    true,
      },
    })

    // Notificar a todos los proveedores
    await notifyAllSuppliers(request.id, request.title)

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'PartRequest', entityId: request.id },
    })

    res.status(201).json(request)
  } catch (err) { next(err) }
})

// ── PATCH /api/forum/requests/:id/close ──────────────────────
forumRouter.patch('/requests/:id/close', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.partRequest.update({
      where: { id: pid(req) },
      data:  { status: 'CLOSED' },
    })
    res.json(request)
  } catch (err) { next(err) }
})

// ── POST /api/forum/requests/:id/quotes ──────────────────────
forumRouter.post('/requests/:id/quotes', requireRole('SUPPLIER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto     = quoteSchema.parse(req.body)
    const id      = pid(req)
    const request = await prisma.partRequest.findUniqueOrThrow({ where: { id } })

    if (request.status === 'CLOSED') throw new AppError(400, 'La solicitud está cerrada')

    const existing = await prisma.partQuote.findFirst({
      where: { partRequestId: id, supplierId: req.user.id },
    })
    if (existing) throw new AppError(409, 'Ya publicaste una cotización para esta solicitud')

    const quote = await prisma.partQuote.create({
      data: {
        ...dto,
        partRequestId: id,
        supplierId:    req.user.id,
      },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
      },
    })

    // Actualizar estado a QUOTED si estaba OPEN
    if (request.status === 'OPEN') {
      await prisma.partRequest.update({
        where: { id },
        data:  { status: 'QUOTED' },
      })
    }

    // Notificar al creador de la solicitud
    await notifyUser(
      request.createdById,
      'Nueva cotización recibida',
      `${req.user.name} cotizó el repuesto "${request.title}"`,
      `/app/forum?request=${id}`
    )

    res.status(201).json(quote)
  } catch (err) { next(err) }
})

// ── PATCH /api/forum/quotes/:id ───────────────────────────────
forumRouter.patch('/quotes/:id', requireRole('SUPPLIER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto   = quoteSchema.partial().parse(req.body)
    const id    = pid(req)
    const quote = await prisma.partQuote.findUniqueOrThrow({ where: { id } })

    if (quote.supplierId !== req.user.id) throw new AppError(403, 'No podés editar esta cotización')

    const updated = await prisma.partQuote.update({ where: { id }, data: dto })
    res.json(updated)
  } catch (err) { next(err) }
})

// ── DELETE /api/forum/quotes/:id ─────────────────────────────
forumRouter.delete('/quotes/:id', requireRole('SUPPLIER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id    = pid(req)
    const quote = await prisma.partQuote.findUniqueOrThrow({ where: { id } })
    if (quote.supplierId !== req.user.id) throw new AppError(403, 'No podés eliminar esta cotización')
    await prisma.partQuote.delete({ where: { id } })
    res.json({ message: 'Cotización eliminada' })
  } catch (err) { next(err) }
})

// ── GET /api/forum/notifications ─────────────────────────────
forumRouter.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    })
    res.json({ notifications, unreadCount })
  } catch (err) { next(err) }
})

// ── PATCH /api/forum/notifications/read-all ──────────────────
forumRouter.patch('/notifications/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    })
    res.json({ message: 'Notificaciones marcadas como leídas' })
  } catch (err) { next(err) }
})

// ── PATCH /api/forum/notifications/:id/read ──────────────────
forumRouter.patch('/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: pid(req), userId: req.user.id },
      data:  { isRead: true },
    })
    res.json({ message: 'OK' })
  } catch (err) { next(err) }
})
