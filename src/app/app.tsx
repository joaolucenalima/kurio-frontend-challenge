import { Realtime } from './realtime'
import { ToastProvider } from '#/shared/components/ui/toast'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query-client'

const router = getRouter()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Realtime />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
