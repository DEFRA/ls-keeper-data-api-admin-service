import { loginGetController, loginPostController } from './controller.js'

export const login = {
  plugin: {
    name: 'login',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/auth/login',
          options: { auth: false },
          ...loginGetController
        },
        {
          method: 'POST',
          path: '/auth/login',
          options: { auth: false },
          ...loginPostController
        }
      ])
    }
  }
}
