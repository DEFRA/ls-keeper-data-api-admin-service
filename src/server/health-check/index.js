import { healthCheckController } from './controller.js'

export const healthCheck = {
  plugin: {
    name: 'health-check',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/health-check',
          ...healthCheckController
        }
      ])
    }
  }
}
