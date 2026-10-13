import { renderPanelResult, postPanelRequest } from './panel-result.js'

function describeFailure(body) {
  if (body.statusCode === null || body.statusCode === undefined) {
    return `Request failed — ${body.message ?? 'no response from the API'}`
  }

  const hint =
    body.statusCode === 404
      ? 'admin endpoints are disabled on the backend'
      : body.statusCode === 401 || body.statusCode === 403
        ? "the backend rejected this service's credentials"
        : body.message

  return `HTTP ${body.statusCode}${hint ? ` — ${hint}` : ''}${
    body.elapsedMs ? ` (${body.elapsedMs}ms)` : ''
  }`
}

function describeSuccess(body) {
  const caches = body.results.map((result) => {
    const rows =
      result.rowCount === null || result.rowCount === undefined
        ? ''
        : ` ${result.rowCount.toLocaleString()} rows`
    return `${result.cache}: ${result.status}${rows}`
  })

  const summary = caches.length ? caches.join(' · ') : 'nothing to refresh'

  return `${summary} — HTTP ${body.statusCode} in ${body.elapsedMs.toLocaleString()}ms`
}

function initCacheRefresh(panel) {
  const button = panel.querySelector('[data-cache-refresh-submit]')
  const resultEl = panel.querySelector('[data-cache-refresh-result]')
  const endpoint = panel.dataset.endpoint
  const crumb = panel.dataset.crumb

  if (!button || !resultEl || !endpoint) return

  button.addEventListener('click', async (event) => {
    event.preventDefault()
    button.disabled = true
    renderPanelResult(
      resultEl,
      'pending',
      'Refreshing — this can take a while…'
    )

    try {
      const body = await postPanelRequest(endpoint, crumb)

      renderPanelResult(
        resultEl,
        body.ok ? 'success' : 'error',
        body.ok ? describeSuccess(body) : describeFailure(body)
      )
    } catch (error) {
      renderPanelResult(
        resultEl,
        'error',
        `Could not run the refresh — ${error.message}`
      )
    } finally {
      button.disabled = false
    }
  })
}

export function createCacheRefresh() {
  document
    .querySelectorAll('[data-module="cache-refresh"]')
    .forEach(initCacheRefresh)
}
