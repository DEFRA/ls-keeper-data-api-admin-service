import { getFlash, setFlash } from '../common/helpers/flash.js'

export function transformQueueStats(dlqStats, mainQueueStats) {
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
          checkedAt: mainQueueStats.checkedAt
        }
      : null
  }
}

export function transformMessages(data) {
  if (!data?.messages) return { messages: [], totalApproximateCount: 0 }

  return {
    messages: data.messages.map((m) => ({
      messageId: m.messageId,
      correlationId: m.correlationId,
      messageType: m.messageType,
      body: m.body,
      sentTimestamp: m.sentTimestamp
    })),
    totalApproximateCount: data.totalApproximateCount ?? 0,
    checkedAt: data.checkedAt
  }
}

export function transformRedriveResult(data) {
  return {
    messagesRedriven: data?.messagesRedriven ?? 0,
    messagesFailed: data?.messagesFailed ?? 0,
    messagesDuplicated: data?.messagesDuplicated ?? 0,
    messagesRemainingApprox: data?.messagesRemainingApprox ?? 0
  }
}

export function transformPurgeResult(data) {
  return {
    purged: data?.purged ?? false,
    approximateMessagesPurged: data?.approximateMessagesPurged ?? 0
  }
}

async function fetchJson(server, path) {
  const res = await server.inject({ method: 'GET', url: path })
  if (res.statusCode !== 200) return null
  return typeof res.result === 'string' ? JSON.parse(res.result) : res.result
}

export const queuesController = {
  async handler(request, h) {
    let dlqStats = null
    let mainQueueStats = null
    let apiError = false

    try {
      ;[dlqStats, mainQueueStats] = await Promise.all([
        fetchJson(request.server, '/proxy/api/admin/queues/deadletter/count'),
        fetchJson(request.server, '/proxy/api/admin/queues/main/count')
      ])
    } catch {
      apiError = true
    }

    const stats = transformQueueStats(dlqStats, mainQueueStats)

    return h.view('queues/index', {
      pageTitle: 'Queues',
      heading: 'Queue management',
      flash: getFlash(request),
      stats,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Queues' }]
    })
  }
}

export const peekController = {
  async handler(request, h) {
    const maxMessages = request.query.maxMessages || 5
    let result = { messages: [], totalApproximateCount: 0 }
    let apiError = false

    try {
      const data = await fetchJson(
        request.server,
        `/proxy/api/admin/queues/deadletter/peek?maxMessages=${maxMessages}`
      )
      if (data) {
        result = transformMessages(data)
      }
    } catch {
      apiError = true
    }

    return h.view('queues/peek', {
      pageTitle: 'Peek dead letter queue',
      heading: 'Peek dead letter queue',
      result,
      maxMessages,
      apiError,
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Queues', href: '/queues' },
        { text: 'Peek' }
      ]
    })
  }
}

export const redriveController = {
  async handler(request, h) {
    const maxMessages = request.payload?.maxMessages || 10

    const res = await request.server.inject({
      method: 'POST',
      url: `/proxy/api/admin/queues/deadletter/redrive?maxMessages=${maxMessages}`
    })

    if (res.statusCode === 200) {
      const data =
        typeof res.result === 'string' ? JSON.parse(res.result) : res.result
      const result = transformRedriveResult(data)
      setFlash(
        request,
        'success',
        `Redrive complete: ${result.messagesRedriven} redriven, ${result.messagesFailed} failed.`
      )
    } else {
      setFlash(request, 'error', 'Failed to redrive messages.')
    }

    return h.redirect('/queues')
  }
}

export const purgeConfirmController = {
  handler(request, h) {
    return h.view('queues/purge-confirm', {
      pageTitle: 'Confirm purge',
      heading: 'Are you sure you want to purge the dead letter queue?',
      breadcrumbs: [
        { text: 'Home', href: '/' },
        { text: 'Queues', href: '/queues' },
        { text: 'Purge' }
      ]
    })
  }
}

export const purgeController = {
  async handler(request, h) {
    const res = await request.server.inject({
      method: 'POST',
      url: '/proxy/api/admin/queues/deadletter/purge'
    })

    if (res.statusCode === 200) {
      const data =
        typeof res.result === 'string' ? JSON.parse(res.result) : res.result
      const result = transformPurgeResult(data)
      setFlash(
        request,
        'success',
        `Purge complete: approximately ${result.approximateMessagesPurged} messages deleted.`
      )
    } else {
      setFlash(request, 'error', 'Failed to purge dead letter queue.')
    }

    return h.redirect('/queues')
  }
}
