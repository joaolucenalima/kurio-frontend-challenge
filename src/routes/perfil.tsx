import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '#/shared/components/header'
import { sessionApi } from '#/modules/session/api'
import { Button } from '#/shared/components/ui/button'

export const Route = createFileRoute('/perfil')({ component: ProfilePlaceholder })

function ProfilePlaceholder() {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  return (
    <div className="mx-auto max-w-page px-6 py-6">
      <Header />
      <main className="py-20">
        <h1 className="mb-4 text-3xl font-bold">Perfil</h1>
        {session.isPending ? (
          <p>Carregando sessão…</p>
        ) : session.data ? (
          <>
            <p className="mb-6">
              Olá, {session.data.user.username}. A página de perfil estará disponível em uma próxima
              etapa.
            </p>
            <Button
              type="button"
              onClick={() => {
                void sessionApi.logout().finally(() => {
                  queryClient.clear()
                  window.location.assign('/')
                })
              }}
            >
              Sair
            </Button>
          </>
        ) : (
          <p>
            Entre na sua conta para acessar o perfil.{' '}
            <Link to="/" search={{ sort: 'featured', page: 1 }} className="text-accent underline">
              Voltar ao início
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}
