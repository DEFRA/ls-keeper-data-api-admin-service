export function buildNavigation(request) {
  return [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'Scans',
      href: '/scans',
      current: request?.path?.startsWith('/scans')
    },
    {
      text: 'Queues',
      href: '/queues',
      current: request?.path?.startsWith('/queues')
    },
    {
      text: 'Sites',
      href: '/sites',
      current: request?.path?.startsWith('/sites')
    },
    {
      text: 'Parties',
      href: '/parties',
      current: request?.path?.startsWith('/parties')
    },
    {
      text: 'Countries',
      href: '/countries',
      current: request?.path?.startsWith('/countries')
    }
  ]
}
