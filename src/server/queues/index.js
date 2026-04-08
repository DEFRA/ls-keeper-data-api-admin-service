import {
  queuesController,
  peekController,
  redriveController,
  purgeConfirmController,
  purgeController
} from './controller.js'

export const queues = {
  plugin: {
    name: 'queues',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/queues',
          ...queuesController
        },
        {
          method: 'GET',
          path: '/queues/dead-letter/peek',
          ...peekController
        },
        {
          method: 'POST',
          path: '/queues/dead-letter/redrive',
          ...redriveController
        },
        {
          method: 'GET',
          path: '/queues/dead-letter/purge',
          ...purgeConfirmController
        },
        {
          method: 'POST',
          path: '/queues/dead-letter/purge',
          ...purgeController
        }
      ])
    }
  }
}
