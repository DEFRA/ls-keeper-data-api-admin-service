import { getFlash } from '../common/helpers/flash.js'

const dash = '—'

export const orderOptions = [
  { value: 'cph', text: 'CPH' },
  { value: 'name', text: 'Name' },
  { value: 'holdingType', text: 'Type' },
  { value: 'startDate', text: 'Start date' },
  { value: 'endDate', text: 'End date' }
]

export const pageSizeOptions = ['10', '25', '50', '100']

const cphSegmentPatterns = {
  county: /^\d{2}$/,
  parish: /^\d{3}$/,
  holding: /^\d{4}$/
}

export function isValidCphSegments({ county, parish, holding }) {
  return (
    cphSegmentPatterns.county.test(county) &&
    cphSegmentPatterns.parish.test(parish) &&
    cphSegmentPatterns.holding.test(holding)
  )
}

function personName(association) {
  return (
    association.name ??
    [association.title, association.firstName, association.lastName]
      .filter(Boolean)
      .join(' ')
  )
}

export function transformHoldingList(data) {
  if (!data?.values) return { holdings: [], pagination: null }

  return {
    holdings: data.values.map((h) => ({
      identifier: h.identifier,
      name: h.name ?? dash,
      holdingType: h.holdingType ?? dash,
      startDate: h.startDate ?? null,
      endDate: h.endDate ?? null,
      partyCount: (h.associations ?? []).length
    })),
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
      totalCount: data.totalCount,
      hasNextPage: data.hasNextPage,
      hasPreviousPage: data.hasPreviousPage
    }
  }
}

export function transformHoldingDetail(data) {
  if (!data) return null

  return {
    identifier: data.identifier,
    holdingType: data.holdingType,
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location
      ? {
          osMapReference: data.location.osMapReference,
          easting: data.location.easting,
          northing: data.location.northing,
          address: data.location.address
            ? {
                udprn: data.location.address.udprn,
                addressLine1: data.location.address.addressLine1,
                addressLine2: data.location.address.addressLine2,
                postTown: data.location.address.postTown,
                locality: data.location.address.locality,
                postcode: data.location.address.postcode,
                country: data.location.address.country
              }
            : null
        }
      : null,
    associations: (data.associations ?? []).map((a) => ({
      customerNumber: a.customerNumber,
      name: personName(a) || dash,
      partyType: a.partyType,
      email: a.email,
      mobile: a.mobile,
      telephone: a.telephone,
      address: [
        a.address?.addressLine1,
        a.address?.addressLine2,
        a.address?.addressTown,
        a.address?.addressLocality,
        a.address?.addressPostcode
      ]
        .filter(Boolean)
        .join(', '),
      roles: (a.roles ?? []).map((r) => ({
        code: r.code,
        species: (r.species ?? []).join(', ')
      }))
    })),
    allowedSpecies: data.allowedSpecies ?? [],
    marks: (data.marks ?? []).map((m) => ({
      mark: m.mark,
      startDate: m.startDate,
      endDate: m.endDate,
      species: (m.species ?? []).join(', ')
    }))
  }
}

function buildQueryString(query) {
  const params = new URLSearchParams()

  if (query.search) params.set('search', query.search)
  if (/^\d+$/.test(query.Page ?? '')) params.set('page', query.Page)
  if (pageSizeOptions.includes(query.pageSize)) {
    params.set('pageSize', query.pageSize)
  }
  if (orderOptions.some((o) => o.value === query.order)) {
    params.set('order', query.order)
  }
  if (query.sort === 'asc' || query.sort === 'desc') {
    params.set('sort', query.sort)
  }

  return params.toString()
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  const json =
    typeof res.result === 'string' ? JSON.parse(res.result) : res.result

  return {
    ok: res.statusCode === 200,
    statusCode: res.statusCode,
    data: res.statusCode === 200 ? json : null,
    dataTimestamp: res.headers['x-data-timestamp'] ?? null
  }
}

export const listHoldingsController = {
  async handler(request, h) {
    const qs = buildQueryString(request.query)
    let result = { holdings: [], pagination: null }
    let apiError = null
    let dataTimestamp = null

    try {
      const res = await fetchJson(
        request.server,
        `/proxy/api/v2/holdings${qs ? '?' + qs : ''}`
      )

      if (res.ok) {
        result = transformHoldingList(res.data)
        dataTimestamp = res.dataTimestamp
      } else {
        apiError = { statusCode: res.statusCode }
      }
    } catch {
      apiError = { statusCode: null }
    }

    const filterQs = new URLSearchParams()
    if (request.query.search) filterQs.set('search', request.query.search)
    if (request.query.pageSize) filterQs.set('pageSize', request.query.pageSize)
    if (request.query.order) filterQs.set('order', request.query.order)
    if (request.query.sort) filterQs.set('sort', request.query.sort)

    return h.view('holdings/list', {
      pageTitle: 'Holdings v2',
      heading: 'Holdings v2',
      flash: getFlash(request),
      holdings: result.holdings,
      pagination: result.pagination,
      paginationBaseUrl: `/holdings?${filterQs.toString()}`,
      filters: request.query,
      orderOptions,
      pageSizeOptions,
      dataTimestamp,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Holdings v2' }]
    })
  }
}

export const holdingDetailController = {
  async handler(request, h) {
    const { county, parish, holding: holdingSegment } = request.params
    const cph = `${county}/${parish}/${holdingSegment}`
    let holding = null
    let apiError = null
    let dataTimestamp = null

    if (!isValidCphSegments(request.params)) {
      return h
        .view('error/index', {
          pageTitle: 'Not found',
          heading: 404,
          message: `${cph} is not a valid CPH`
        })
        .code(404)
    }

    try {
      const res = await fetchJson(
        request.server,
        `/proxy/api/v2/holdings/${county}/${parish}/${holdingSegment}`
      )

      if (res.ok) {
        holding = transformHoldingDetail(res.data)
        dataTimestamp = res.dataTimestamp
      } else if (res.statusCode !== 404) {
        apiError = { statusCode: res.statusCode }
      }
    } catch {
      apiError = { statusCode: null }
    }

    if (!holding && !apiError) {
      return h
        .view('error/index', {
          pageTitle: 'Not found',
          heading: 404,
          message: `Holding ${cph} not found`
        })
        .code(404)
    }

    return h.view('holdings/detail', {
      pageTitle: holding?.name ?? cph,
      heading: holding?.name ?? cph,
      cph,
      holding,
      dataTimestamp,
      apiError,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Holdings v2', href: '/holdings' },
        { text: cph }
      ]
    })
  }
}
