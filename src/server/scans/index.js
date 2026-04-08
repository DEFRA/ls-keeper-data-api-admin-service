import {
  scansController,
  startCtsScanController,
  startSamScanController
} from './controller.js'

export const scans = {
  plugin: {
    name: 'scans',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/scans',
          ...scansController
        },
        {
          method: 'POST',
          path: '/scans/cts',
          ...startCtsScanController
        },
        {
          method: 'POST',
          path: '/scans/sam',
          ...startSamScanController
        }
      ])
    }
  }
}
