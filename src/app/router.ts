import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    // Search contracts are flat; route validators convert values such as page.
    parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
    stringifySearch: (search) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(search)) {
        if (value !== undefined && value !== null) params.set(key, String(value))
      }
      const encoded = params.toString()
      return encoded ? `?${encoded}` : ''
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
