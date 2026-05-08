import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // App errors conocidos
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error:   err.message,
      code:    err.code,
    })
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error:  'Datos inválidos',
      fields: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El registro ya existe (duplicado)' })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
  }

  // Unhandled
  logger.error(err.message, { stack: err.stack })
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  })
}
