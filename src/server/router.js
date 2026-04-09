import inert from '@hapi/inert'

import { home } from './home/index.js'
import { health } from './health/index.js'
import { login } from './auth/login/index.js'
import { logout } from './auth/logout/index.js'
import { scans } from './scans/index.js'
import { queues } from './queues/index.js'
import { sites } from './sites/index.js'
import { parties } from './parties/index.js'
import { countries } from './countries/index.js'
import { healthCheck } from './health-check/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Auth routes (no auth required)
      await server.register([login, logout])

      // Application specific routes, add your own routes here
      await server.register([
        home,
        scans,
        queues,
        sites,
        parties,
        countries,
        healthCheck
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
