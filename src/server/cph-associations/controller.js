import { getFlash } from '../common/helpers/flash.js'

const cphPattern = /^(\d{2})\/(\d{3})\/(\d{4})$/

export function transformAssociations(data) {
  if (!Array.isArray(data)) return []

  return data.map((association) => ({
    cph: association.cph,
    role: association.role ?? '—',
    holdingHref: cphPattern.test(association.cph ?? '')
      ? `/holdings/${association.cph}`
      : null
  }))
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  let data = null

  if (typeof res.result === 'object' && res.result !== null) {
    data = res.result
  } else if (typeof res.result === 'string' && res.result) {
    try {
      data = JSON.parse(res.result)
    } catch {
      // not JSON
    }
  }

  return {
    ok: res.statusCode === 200,
    statusCode: res.statusCode,
    data,
    message: data?.detail ?? data?.title ?? null
  }
}

export const cphAssociationsController = {
  async handler(request, h) {
    const email = (request.query.email ?? '').trim()
    let associations = []
    let apiError = null

    if (email) {
      try {
        const res = await fetchJson(
          request.server,
          `/proxy/api/v2/cph-associations?Email=${encodeURIComponent(email)}`
        )

        if (res.ok) {
          associations = transformAssociations(res.data)
        } else {
          apiError = { statusCode: res.statusCode, message: res.message }
        }
      } catch (err) {
        apiError = { statusCode: null, message: err.message }
      }
    }

    return h.view('cph-associations/index', {
      pageTitle: 'CPH Associations',
      heading: 'CPH Associations',
      flash: getFlash(request),
      email,
      searched: Boolean(email),
      associations,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'CPH Associations' }]
    })
  }
}
