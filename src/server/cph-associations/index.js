import { cphAssociationsController } from './controller.js'

export const cphAssociations = {
  plugin: {
    name: 'cph-associations',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/cph-associations',
          ...cphAssociationsController
        }
      ])
    }
  }
}
