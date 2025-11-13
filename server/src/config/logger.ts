import pino from 'pino'
import * as pinoHttpModule from 'pino-http'
import { env } from './env.js'

const pinoHttp = (pinoHttpModule as any).default || pinoHttpModule

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
})

export const httpLogger = pinoHttp({ logger })
