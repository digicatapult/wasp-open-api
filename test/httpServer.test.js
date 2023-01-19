import { describe, before, it } from 'mocha'
import { expect } from 'chai'

import { setupServer } from './helpers/server.js'

describe('health', function () {
  const context = {}
  before(async function () {
    await setupServer(context)
    context.response = await context.request.get('/health')
  })

  it('should return 200', function () {
    expect(context.response.status).to.equal(200)
  })

  it('should return success', function () {
    expect(context.response.body).to.deep.equal({ status: 'ok' })
  })
})

describe('API docs', async function () {
  const context = {}
  await setupServer(context)

  const apiDoc = {
    openapi: '3.0.3',
    info: 'test',
    paths: {},
  }

  describe('Set API docs', async function () {
    it('should return 400 with invalid OpenAPI doc', async function () {
      context.response = await context.request.post('/set-api-docs').send('')
      expect(context.response.status).to.equal(400)
    })

    it('should return 200 with valid OpenAPI doc', async function () {
      context.response = await context.request.post('/set-api-docs').send(apiDoc)
      expect(context.response.status).to.equal(200)
    })
  })

  describe('Get API docs', async function () {
    it('should return API docs', async function () {
      context.response = await context.request.get('/api-docs')
      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.deep.equal(apiDoc)
    })
  })
})
