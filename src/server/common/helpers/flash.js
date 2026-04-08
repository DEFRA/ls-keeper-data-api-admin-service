export function setFlash(request, type, message) {
  request.yar.flash('notification', { type, message })
}

export function getFlash(request) {
  const messages = request.yar.flash('notification')
  return messages.length > 0 ? messages[0] : null
}
