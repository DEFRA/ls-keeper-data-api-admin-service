export function buildNavigation(request) {
  return [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
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
    },
    {
      text: 'Holdings v2',
      href: '/holdings',
      current: request?.path?.startsWith('/holdings')
    },
    {
      text: 'Health Check',
      href: '/health-check',
      current: request?.path?.startsWith('/health-check')
    }
  ]
}
