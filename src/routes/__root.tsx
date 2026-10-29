import { Link, createRootRoute } from '@tanstack/react-router'
import { RootLayout } from '../app/root-layout'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto max-w-page p-6">
      <h1 className="font-mono text-[1.75rem] leading-9 font-bold tracking-normal">
        Página não encontrada
      </h1>
      <Link
        to="/"
        search={{ ranking: 'all', sort: 'featured', page: 1 }}
        className="text-base leading-5 font-normal tracking-normal text-accent underline"
      >
        Voltar ao início
      </Link>
    </main>
  ),
})
