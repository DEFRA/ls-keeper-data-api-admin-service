import h2o2 from '@hapi/h2o2'

import { config } from '../../../../config/config.js'

const apiBaseUrl = config.get('api.baseUrl').replace(/\/+$/, '')
const authHeader = config.get('api.authHeader')
const apiKey = config.get('api.apiKey')

function mapUri(request) {
  const path = request.params.path ?? ''
  const upstream = path ? `${apiBaseUrl}/${path}` : apiBaseUrl
  const qs = request.url.search ?? ''

  const headers = {}

  if (authHeader) {
    headers.Authorization = `Basic ${authHeader}`
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  return { uri: `${upstream}${qs}`, headers }
}

export const apiProxy = {
  plugin: {
    name: 'api-proxy',
    async register(server) {
      await server.register(h2o2)

      server.route([
        {
          method: 'GET',
          path: '/proxy/{path*}',
          options: { auth: false },
          handler: {
            proxy: {
              mapUri,
              passThrough: true
            }
          }
        },
        {
          method: 'POST',
          path: '/proxy/{path*}',
          options: { auth: false, plugins: { crumb: false } },
          handler: {
            proxy: {
              mapUri,
              passThrough: true
            }
          }
        }
      ])
    }
  }
}
