import { renderPanelResult, postPanelRequest } from './panel-result.js'

function describeFailure(body) {
  if (body.statusCode === null || body.statusCode === undefined) {
    return `Request failed — ${body.message ?? 'no response from the API'}`
  }

  const hint =
    body.statusCode === 401
      ? 'the Authorization header was rejected'
      : body.statusCode === 503
        ? 'the read model cache is not loaded yet'
        : body.message

  return `HTTP ${body.statusCode}${hint ? ` — ${hint}` : ''}${
    body.elapsedMs ? ` (${body.elapsedMs}ms)` : ''
  }`
}

function describeSuccess(body) {
  const total =
    body.totalCount === null || body.totalCount === undefined
      ? ''
      : ` (${body.totalCount.toLocaleString()} total)`

  return `${body.count.toLocaleString()} holdings returned${total} — HTTP ${body.statusCode} in ${body.elapsedMs}ms`
}

function initHoldingsProbe(panel) {
  const input = panel.querySelector('#holdings-probe-authorization')
  const button = panel.querySelector('[data-holdings-probe-submit]')
  const resultEl = panel.querySelector('[data-holdings-probe-result]')
  const endpoint = panel.dataset.endpoint
  const crumb = panel.dataset.crumb

  if (!input || !button || !resultEl || !endpoint) return

  button.addEventListener('click', async (event) => {
    event.preventDefault()
    button.disabled = true
    renderPanelResult(resultEl, 'pending', 'Checking…')

    try {
      const body = await postPanelRequest(endpoint, crumb, {
        authorization: input.value
      })

      renderPanelResult(
        resultEl,
        body.ok ? 'success' : 'error',
        body.ok ? describeSuccess(body) : describeFailure(body)
      )
    } catch (error) {
      renderPanelResult(
        resultEl,
        'error',
        `Could not run the check — ${error.message}`
      )
    } finally {
      button.disabled = false
    }
  })
}

export function createHoldingsProbe() {
  document
    .querySelectorAll('[data-module="holdings-probe"]')
    .forEach(initHoldingsProbe)
}
