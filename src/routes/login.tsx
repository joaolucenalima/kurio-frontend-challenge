import { authRedirect } from '#/modules/session/auth-redirect'
import { createFileRoute, Link, redirect as routerRedirect } from '@tanstack/react-router'
import { SessionPage } from '#/modules/session/page'

export const Route = createFileRoute('/login')({
  validateSearch: (input): { redirect: string } => ({
    redirect: authRedirect(input.redirect),
  }),
  beforeLoad: ({ search, location }) => {
    const values = new URLSearchParams(location.searchStr).getAll('redirect')
    if (values.length > 1 || (values.length === 1 && values[0] !== search.redirect)) {
      throw routerRedirect({ to: '/login', search: { redirect: search.redirect }, replace: true })
    }
  },
  component: AccountRoute,
})

function AccountRoute() {
  const { redirect } = Route.useSearch()
  return (
    <main className="mx-auto  w-full max-w-125 px-7 pt-20 pb-6 font-mono">
      <Link
        to="/"
        search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
        className="mx-auto mb-10 flex h-34 w-full items-center justify-center text-[32px] font-bold tracking-[3.2px]"
      >
        KURIO
      </Link>
      <SessionPage key="login" presentation="page" initialMode="login" redirect={redirect} />
      <Link
        to="/signup"
        search={{ redirect }}
        className="mt-10 block text-center text-[15px] leading-5 text-muted-foreground hover:text-accent"
      >
        Novo na Kurio? Crie uma conta
      </Link>
    </main>
  )
}
