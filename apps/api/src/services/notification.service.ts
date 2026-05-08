import { prisma } from '../config/database'

export async function notifyAllSuppliers(
  requestId: string,
  requestTitle: string
) {
  const suppliers = await prisma.user.findMany({
    where: { role: 'SUPPLIER', isActive: true },
    select: { id: true },
  })

  if (suppliers.length === 0) return

  await prisma.notification.createMany({
    data: suppliers.map(s => ({
      userId: s.id,
      title:  'Nueva solicitud de repuesto',
      body:   `Se publicó una nueva solicitud: "${requestTitle}"`,
      link:   `/app/forum?request=${requestId}`,
    })),
  })
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({
    data: { userId, title, body, link },
  })
}
