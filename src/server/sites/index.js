import { listSitesController, siteDetailController } from './controller.js'

export const sites = {
  plugin: {
    name: 'sites',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/sites',
          ...listSitesController
        },
        {
          method: 'GET',
          path: '/sites/{id}',
          ...siteDetailController
        }
      ])
    }
  }
}
