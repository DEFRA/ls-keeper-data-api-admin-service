import { config } from '../../../config/config.js'

const adminPassword = config.get('auth.adminPassword')

const scheme = () => ({
  authenticate(request, h) {
    if (request.yar.get('authenticated')) {
      return h.authenticated({ credentials: { user: 'admin' } })
    }

    return h.redirect('/auth/login').takeover()
  }
})

export const auth = {
  plugin: {
    name: 'auth',
    register(server) {
      server.auth.scheme('session', scheme)
      server.auth.strategy('session', 'session')
      server.auth.default('session')
    }
  }
}

export function validateLogin(username, password) {
  return username === 'admin' && password === adminPassword
}
