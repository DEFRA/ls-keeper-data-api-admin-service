import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#aboutController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('About route should no longer exist', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/about'
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })
})
