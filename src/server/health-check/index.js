import {
  healthCheckController,
  holdingsProbeController,
  holdingsProbePath,
  cacheRefreshController,
  cacheRefreshPath
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
        },
        {
          method: 'POST',
          path: cacheRefreshPath,
          ...cacheRefreshController
        }
      ])
    }
  }
}
