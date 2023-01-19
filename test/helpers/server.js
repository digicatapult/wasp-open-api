import request from 'supertest'

import { createHttpServer } from '../../app/server.js'

let server = null
const setupServer = async (context) => {
  if (!server) {
    server = await createHttpServer()
  }
  context.request = request(server.app)
}

export { setupServer }
