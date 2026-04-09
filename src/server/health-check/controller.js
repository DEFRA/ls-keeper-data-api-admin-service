import { config } from '../../config/config.js'

const apiBaseUrl = config.get('api.baseUrl')

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

export function transformQueueStats(data) {
  if (!data) return null

  return {
    queueUrl: data.queueUrl ?? null,
    approximateMessageCount: data.approximateMessageCount,
    approximateMessagesNotVisible: data.approximateMessagesNotVisible,
    approximateMessagesDelayed: data.approximateMessagesDelayed,
    checkedAt: data.checkedAt ?? null
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
    const [healthProbe, queueProbe] = await Promise.all([
      probeEndpoint(request.server, '/proxy/health'),
      probeEndpoint(request.server, '/proxy/api/admin/queues/main/count')
    ])

    const healthResult = healthProbe.ok
      ? transformHealthResults(healthProbe.json)
      : null

    const queueResult = queueProbe.ok
      ? transformQueueStats(queueProbe.json)
      : null

    return h.view('health-check/index', {
      pageTitle: 'API Health Check',
      heading: 'API Health Check',
      apiBaseUrl,
      health: {
        ...healthProbe,
        result: healthResult
      },
      queue: {
        ...queueProbe,
        result: queueResult,
        endpointPath: '/api/admin/queues/main/count'
      },
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'API Health Check' }]
    })
  }
}
