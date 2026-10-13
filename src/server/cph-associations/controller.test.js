import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { transformAssociations } from './controller.js'

describe('#transformAssociations', () => {
  test('Should return an empty list when the payload is not an array', () => {
    expect(transformAssociations(null)).toEqual([])
    expect(transformAssociations({})).toEqual([])
  })

  test('Should map associations and link well formed CPHs to the holding', () => {
    const result = transformAssociations([
      { cph: '57/103/2335', role: 'owner' },
      { cph: '13/169/0007', role: 'keeper' }
    ])

    expect(result).toEqual([
      {
        cph: '57/103/2335',
        role: 'owner',
        holdingHref: '/holdings/57/103/2335'
      },
      {
        cph: '13/169/0007',
        role: 'keeper',
        holdingHref: '/holdings/13/169/0007'
      }
    ])
  })

  test('Should not link a CPH which does not match the expected shape', () => {
    const result = transformAssociations([{ cph: '571032335', role: 'owner' }])

    expect(result[0].holdingHref).toBeNull()
  })

  test('Should fall back to a dash for a missing role', () => {
    const result = transformAssociations([{ cph: '57/103/2335' }])

    expect(result[0].role).toBe('—')
  })
})

describe('#cphAssociationsRoutes', () => {
  let server

  const asAdmin = { strategy: 'session', credentials: { user: 'admin' } }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should serve the search form with no results before a search', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/cph-associations',
      auth: asAdmin
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toEqual(expect.stringContaining('CPH Associations'))
    expect(result).not.toEqual(expect.stringContaining('No CPH associations'))
  })
})
