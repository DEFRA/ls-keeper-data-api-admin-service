import {
  listCountriesController,
  countryDetailController
} from './controller.js'

const countries = {
  plugin: {
    name: 'countries',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/countries',
          handler: listCountriesController.handler
        },
        {
          method: 'GET',
          path: '/countries/{id}',
          handler: countryDetailController.handler
        }
      ])
    }
  }
}

export { countries }
