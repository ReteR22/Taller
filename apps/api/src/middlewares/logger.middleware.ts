import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const ms      = Date.now() - start
    const color   = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'http'
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`
    logger.log(color, message)
  })
  next()
}
