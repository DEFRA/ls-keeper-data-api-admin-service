import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    const result = buildNavigation(mockRequest({ path: '/non-existent-path' }))
    expect(result).toEqual([
      { current: false, text: 'Home', href: '/' },
      { current: false, text: 'Scans', href: '/scans' },
      { current: false, text: 'Queues', href: '/queues' },
      { current: false, text: 'Sites', href: '/sites' },
      { current: false, text: 'Parties', href: '/parties' },
      { current: false, text: 'Countries', href: '/countries' },
      { current: false, text: 'Health Check', href: '/health-check' }
    ])
  })

  test('Should highlight Home when on root path', () => {
    const result = buildNavigation(mockRequest({ path: '/' }))
    expect(result[0].current).toBe(true)
    expect(result[1].current).toBe(false)
  })

  test('Should highlight Scans when on /scans path', () => {
    const result = buildNavigation(mockRequest({ path: '/scans' }))
    expect(result[0].current).toBe(false)
    expect(result[1].current).toBe(true)
  })

  test('Should highlight Sites on sub-path /sites/123', () => {
    const result = buildNavigation(mockRequest({ path: '/sites/123' }))
    expect(result[3].current).toBe(true)
  })

  test('Should highlight Countries on sub-path /countries/456', () => {
    const result = buildNavigation(mockRequest({ path: '/countries/456' }))
    expect(result[5].current).toBe(true)
  })

  test('Should highlight Health Check on /health-check path', () => {
    const result = buildNavigation(mockRequest({ path: '/health-check' }))
    expect(result[6].current).toBe(true)
  })
})
