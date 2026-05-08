import winston from 'winston'
import path from 'path'
import fs from 'fs'

const logDir = process.env.LOG_DIR || './logs'
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

const { combine, timestamp, printf, colorize, errors } = winston.format

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack
      ? `${timestamp} ${level}: ${message}\n${stack}`
      : `${timestamp} ${level}: ${message}`
  )
)

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
)

const customLevels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 }

export const logger = winston.createLogger({
  levels:     customLevels,
  level:      process.env.LOG_LEVEL || 'debug',
  format:     process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level:    'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
})
