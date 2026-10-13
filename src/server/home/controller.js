import { getFlash } from '../common/helpers/flash.js'

export const sections = [
  {
    text: 'Sites',
    href: '/sites',
    description: 'Search sites and view their parties, species and marks.'
  },
  {
    text: 'Parties',
    href: '/parties',
    description: 'Search parties and view their roles and contact details.'
  },
  {
    text: 'Countries',
    href: '/countries',
    description: 'Browse the country reference data.'
  },
  {
    text: 'Holdings v2',
    href: '/holdings',
    description: 'Search holdings from the v2 SAM read model and view detail.'
  },
  {
    text: 'CPH Associations',
    href: '/cph-associations',
    description: 'Look up the CPHs and roles associated with an email address.'
  },
  {
    text: 'Health Check',
    href: '/health-check',
    description: 'Check backend API connectivity and refresh the SQLite cache.'
  }
]

export const homeController = {
  handler(request, h) {
    return h.view('home/index', {
      pageTitle: 'Dashboard',
      heading: 'Dashboard',
      flash: getFlash(request),
      sections
    })
  }
}
