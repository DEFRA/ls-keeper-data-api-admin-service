import { getFlash } from '../common/helpers/flash.js'

export function transformCountryList(data) {
  if (!data?.values) return { countries: [], pagination: null }

  return {
    countries: data.values.map((c) => ({
      id: c.id,
      code: c.code ?? '—',
      name: c.name ?? '—',
      longName: c.longName ?? '—',
      euTradeMemberFlag: c.euTradeMemberFlag,
      devolvedAuthorityFlag: c.devolvedAuthorityFlag
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

export function transformCountryDetail(data) {
  if (!data) return null

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    longName: data.longName,
    euTradeMemberFlag: data.euTradeMemberFlag,
    devolvedAuthorityFlag: data.devolvedAuthorityFlag,
    lastUpdatedDate: data.lastModifiedDate ?? data.lastUpdatedDate
  }
}

function buildQueryString(query) {
  const params = new URLSearchParams()
  const fields = [
    'Name',
    'Code',
    'EuTradeMember',
    'DevolvedAuthority',
    'Page',
    'PageSize',
    'Order',
    'Sort',
    'LastUpdatedDate'
  ]

  for (const field of fields) {
    if (query[field] !== undefined && query[field] !== '') {
      params.set(field, query[field])
    }
  }

  return params.toString()
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  if (res.statusCode !== 200) return null
  return typeof res.result === 'string' ? JSON.parse(res.result) : res.result
}

export const listCountriesController = {
  async handler(request, h) {
    const qs = buildQueryString(request.query)
    let result = { countries: [], pagination: null }
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/countries${qs ? '?' + qs : ''}`
      )
      if (data) {
        result = transformCountryList(data)
      }
    } catch {
      apiError = true
    }

    const filterQs = new URLSearchParams()
    if (request.query.Name) filterQs.set('Name', request.query.Name)
    if (request.query.Code) filterQs.set('Code', request.query.Code)
    if (request.query.EuTradeMember) {
      filterQs.set('EuTradeMember', request.query.EuTradeMember)
    }
    if (request.query.DevolvedAuthority) {
      filterQs.set('DevolvedAuthority', request.query.DevolvedAuthority)
    }
    if (request.query.LastUpdatedDate) {
      filterQs.set('LastUpdatedDate', request.query.LastUpdatedDate)
    }

    return h.view('countries/list', {
      pageTitle: 'Countries',
      heading: 'Countries',
      flash: getFlash(request),
      countries: result.countries,
      pagination: result.pagination,
      paginationBaseUrl: `/countries?${filterQs.toString()}`,
      filters: request.query,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Countries' }]
    })
  }
}

export const countryDetailController = {
  async handler(request, h) {
    let country = null
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/countries/${request.params.id}`
      )
      if (data) {
        country = transformCountryDetail(data)
      }
    } catch {
      apiError = true
    }

    if (!country && !apiError) {
      return h
        .view('error/index', {
          pageTitle: 'Not found',
          heading: 404,
          message: 'Country not found'
        })
        .code(404)
    }

    return h.view('countries/detail', {
      pageTitle: country?.name ?? 'Country detail',
      heading: country?.name ?? 'Country detail',
      country,
      apiError,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Countries', href: '/countries' },
        { text: country?.name ?? 'Detail' }
      ]
    })
  }
}
