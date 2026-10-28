import { lazy, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'

const Devtools = import.meta.env.DEV ? lazy(() => import('./devtools')) : null

export function RootLayout() {
  return (
    <>
      <Outlet />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}
