const resultClasses = {
  pending: 'app-health-panel__result--pending',
  success: 'app-health-panel__result--success',
  error: 'app-health-panel__result--error'
}

export function renderPanelResult(resultEl, state, message) {
  resultEl.className = `app-health-panel__result ${resultClasses[state]}`
  resultEl.textContent = message
}

export async function postPanelRequest(endpoint, crumb, body = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, crumb })
  })

  if (!response.ok) {
    throw new Error(`the admin service returned HTTP ${response.status}`)
  }

  return response.json()
}
