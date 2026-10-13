const resultClasses = {
  pending: 'app-health-panel__result--pending',
  success: 'app-health-panel__result--success',
  error: 'app-health-panel__result--error'
}

function render(resultEl, state, message) {
  resultEl.className = `app-health-panel__result ${resultClasses[state]}`
  resultEl.textContent = message
}

function describeFailure(body) {
  if (body.statusCode === null) {
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
    render(resultEl, 'pending', 'Checking…')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorization: input.value, crumb })
      })

      if (!response.ok) {
        render(
          resultEl,
          'error',
          `Could not run the check — the admin service returned HTTP ${response.status}`
        )
        return
      }

      const body = await response.json()

      render(
        resultEl,
        body.ok ? 'success' : 'error',
        body.ok ? describeSuccess(body) : describeFailure(body)
      )
    } catch (error) {
      render(resultEl, 'error', `Could not run the check — ${error.message}`)
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
