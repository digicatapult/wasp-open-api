import express from 'express'
import pinoHttp from 'pino-http'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'

import env from './env.js'
import logger from './logger.js'

const { PORT, API_DOCS_FILE_PATH } = env

async function createHttpServer() {
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use(bodyParser.json({ type: 'application/json' }))

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ status: 'ok' })
  })

  const options = {
    swaggerOptions: {
      urls: [
        {
          url: `/api-docs`,
        },
      ],
    },
  }

  app.use(`/swagger`, swaggerUi.serve, swaggerUi.setup(null, options))

  app.post('/set-api-docs', async (req, res) => {
    // if req.body is missing the user submitted a non-json body
    if (!req.body || !req.body.openapi || !req.body.info || !req.body.paths) {
      res.status(400).send({ error: 'must be a valid OpenAPI doc' })
    } else {
      fs.writeFile(API_DOCS_FILE_PATH, JSON.stringify(req.body), (err) => {
        if (err) {
          res.status(500).send({ error: 'failed to write OpenAPI doc' })
        } else {
          res.status(200).send()
        }
      })
    }
  })

  app.get('/api-docs', async (req, res) => {
    fs.readFile(API_DOCS_FILE_PATH, (err, data) => {
      if (err) {
        res.status(500).send({ error: 'failed to read OpenAPI doc' })
      } else {
        fs.stat(API_DOCS_FILE_PATH, (err, stats) => {
          res.header('Last-Modified', stats.mtime)
          res.status(200).send(JSON.parse(data))
        })
      }
    })
  })

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.status) {
      res.status(err.status).send({ error: err.status === 401 ? 'Unauthorised' : err.message })
    } else {
      logger.error('Fallback Error %j', err.stack)
      res.status(500).send('Fatal error!')
    }
  })

  return { app }
}

/* istanbul ignore next */
async function startServer() {
  try {
    const { app } = await createHttpServer()

    const setupGracefulExit = ({ sigName, server, exitCode }) => {
      process.on(sigName, async () => {
        server.close(() => {
          process.exit(exitCode)
        })
      })
    }

    const server = await new Promise((resolve, reject) => {
      let resolved = false
      const server = app.listen(PORT, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
        logger.info(`Listening on port ${PORT} `)
        if (!resolved) {
          resolved = true
          resolve(server)
        }
      })
      server.on('error', (err) => {
        if (!resolved) {
          resolved = true
          reject(err)
        }
      })
    })

    setupGracefulExit({ sigName: 'SIGINT', server, exitCode: 0 })
    setupGracefulExit({ sigName: 'SIGTERM', server, exitCode: 143 })
  } catch (err) {
    logger.fatal('Fatal error during initialisation: %j', err.message || err)
    process.exit(1)
  }
}

export { startServer, createHttpServer }
