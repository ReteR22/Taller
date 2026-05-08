import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middlewares/auth.middleware'

export const reportsRouter = Router()
reportsRouter.use(authenticate)

// GET /api/reports/monthly?year=2025&month=1
reportsRouter.get('/monthly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year  = Number(req.query.year)  || new Date().getFullYear()
    const month = Number(req.query.month) || new Date().getMonth() + 1
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59)

    const [agg, byStatus, topMechanics] = await Promise.all([
      prisma.workOrder.aggregate({
        where:  { entryDate: { gte: start, lte: end } },
        _sum:   { total: true, laborCost: true, discount: true },
        _count: { id: true },
        _avg:   { total: true },
      }),
      prisma.workOrder.groupBy({
        by:    ['status'],
        where: { entryDate: { gte: start, lte: end } },
        _count: { id: true },
        _sum:   { total: true },
      }),
      prisma.workOrder.groupBy({
        by:    ['mechanicId'],
        where: { entryDate: { gte: start, lte: end }, status: { in: ['COMPLETED','DELIVERED'] } },
        _count: { id: true },
        _sum:   { laborCost: true },
        orderBy: { _sum: { laborCost: 'desc' } },
        take:   5,
      }),
    ])

    // Enriquecer mecánicos
    const mechanicIds   = topMechanics.map(m => m.mechanicId)
    const mechanics     = await prisma.user.findMany({
      where:  { id: { in: mechanicIds } },
      select: { id: true, name: true },
    })
    const mechanicsMap  = Object.fromEntries(mechanics.map(m => [m.id, m.name]))

    res.json({
      period:       `${year}-${String(month).padStart(2,'0')}`,
      totalRevenue: Number(agg._sum.total     || 0),
      totalLabor:   Number(agg._sum.laborCost || 0),
      totalDiscount:Number(agg._sum.discount  || 0),
      totalOrders:  agg._count.id,
      avgOrderValue:Number(agg._avg.total     || 0),
      byStatus,
      topMechanics: topMechanics.map(m => ({
        mechanicId:   m.mechanicId,
        mechanicName: mechanicsMap[m.mechanicId] || 'Desconocido',
        orders:       m._count.id,
        labor:        Number(m._sum.laborCost || 0),
      })),
    })
  } catch (err) { next(err) }
})

// GET /api/reports/revenue?from=&to=
reportsRouter.get('/revenue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), 0, 1)
    const to   = req.query.to   ? new Date(req.query.to   as string) : new Date()

    // Agrupar por mes
    const orders = await prisma.workOrder.findMany({
      where:   { entryDate: { gte: from, lte: to }, status: { in: ['COMPLETED','DELIVERED'] } },
      select:  { entryDate: true, total: true, laborCost: true },
      orderBy: { entryDate: 'asc' },
    })

    // Agregar por mes
    const monthly: Record<string, { month: string; revenue: number; labor: number; count: number }> = {}
    for (const o of orders) {
      const key = `${o.entryDate.getFullYear()}-${String(o.entryDate.getMonth()+1).padStart(2,'0')}`
      if (!monthly[key]) monthly[key] = { month: key, revenue: 0, labor: 0, count: 0 }
      monthly[key].revenue += Number(o.total)
      monthly[key].labor   += Number(o.laborCost)
      monthly[key].count++
    }

    res.json(Object.values(monthly))
  } catch (err) { next(err) }
})

// GET /api/reports/top-clients
reportsRouter.get('/top-clients', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 10

    const result = await prisma.workOrder.groupBy({
      by:    ['vehicleId'],
      where: { status: { in: ['COMPLETED','DELIVERED'] } },
      _sum:  { total: true },
      _count:{ id: true },
      orderBy: { _sum: { total: 'desc' } },
      take:  limit,
    })

    // Enriquecer con datos del vehículo y cliente
    const vehicleIds = result.map(r => r.vehicleId)
    const vehicles   = await prisma.vehicle.findMany({
      where:   { id: { in: vehicleIds } },
      include: { client: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    })
    const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]))

    res.json(result.map(r => ({
      vehicle:    vMap[r.vehicleId],
      totalSpent: Number(r._sum.total || 0),
      orders:     r._count.id,
    })).filter(r => r.vehicle))
  } catch (err) { next(err) }
})

// GET /api/reports/summary
reportsRouter.get('/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now          = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [thisMonth, lastMonth, totalClients, pendingOrders] = await Promise.all([
      prisma.workOrder.aggregate({
        where:  { entryDate: { gte: thisMonthStart }, status: { in: ['COMPLETED','DELIVERED'] } },
        _sum:   { total: true, laborCost: true },
        _count: { id: true },
      }),
      prisma.workOrder.aggregate({
        where:  { entryDate: { gte: lastMonthStart, lte: lastMonthEnd }, status: { in: ['COMPLETED','DELIVERED'] } },
        _sum:   { total: true },
        _count: { id: true },
      }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.workOrder.count({ where: { status: { in: ['PENDING','IN_PROGRESS','WAITING_PARTS'] } } }),
    ])

    const thisRevenue = Number(thisMonth._sum.total || 0)
    const lastRevenue = Number(lastMonth._sum.total || 0)
    const revenueChange = lastRevenue > 0
      ? ((thisRevenue - lastRevenue) / lastRevenue) * 100
      : 0

    res.json({
      thisMonth:    { revenue: thisRevenue, labor: Number(thisMonth._sum.laborCost || 0), orders: thisMonth._count.id },
      lastMonth:    { revenue: lastRevenue, orders: lastMonth._count.id },
      revenueChange: Math.round(revenueChange * 10) / 10,
      totalClients,
      pendingOrders,
    })
  } catch (err) { next(err) }
})
