import { logoutController } from './controller.js'

export const logout = {
  plugin: {
    name: 'logout',
    register(server) {
      server.route([
        {
          method: 'POST',
          path: '/auth/logout',
          options: { auth: false },
          ...logoutController
        }
      ])
    }
  }
}
