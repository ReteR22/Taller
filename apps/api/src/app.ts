import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import { authRouter }       from './routes/auth.routes'
import { clientsRouter }    from './routes/clients.routes'
import { vehiclesRouter }   from './routes/vehicles.routes'
import { workOrdersRouter } from './routes/workorders.routes'
import { reportsRouter }    from './routes/reports.routes'
import { aiRouter }         from './routes/ai.routes'
import { knowledgeRouter }  from './routes/knowledge.routes'
import { forumRouter }      from './routes/forum.routes'
import { errorHandler }     from './middlewares/errorHandler'
import { logger }           from './utils/logger'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(compression() as any)
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'MechPro API v1.0' })
})

// Routes
app.use('/api/auth',        authRouter)
app.use('/api/clients',     clientsRouter)
app.use('/api/vehicles',    vehiclesRouter)
app.use('/api/work-orders', workOrdersRouter)
app.use('/api/reports',     reportsRouter)
app.use('/api/ai',          aiRouter)
app.use('/api/knowledge',   knowledgeRouter)
app.use('/api/forum',       forumRouter)
app.use('/uploads',         express.static(process.env.UPLOAD_DIR || './uploads'))

// 404
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Error handler
app.use(errorHandler)

// Start
app.listen(PORT, () => {
  logger.info(`🚀 MechPro API  →  http://localhost:${PORT}`)
  logger.info(`📚 Entorno      →  ${process.env.NODE_ENV}`)
  logger.info(`🔗 Frontend     →  ${process.env.FRONTEND_URL}`)
})

export default app
