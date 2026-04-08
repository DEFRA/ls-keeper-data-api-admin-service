import { getFlash, setFlash } from '../common/helpers/flash.js'

export function transformScanStates(data) {
  if (!Array.isArray(data)) return []

  return data.map((s) => ({
    id: s.id,
    lastScanMode: s.lastScanMode,
    lastScanItemCount: s.lastScanItemCount ?? 0,
    lastScanCorrelationId: s.lastScanCorrelationId,
    lastSuccessfulScanStartedAt: s.lastSuccessfulScanStartedAt,
    lastSuccessfulScanCompletedAt: s.lastSuccessfulScanCompletedAt
  }))
}

export const scansController = {
  async handler(request, h) {
    let scanStates = []
    let apiError = false

    try {
      const res = await request.server.inject({
        method: 'GET',
        url: '/proxy/api/admin/scanstates'
      })

      if (res.statusCode === 200) {
        const data =
          typeof res.result === 'string' ? JSON.parse(res.result) : res.result
        scanStates = transformScanStates(data)
      }
    } catch {
      apiError = true
    }

    return h.view('scans/index', {
      pageTitle: 'Scans',
      heading: 'Scan management',
      flash: getFlash(request),
      scanStates,
      apiError,
      breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Scans' }]
    })
  }
}

export const startCtsScanController = {
  async handler(request, h) {
    const { forceBulk, sinceHours } = request.payload ?? {}

    const params = new URLSearchParams()
    if (forceBulk) params.set('forceBulk', 'true')
    if (sinceHours) params.set('sinceHours', sinceHours)

    const qs = params.toString() ? `?${params.toString()}` : ''

    const res = await request.server.inject({
      method: 'POST',
      url: `/proxy/api/import/startCtsScan${qs}`
    })

    if (res.statusCode === 202 || res.statusCode === 200) {
      setFlash(request, 'success', 'CTS scan started successfully.')
    } else if (res.statusCode === 409) {
      setFlash(request, 'warning', 'A CTS scan is already in progress.')
    } else {
      setFlash(request, 'error', 'Failed to start CTS scan.')
    }

    return h.redirect('/scans')
  }
}

export const startSamScanController = {
  async handler(request, h) {
    const { forceBulk, sinceHours } = request.payload ?? {}

    const params = new URLSearchParams()
    if (forceBulk) params.set('forceBulk', 'true')
    if (sinceHours) params.set('sinceHours', sinceHours)

    const qs = params.toString() ? `?${params.toString()}` : ''

    const res = await request.server.inject({
      method: 'POST',
      url: `/proxy/api/import/startSamScan${qs}`
    })

    if (res.statusCode === 202 || res.statusCode === 200) {
      setFlash(request, 'success', 'SAM scan started successfully.')
    } else if (res.statusCode === 409) {
      setFlash(request, 'warning', 'A SAM scan is already in progress.')
    } else {
      setFlash(request, 'error', 'Failed to start SAM scan.')
    }

    return h.redirect('/scans')
  }
}
