import crumb from '@hapi/crumb'

export const csrf = {
  plugin: crumb,
  options: {
    cookieOptions: {
      isSecure: process.env.NODE_ENV === 'production'
    }
  }
}
