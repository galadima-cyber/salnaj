import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { env } from './env'

const logDir = path.join(process.cwd(), 'logs')

const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
      return `[${timestamp}] ${level}: ${message}${extra}`
    })
  ),
  file: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: formats.console,
    silent: env.NODE_ENV === 'test',
  }),
]

if (env.isProd()) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: formats.file,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: formats.file,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  )
}

export const logger = winston.createLogger({
  level: env.isDev() ? 'debug' : 'info',
  transports,
  exitOnError: false,
})

export default logger
