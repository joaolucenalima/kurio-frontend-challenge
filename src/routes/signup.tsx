import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { SessionPage } from '#/modules/session/page'

export const Route = createFileRoute('/signup')({
  validateSearch: (input): { redirect: string } => ({
    redirect:
      typeof input.redirect === 'string' &&
      input.redirect.startsWith('/') &&
      !input.redirect.startsWith('//')
        ? input.redirect
        : '/',
  }),
  component: AccountRoute,
})

function AccountRoute() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  return (
    <main className="mx-auto min-h-dvh w-full max-w-125 px-7 pt-16 pb-8 font-mono">
      <Link
        to="/"
        search={{ ranking: 'all', sort: 'featured', page: 1 }}
        className="mx-auto block w-fit text-2xl font-bold tracking-widest"
      >
        KURIO
      </Link>
      <SessionPage
        initialMode="signup"
        redirect={redirect}
        onSuccess={() => {
          void navigate({ to: redirect })
        }}
      />
      <Link to="/login" search={{ redirect }} className="block text-center text-sm text-accent">
        J? tem uma conta? Entre
      </Link>
    </main>
  )
}
