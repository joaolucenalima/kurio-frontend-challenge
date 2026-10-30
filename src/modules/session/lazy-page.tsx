import { lazy, Suspense, type ComponentProps } from 'react'
import type { SessionPage as SessionPageType } from './page'

const LazySessionPage = lazy(() =>
  import('./page').then((module) => ({ default: module.SessionPage })),
)

export function SessionPage(props: ComponentProps<typeof SessionPageType>) {
  return (
    <Suspense fallback={<output>Carregando formulário…</output>}>
      <LazySessionPage {...props} />
    </Suspense>
  )
}
