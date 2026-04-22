import { getFlash } from '../common/helpers/flash.js'

export function transformSiteList(data) {
  if (!data?.values) return { sites: [], pagination: null }

  return {
    sites: data.values.map((s) => ({
      id: s.id,
      name: s.name ?? '—',
      type: s.type == null ? '—' : s.type.name ?? '—',
      siteIdentifier: s.identifiers?.[0]?.identifier ?? '—',
      state: s.state ?? '—'
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

export function transformSiteDetail(data) {
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    state: data.state,
    source: data.source,
    type: data.type?.name,
    destroyIdentityDocumentsFlag: data.destroyIdentityDocumentsFlag,
    lastUpdatedDate: data.lastUpdatedDate,
    location: data.location
      ? {
          osMapReference: data.location.osMapReference,
          easting: data.location.easting,
          northing: data.location.northing,
          address: data.location.address
            ? {
                addressLine1: data.location.address.addressLine1,
                addressLine2: data.location.address.addressLine2,
                postTown: data.location.address.postTown,
                county: data.location.address.county,
                postcode: data.location.address.postcode,
                country: data.location.address.country?.name
              }
            : null
        }
      : null,
    identifiers: (data.identifiers ?? []).map((i) => ({
      identifier: i.identifier,
      typeCode: i.type?.code,
      typeName: i.type?.name
    })),
    parties: (data.parties ?? []).map((p) => ({
      id: p.id,
      name: [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || '—',
      customerNumber: p.customerNumber,
      type: p.partyType,
      roles: (p.partyRoles ?? []).map((r) => r.role?.name).join(', ')
    })),
    species: (data.species ?? []).map((sp) => ({
      speciesCode: sp.code,
      speciesName: sp.name,
      startDate: sp.startDate,
      endDate: sp.endDate
    })),
    marks: (data.marks ?? []).map((m) => ({
      mark: m.mark,
      species: (m.species ?? []).map((s) => s.name).join(', '),
      startDate: m.startDate,
      endDate: m.endDate
    })),
    activities: (data.activities ?? []).map((a) => ({
      typeCode: a.activityType?.typeCode,
      typeName: a.activityType?.typeName,
      startDate: a.startDate,
      endDate: a.endDate
    }))
  }
}

function buildQueryString(query) {
  const params = new URLSearchParams()
  const fields = [
    'SiteIdentifier',
    'Type',
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

export const listSitesController = {
  async handler(request, h) {
    const qs = buildQueryString(request.query)
    let result = { sites: [], pagination: null }
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/sites${qs ? '?' + qs : ''}`
      )
      if (data) {
        result = transformSiteList(data)
      }
    } catch {
      apiError = true
    }

    const filterQs = new URLSearchParams()
    if (request.query.SiteIdentifier) {
      filterQs.set('SiteIdentifier', request.query.SiteIdentifier)
    }
    if (request.query.Type) filterQs.set('Type', request.query.Type)
    if (request.query.LastUpdatedDate) {
      filterQs.set('LastUpdatedDate', request.query.LastUpdatedDate)
    }

    return h.view('sites/list', {
      pageTitle: 'Sites',
      heading: 'Sites',
      flash: getFlash(request),
      sites: result.sites,
      pagination: result.pagination,
      paginationBaseUrl: `/sites?${filterQs.toString()}`,
      filters: request.query,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Sites' }]
    })
  }
}

export const siteDetailController = {
  async handler(request, h) {
    let site = null
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/sites/${request.params.id}`
      )
      if (data) {
        site = transformSiteDetail(data)
      }
    } catch {
      apiError = true
    }

    if (!site && !apiError) {
      return h
        .view('error/index', {
          pageTitle: 'Not found',
          heading: 404,
          message: 'Site not found'
        })
        .code(404)
    }

    return h.view('sites/detail', {
      pageTitle: site?.name ?? 'Site detail',
      heading: site?.name ?? 'Site detail',
      site,
      apiError,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Sites', href: '/sites' },
        { text: site?.name ?? 'Detail' }
      ]
    })
  }
}
