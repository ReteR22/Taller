import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { authenticate } from '../middlewares/auth.middleware'

export const vehiclesRouter = Router()
vehiclesRouter.use(authenticate)

const vehicleSchema = z.object({
  clientId:   z.string().min(1),
  brand:      z.string().min(1).max(60),
  model:      z.string().min(1).max(60),
  year:       z.number().int().min(1960).max(new Date().getFullYear() + 1),
  plate:      z.string().min(1).max(15),
  vin:        z.string().max(17).optional(),
  color:      z.string().optional(),
  engineType: z.string().optional(),
  fuelType:   z.enum(['GASOLINE','DIESEL','ELECTRIC','HYBRID','GNC']).default('GASOLINE'),
  mileage:    z.number().int().min(0).optional(),
  notes:      z.string().optional(),
})

// GET /api/vehicles
vehiclesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page     = Number(req.query.page)  || 1
    const limit    = Number(req.query.limit) || 20
    const skip     = (page - 1) * limit
    const clientId = req.query.clientId as string | undefined
    const q        = req.query.q        as string | undefined

    const where: any = {}
    if (clientId) where.clientId = clientId
    if (q) where.OR = [
      { brand: { contains: q } },
      { model: { contains: q } },
      { plate: { contains: q } },
    ]

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip, take: limit,
        include: { client: { select: { id: true, firstName: true, lastName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
    ])
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

// GET /api/vehicles/:id
vehiclesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where:   { id: req.params.id as string },
      include: {
        client: true,
        workOrders: {
          orderBy: { createdAt: 'desc' }, take: 10,
          include: { mechanic: { select: { id: true, name: true } } },
        },
      },
    })
    res.json(vehicle)
  } catch (err) { next(err) }
})

// POST /api/vehicles
vehiclesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data    = vehicleSchema.parse(req.body)
    const vehicle = await prisma.vehicle.create({
      data,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    })
    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'Vehicle', entityId: vehicle.id },
    })
    res.status(201).json(vehicle)
  } catch (err) { next(err) }
})

// PUT /api/vehicles/:id
vehiclesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data    = vehicleSchema.partial().parse(req.body)
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id as string }, data })
    res.json(vehicle)
  } catch (err) { next(err) }
})

// DELETE /api/vehicles/:id
vehiclesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id as string } })
    res.json({ message: 'Vehículo eliminado' })
  } catch (err) { next(err) }
})
