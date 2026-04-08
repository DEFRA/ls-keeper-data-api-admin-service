import { getFlash } from '../common/helpers/flash.js'

export function transformPartyList(data) {
  if (!data?.values) return { parties: [], pagination: null }

  return {
    parties: data.values.map((p) => ({
      id: p.id,
      name: [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || '—',
      type: p.partyType ?? '—',
      customerNumber: p.customerNumber ?? '—',
      state: p.state ?? '—'
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

export function transformPartyDetail(data) {
  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    firstName: data.firstName,
    lastName: data.lastName,
    name:
      [data.title, data.firstName, data.lastName].filter(Boolean).join(' ') ||
      '—',
    type: data.partyType,
    customerNumber: data.customerNumber,
    state: data.state,
    lastUpdatedDate: data.lastUpdatedDate,
    communication:
      Array.isArray(data.communication) && data.communication.length
        ? {
            email: data.communication[0].email,
            mobile: data.communication[0].mobile,
            landline: data.communication[0].landline,
            primaryContactFlag: data.communication[0].primaryContactFlag
          }
        : null,
    correspondenceAddress: data.correspondanceAddress
      ? {
          addressLine1: data.correspondanceAddress.addressLine1,
          addressLine2: data.correspondanceAddress.addressLine2,
          postTown: data.correspondanceAddress.postTown,
          county: data.correspondanceAddress.county,
          postcode: data.correspondanceAddress.postcode,
          country: data.correspondanceAddress.country?.name
        }
      : null,
    roles: (data.partyRoles ?? []).map((r) => ({
      roleName: r.role?.name,
      roleCode: r.role?.code,
      speciesManaged: (r.speciesManagedByRole ?? [])
        .map((s) => s.name)
        .join(', ')
    }))
  }
}

function buildQueryString(query) {
  const params = new URLSearchParams()
  const fields = [
    'FirstName',
    'LastName',
    'Email',
    'Page',
    'PageSize',
    'Order',
    'Sort',
    'LastUpdatedDate'
  ]

  for (const field of fields) {
    if (query[field]) params.set(field, query[field])
  }

  return params.toString()
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  if (res.statusCode !== 200) return null
  return typeof res.result === 'string' ? JSON.parse(res.result) : res.result
}

export const listPartiesController = {
  async handler(request, h) {
    const qs = buildQueryString(request.query)
    let result = { parties: [], pagination: null }
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/parties${qs ? '?' + qs : ''}`
      )
      if (data) {
        result = transformPartyList(data)
      }
    } catch {
      apiError = true
    }

    const filterQs = new URLSearchParams()
    if (request.query.FirstName) {
      filterQs.set('FirstName', request.query.FirstName)
    }
    if (request.query.LastName) filterQs.set('LastName', request.query.LastName)
    if (request.query.Email) filterQs.set('Email', request.query.Email)
    if (request.query.LastUpdatedDate) {
      filterQs.set('LastUpdatedDate', request.query.LastUpdatedDate)
    }

    return h.view('parties/list', {
      pageTitle: 'Parties',
      heading: 'Parties',
      flash: getFlash(request),
      parties: result.parties,
      pagination: result.pagination,
      paginationBaseUrl: `/parties?${filterQs.toString()}`,
      filters: request.query,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Parties' }]
    })
  }
}

export const partyDetailController = {
  async handler(request, h) {
    let party = null
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/parties/${request.params.id}`
      )
      if (data) {
        party = transformPartyDetail(data)
      }
    } catch {
      apiError = true
    }

    if (!party && !apiError) {
      return h
        .view('error/index', {
          pageTitle: 'Not found',
          heading: 404,
          message: 'Party not found'
        })
        .code(404)
    }

    return h.view('parties/detail', {
      pageTitle: party?.name ?? 'Party detail',
      heading: party?.name ?? 'Party detail',
      party,
      apiError,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Parties', href: '/parties' },
        { text: party?.name ?? 'Detail' }
      ]
    })
  }
}
