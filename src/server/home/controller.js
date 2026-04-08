import { getFlash } from '../common/helpers/flash.js'

export function transformDashboardData(dlqStats, mainQueueStats, scanStates) {
  return {
    deadLetterQueue: dlqStats
      ? {
          approximateMessageCount: dlqStats.approximateMessageCount ?? 0,
          approximateMessagesNotVisible:
            dlqStats.approximateMessagesNotVisible ?? 0,
          approximateMessagesDelayed: dlqStats.approximateMessagesDelayed ?? 0,
          checkedAt: dlqStats.checkedAt
        }
      : null,
    mainQueue: mainQueueStats
      ? {
          approximateMessageCount: mainQueueStats.approximateMessageCount ?? 0,
          approximateMessagesNotVisible:
            mainQueueStats.approximateMessagesNotVisible ?? 0,
          approximateMessagesDelayed:
            mainQueueStats.approximateMessagesDelayed ?? 0,
          checkedAt: mainQueueStats.checkedAt
        }
      : null,
    scanStates: Array.isArray(scanStates)
      ? scanStates.map((s) => ({
          id: s.id,
          lastScanMode: s.lastScanMode,
          lastScanItemCount: s.lastScanItemCount ?? 0,
          lastScanCorrelationId: s.lastScanCorrelationId,
          lastSuccessfulScanStartedAt: s.lastSuccessfulScanStartedAt,
          lastSuccessfulScanCompletedAt: s.lastSuccessfulScanCompletedAt
        }))
      : []
  }
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  if (res.statusCode !== 200) return null
  return typeof res.result === 'string' ? JSON.parse(res.result) : res.result
}

export const homeController = {
  async handler(request, h) {
    let dlqStats = null
    let mainQueueStats = null
    let scanStates = null
    let apiError = false

    try {
      ;[dlqStats, mainQueueStats, scanStates] = await Promise.all([
        fetchJson(request.server, '/proxy/api/admin/queues/deadletter/count'),
        fetchJson(request.server, '/proxy/api/admin/queues/main/count'),
        fetchJson(request.server, '/proxy/api/admin/scanstates')
      ])
    } catch {
      apiError = true
    }

    const dashboard = transformDashboardData(
      dlqStats,
      mainQueueStats,
      scanStates
    )

    return h.view('home/index', {
      pageTitle: 'Dashboard',
      heading: 'Dashboard',
      flash: getFlash(request),
      dashboard,
      apiError
    })
  }
}
