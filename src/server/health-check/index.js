import {
  healthCheckController,
  holdingsProbeController,
  holdingsProbePath
} from './controller.js'

export const healthCheck = {
  plugin: {
    name: 'health-check',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/health-check',
          ...healthCheckController
        },
        {
          method: 'POST',
          path: holdingsProbePath,
          ...holdingsProbeController
        }
      ])
    }
  }
}
