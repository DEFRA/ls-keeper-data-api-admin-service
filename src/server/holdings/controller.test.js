import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import {
  isValidCphSegments,
  transformHoldingDetail,
  transformHoldingList
} from './controller.js'

const holdingDetail = {
  identifier: '13/169/0007',
  holdingType: 'AH',
  name: 'Green Fields',
  startDate: '2020-01-15T00:00:00Z',
  endDate: null,
  location: {
    osMapReference: 'NY1234567890',
    easting: 123456,
    northing: 654321,
    address: {
      udprn: 123456789,
      addressLine1: 'Farm House',
      addressLine2: 'Green Lane',
      postTown: 'Anytown',
      locality: 'Anycounty',
      postcode: 'AB12 3CD',
      country: 'UK'
    }
  },
  associations: [
    {
      customerNumber: 'C123456',
      title: 'Mr',
      firstName: 'John',
      lastName: 'Smith',
      name: null,
      partyType: 'Individual',
      email: 'john@example.com',
      mobile: null,
      telephone: '01234 567890',
      address: {
        addressLine1: '10 Main Street',
        addressLine2: null,
        addressTown: 'Hometown',
        addressLocality: 'County',
        addressNation: 'England',
        addressPostcode: 'AB12 3CD',
        addressCountryCode: 'GB'
      },
      roles: [{ code: 'OWNER', species: ['Cattle', 'Sheep'] }]
    }
  ],
  allowedSpecies: ['Cattle', 'Sheep'],
  marks: [
    {
      mark: '123456',
      startDate: '2020-02-01T00:00:00Z',
      endDate: null,
      species: ['Cattle']
    }
  ]
}

describe('#transformHoldingList', () => {
  test('Should return empty results when there is no data', () => {
    expect(transformHoldingList(null)).toEqual({
      holdings: [],
      pagination: null
    })
  })

  test('Should map holdings and pagination metadata', () => {
    const result = transformHoldingList({
      count: 1,
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      values: [holdingDetail]
    })

    expect(result.holdings).toEqual([
      {
        identifier: '13/169/0007',
        name: 'Green Fields',
        holdingType: 'AH',
        startDate: '2020-01-15T00:00:00Z',
        endDate: null,
        partyCount: 1
      }
    ])
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalCount: 1,
      hasNextPage: false,
      hasPreviousPage: false
    })
  })

  test('Should fall back to a dash for missing values', () => {
    const result = transformHoldingList({
      values: [{ identifier: '22/100/0001' }]
    })

    expect(result.holdings[0]).toEqual({
      identifier: '22/100/0001',
      name: '—',
      holdingType: '—',
      startDate: null,
      endDate: null,
      partyCount: 0
    })
  })
})

describe('#transformHoldingDetail', () => {
  test('Should return null when there is no data', () => {
    expect(transformHoldingDetail(null)).toBeNull()
  })

  test('Should flatten the holding for the template', () => {
    const result = transformHoldingDetail(holdingDetail)

    expect(result.identifier).toBe('13/169/0007')
    expect(result.location.address.postcode).toBe('AB12 3CD')
    expect(result.allowedSpecies).toEqual(['Cattle', 'Sheep'])
    expect(result.marks[0].species).toBe('Cattle')
  })

  test('Should build a name from the title and name parts when name is absent', () => {
    const result = transformHoldingDetail(holdingDetail)

    expect(result.associations[0].name).toBe('Mr John Smith')
    expect(result.associations[0].address).toBe(
      '10 Main Street, Hometown, County, AB12 3CD'
    )
    expect(result.associations[0].roles).toEqual([
      { code: 'OWNER', species: 'Cattle, Sheep' }
    ])
  })

  test('Should prefer the supplied name over the name parts', () => {
    const result = transformHoldingDetail({
      ...holdingDetail,
      associations: [{ ...holdingDetail.associations[0], name: 'Smith Farms' }]
    })

    expect(result.associations[0].name).toBe('Smith Farms')
  })

  test('Should cope with a holding that has no location or collections', () => {
    const result = transformHoldingDetail({ identifier: '13/169/0007' })

    expect(result.location).toBeNull()
    expect(result.associations).toEqual([])
    expect(result.allowedSpecies).toEqual([])
    expect(result.marks).toEqual([])
  })
})

describe('#isValidCphSegments', () => {
  test.each([
    [{ county: '13', parish: '169', holding: '0007' }, true],
    [{ county: '1', parish: '169', holding: '0007' }, false],
    [{ county: '13', parish: '16', holding: '0007' }, false],
    [{ county: '13', parish: '169', holding: '007' }, false],
    [{ county: '..', parish: '169', holding: '0007' }, false]
  ])('Should validate %o as %s', (params, expected) => {
    expect(isValidCphSegments(params)).toBe(expected)
  })
})

describe('#holdingsRoutes', () => {
  let server

  const asAdmin = { strategy: 'session', credentials: { user: 'admin' } }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should serve the holdings list page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/holdings',
      auth: asAdmin
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toEqual(expect.stringContaining('Holdings v2'))
  })

  test('Should return not found for a malformed CPH', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/holdings/1/169/0007',
      auth: asAdmin
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })
})
