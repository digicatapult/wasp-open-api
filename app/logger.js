import pino from 'pino'
import env from './env.js'

const { SERVICE_TYPE, LOG_LEVEL } = env

const logger = pino(
  {
    name: SERVICE_TYPE,
    level: LOG_LEVEL,
  },
  process.stdout
)

logger.debug('Environment variables: %j', { ...env })

export default logger
