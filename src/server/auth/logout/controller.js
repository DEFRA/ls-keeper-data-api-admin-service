export const logoutController = {
  handler(request, h) {
    request.yar.reset()
    return h.redirect('/auth/login')
  }
}
