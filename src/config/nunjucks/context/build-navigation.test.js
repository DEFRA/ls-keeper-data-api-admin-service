import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    const result = buildNavigation(mockRequest({ path: '/non-existent-path' }))
    expect(result).toEqual([
      { current: false, text: 'Home', href: '/' },
      { current: false, text: 'Sites', href: '/sites' },
      { current: false, text: 'Parties', href: '/parties' },
      { current: false, text: 'Countries', href: '/countries' },
      { current: false, text: 'Holdings v2', href: '/holdings' },
      { current: false, text: 'CPH Associations', href: '/cph-associations' },
      { current: false, text: 'Health Check', href: '/health-check' }
    ])
  })

  test('Should highlight Home when on root path', () => {
    const result = buildNavigation(mockRequest({ path: '/' }))
    expect(result[0].current).toBe(true)
    expect(result[1].current).toBe(false)
  })

  test('Should highlight Sites on sub-path /sites/123', () => {
    const result = buildNavigation(mockRequest({ path: '/sites/123' }))
    expect(result[1].current).toBe(true)
  })

  test('Should highlight Countries on sub-path /countries/456', () => {
    const result = buildNavigation(mockRequest({ path: '/countries/456' }))
    expect(result[3].current).toBe(true)
  })

  test('Should highlight Holdings v2 on sub-path /holdings/13/169/0007', () => {
    const result = buildNavigation(
      mockRequest({ path: '/holdings/13/169/0007' })
    )
    expect(result[4].current).toBe(true)
  })

  test('Should highlight CPH Associations on /cph-associations path', () => {
    const result = buildNavigation(mockRequest({ path: '/cph-associations' }))
    expect(result[5].current).toBe(true)
  })

  test('Should highlight Health Check on /health-check path', () => {
    const result = buildNavigation(mockRequest({ path: '/health-check' }))
    expect(result[6].current).toBe(true)
  })
})
