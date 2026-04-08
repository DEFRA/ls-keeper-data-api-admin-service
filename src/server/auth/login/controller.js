import { validateLogin } from '../../common/helpers/auth.js'

export const loginGetController = {
  handler(_request, h) {
    return h.view('auth/login/index', {
      pageTitle: 'Sign in'
    })
  }
}

export const loginPostController = {
  handler(request, h) {
    const { username, password } = request.payload ?? {}

    if (!validateLogin(username, password)) {
      return h.view('auth/login/index', {
        pageTitle: 'Sign in',
        errorMessage: 'Invalid username or password',
        username
      })
    }

    request.yar.set('authenticated', true)
    return h.redirect('/')
  }
}
