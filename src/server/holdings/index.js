import {
  listHoldingsController,
  holdingDetailController
} from './controller.js'

export const holdings = {
  plugin: {
    name: 'holdings',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/holdings',
          ...listHoldingsController
        },
        {
          method: 'GET',
          path: '/holdings/{county}/{parish}/{holding}',
          ...holdingDetailController
        }
      ])
    }
  }
}
