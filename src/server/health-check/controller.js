import { config } from '../../config/config.js'

const apiBaseUrl = config.get('api.baseUrl')

export const holdingsProbePath = '/health-check/holdings-probe'

export function transformHealthResults(data) {
  if (!data) return null

  const results = Object.entries(data.results ?? {}).map(([name, check]) => ({
    name,
    status: check.status,
    description: check.description ?? null,
    durationMs: check.durationMs,
    tags: check.tags ?? [],
    data: check.data ?? {}
  }))

  return {
    status: data.status,
    durationMs: data.durationMs,
    results
  }
}

async function probeEndpoint(server, proxyPath) {
  const startMs = Date.now()
  try {
    const res = await server.inject({
      method: 'GET',
      url: proxyPath
    })
    const elapsedMs = Date.now() - startMs
    const body = typeof res.result === 'string' ? res.result : null
    let json = null

    if (
      res.statusCode === 200 &&
      typeof res.result === 'object' &&
      res.result !== null
    ) {
      json = res.result
    } else if (res.statusCode === 200 && body) {
      try {
        json = JSON.parse(body)
      } catch {
        // not JSON
      }
    }

    return {
      ok: res.statusCode === 200,
      statusCode: res.statusCode,
      elapsedMs,
      json,
      rawBody: body,
      error: null
    }
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      elapsedMs: Date.now() - startMs,
      json: null,
      rawBody: null,
      error: {
        name: err.name,
        message: err.message,
        code: err.code ?? null,
        stack: err.stack ?? null
      }
    }
  }
}

export const healthCheckController = {
  async handler(request, h) {
    const healthProbe = await probeEndpoint(request.server, '/proxy/health')

    const healthResult = healthProbe.ok
      ? transformHealthResults(healthProbe.json)
      : null

    return h.view('health-check/index', {
      pageTitle: 'API Health Check',
      heading: 'API Health Check',
      apiBaseUrl,
      health: {
        ...healthProbe,
        result: healthResult
      },
      holdingsProbePath,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'API Health Check' }]
    })
  }
}

const holdingsProbeEndpoint = '/api/v2/holdings'
const maxAuthorizationLength = 8192
const probeTimeoutMs = 15000

function problemFromBody(body) {
  try {
    const problem = JSON.parse(body)
    return problem?.detail ?? problem?.title ?? null
  } catch {
    return body ? body.slice(0, 500) : null
  }
}

// The pasted credential is forwarded verbatim to a URL fixed by config and is never
// logged, stored or returned to the browser.
export const holdingsProbeController = {
  options: {
    payload: { maxBytes: 16384 }
  },
  async handler(request, h) {
    const authorization = request.payload?.authorization

    if (typeof authorization !== 'string' || authorization.trim() === '') {
      return h.response({
        ok: false,
        message: 'Enter an Authorization header value'
      })
    }

    if (authorization.length > maxAuthorizationLength) {
      return h.response({
        ok: false,
        message: 'Authorization header value is too long'
      })
    }

    if (!apiBaseUrl) {
      return h.response({
        ok: false,
        message: 'No backend API base URL is configured'
      })
    }

    const url = `${apiBaseUrl.replace(/\/+$/, '')}${holdingsProbeEndpoint}`
    const startMs = Date.now()

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: authorization.trim(),
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(probeTimeoutMs)
      })
      const elapsedMs = Date.now() - startMs
      const body = await res.text()

      if (!res.ok) {
        return h.response({
          ok: false,
          statusCode: res.status,
          elapsedMs,
          message: problemFromBody(body)
        })
      }

      const json = JSON.parse(body)

      return h.response({
        ok: true,
        statusCode: res.status,
        elapsedMs,
        count: json.count ?? json.values?.length ?? 0,
        totalCount: json.totalCount ?? null
      })
    } catch (err) {
      request.logger.error(
        `Holdings probe to ${url} failed: ${err.name} ${err.message}`
      )

      return h.response({
        ok: false,
        statusCode: null,
        elapsedMs: Date.now() - startMs,
        message:
          err.name === 'TimeoutError'
            ? `No response within ${probeTimeoutMs / 1000} seconds`
            : err.message
      })
    }
  }
}
