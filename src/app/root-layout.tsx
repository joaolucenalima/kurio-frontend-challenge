import { lazy, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import { SiteFooter } from '#/shared/components/footer'

const Devtools = import.meta.env.DEV ? lazy(() => import('./devtools')) : null

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex-1">
        <Outlet />
      </div>
      <div className="px-6">
        <div className="mx-auto max-w-page">
          <SiteFooter />
        </div>
      </div>
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </div>
  )
}
