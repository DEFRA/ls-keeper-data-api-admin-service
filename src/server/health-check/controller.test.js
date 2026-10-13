import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { holdingsProbePath } from './controller.js'

describe('#holdingsProbeController', () => {
  let server

  const crumbValue = 'test-crumb'

  function injectProbe(payload) {
    return server.inject({
      method: 'POST',
      url: holdingsProbePath,
      auth: { strategy: 'session', credentials: { user: 'admin' } },
      headers: { cookie: `crumb=${crumbValue}` },
      payload: { crumb: crumbValue, ...payload }
    })
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should ask for a value when the authorization header is blank', async () => {
    const { statusCode, result } = await injectProbe({ authorization: '   ' })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toEqual({
      ok: false,
      message: 'Enter an Authorization header value'
    })
  })

  test('Should reject an oversized authorization header', async () => {
    const { result } = await injectProbe({ authorization: 'x'.repeat(8193) })

    expect(result).toEqual({
      ok: false,
      message: 'Authorization header value is too long'
    })
  })

  test('Should report when no backend API base URL is configured', async () => {
    const { result } = await injectProbe({ authorization: 'Bearer token' })

    expect(result).toEqual({
      ok: false,
      message: 'No backend API base URL is configured'
    })
  })

  test('Should reject a request without a matching CSRF token', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: holdingsProbePath,
      auth: { strategy: 'session', credentials: { user: 'admin' } },
      payload: { authorization: 'Bearer token' }
    })

    expect(statusCode).toBe(statusCodes.forbidden)
  })
})
