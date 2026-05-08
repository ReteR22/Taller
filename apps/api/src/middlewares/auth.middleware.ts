import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AppError } from './errorHandler'

// AuthRequest kept as alias for backward compatibility (user is now on global Request)
export type AuthRequest = Request

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new AppError(401, 'Token de autenticación requerido')

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
    }

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId, isActive: true },
      select: { id: true, role: true, email: true, name: true },
    })

    if (!user) throw new AppError(401, 'Usuario no encontrado o inactivo')

    req.user = user
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(new AppError(401, 'Token inválido o expirado'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError(403, 'No tenés permisos para esta acción'))
    }
    next()
  }
}
