import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/database'
import { AppError } from '../middlewares/errorHandler'
import { authenticate, AuthRequest } from '../middlewares/auth.middleware'

export const authRouter = Router()

// ── Schemas ────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})

// ── POST /api/auth/login ───────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      throw new AppError(401, 'Credenciales inválidas')
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) throw new AppError(401, 'Credenciales inválidas')

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    )

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId:   user.id,
        action:   'LOGIN',
        entity:   'User',
        entityId: user.id,
        ip:       req.ip,
      },
    })

    res.json({
      token,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/auth/me ───────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/auth/logout ──────────────────────────────────
authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        entity: 'User',
        ip:     req.ip,
      },
    })
    res.json({ message: 'Sesión cerrada correctamente' })
  } catch (err) {
    next(err)
  }
})
