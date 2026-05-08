import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma }               from '../config/database'
import { AppError }             from '../middlewares/errorHandler'
import { authenticate, requireRole } from '../middlewares/auth.middleware'
import { generateWorkOrderPDF } from '../utils/pdf.generator'

export const workOrdersRouter = Router()
workOrdersRouter.use(authenticate)

const partSchema = z.object({
  name:      z.string().min(1),
  quantity:  z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  partId:    z.string().optional(),
})
const workOrderSchema = z.object({
  vehicleId:    z.string().min(1),
  mechanicId:   z.string().min(1),
  description:  z.string().min(1),
  diagnosis:    z.string().optional(),
  observations: z.string().optional(),
  laborCost:    z.number().nonnegative().default(0),
  discount:     z.number().nonnegative().default(0),
  tax:          z.number().nonnegative().default(0),
  deliveryDate: z.string().datetime().optional(),
  parts:        z.array(partSchema).default([]),
})

async function nextOrderNumber(): Promise<string> {
  const year  = new Date().getFullYear()
  const count = await prisma.workOrder.count({ where: { number: { startsWith: `WO-${year}-` } } })
  return `WO-${year}-${String(count + 1).padStart(4,'0')}`
}
function calcTotal(parts: any[], labor: number, discount: number, tax: number) {
  return parts.reduce((s, p) => s + p.unitPrice * p.quantity, 0) + labor - discount + tax
}

// GET /api/work-orders
workOrdersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query.page)  || 1
    const limit = Number(req.query.limit) || 20
    const skip  = (page - 1) * limit
    const where: Prisma.WorkOrderWhereInput = {}
    if (req.query.status)     where.status     = req.query.status as any
    if (req.query.mechanicId) where.mechanicId = req.query.mechanicId as string
    if (req.query.vehicleId)  where.vehicleId  = req.query.vehicleId  as string
    if (req.query.from || req.query.to) {
      where.entryDate = {
        ...(req.query.from && { gte: new Date(req.query.from as string) }),
        ...(req.query.to   && { lte: new Date(req.query.to   as string) }),
      }
    }
    const [data, total] = await Promise.all([
      prisma.workOrder.findMany({
        where, skip, take: limit,
        include: {
          vehicle:  { include: { client: { select: { firstName: true, lastName: true, phone: true } } } },
          mechanic: { select: { id: true, name: true } },
          parts:    true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where }),
    ])
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

// GET /api/work-orders/:id
workOrdersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wo = await prisma.workOrder.findUniqueOrThrow({
      where:   { id: req.params.id as string },
      include: {
        vehicle:  { include: { client: true } },
        mechanic: { select: { id: true, name: true, email: true } },
        parts:    true,
      },
    })
    res.json(wo)
  } catch (err) { next(err) }
})

// POST /api/work-orders
workOrdersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto    = workOrderSchema.parse(req.body)
    const number = await nextOrderNumber()
    const total  = calcTotal(dto.parts, dto.laborCost, dto.discount, dto.tax)
    const wo = await prisma.workOrder.create({
      data: {
        number, vehicleId: dto.vehicleId, mechanicId: dto.mechanicId,
        description: dto.description, diagnosis: dto.diagnosis, observations: dto.observations,
        laborCost: dto.laborCost, discount: dto.discount, tax: dto.tax, total,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        parts: { create: dto.parts.map(p => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice, subtotal: p.unitPrice * p.quantity, partId: p.partId })) },
      },
      include: { parts: true, vehicle: { include: { client: true } }, mechanic: { select: { id: true, name: true } } },
    })
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'CREATE', entity: 'WorkOrder', entityId: wo.id, details: { number } } })
    res.status(201).json(wo)
  } catch (err) { next(err) }
})

// PATCH /api/work-orders/:id/status
workOrdersRouter.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.enum(['PENDING','IN_PROGRESS','WAITING_PARTS','COMPLETED','DELIVERED','CANCELLED']) }).parse(req.body)
    const wo = await prisma.workOrder.update({ where: { id: req.params.id as string }, data: { status } })
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'STATUS_CHANGE', entity: 'WorkOrder', entityId: wo.id, details: { status } } })
    res.json(wo)
  } catch (err) { next(err) }
})

// PATCH /api/work-orders/:id/payment
workOrdersRouter.patch('/:id/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isPaid } = z.object({ isPaid: z.boolean() }).parse(req.body)
    const wo = await prisma.workOrder.update({ where: { id: req.params.id as string }, data: { isPaid } })
    res.json(wo)
  } catch (err) { next(err) }
})

// DELETE /api/work-orders/:id
workOrdersRouter.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.workOrder.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Orden eliminada' })
  } catch (err) { next(err) }
})

// GET /api/work-orders/:id/pdf
workOrdersRouter.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wo = await prisma.workOrder.findUniqueOrThrow({
      where:   { id: req.params.id as string },
      include: { vehicle: { include: { client: true } }, mechanic: { select: { name: true } }, parts: true },
    })
    await generateWorkOrderPDF(wo as any, res)
  } catch (err) { next(err) }
})
