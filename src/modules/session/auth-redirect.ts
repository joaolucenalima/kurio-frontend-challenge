const baseUrl = 'https://kurio.local'

export function authRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  try {
    const url = new URL(value, baseUrl)
    if (url.origin !== baseUrl) return '/'
    const pathname = decodeURIComponent(url.pathname)
      .replace(/\\/g, '/')
      .replace(/\/+$/, '')
      .toLowerCase()
    if (pathname === '/login' || pathname === '/signup') return '/'
    url.searchParams.delete('redirect')
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
