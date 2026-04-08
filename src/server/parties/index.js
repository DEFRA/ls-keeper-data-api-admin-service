import { listPartiesController, partyDetailController } from './controller.js'

export const parties = {
  plugin: {
    name: 'parties',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/parties',
          ...listPartiesController
        },
        {
          method: 'GET',
          path: '/parties/{id}',
          ...partyDetailController
        }
      ])
    }
  }
}
