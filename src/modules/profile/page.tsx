import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { sessionApi } from '#/modules/session/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/shared/components/ui/alert-dialog'
import {
  Activity,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingBag,
  TriangleAlert,
  UserRound,
} from 'lucide-react'

export const profileTabs = [
  { id: 'profile', label: 'Dados do perfil' },
  { id: 'wallets', label: 'Carteiras' },
  { id: 'activity', label: 'Atividade' },
  { id: 'watchlist', label: 'Lista de interesse' },
  { id: 'offers', label: 'Ofertas' },
  { id: 'downloads', label: 'Arquivos baixados' },
  { id: 'support', label: 'Suporte' },
] as const

const tabIcons = [UserRound, MapPin, ShoppingBag, Heart, Activity, Download, TriangleAlert]

export type ProfileTab = (typeof profileTabs)[number]['id']

export function ProfilePage({ tab }: { tab: ProfileTab }) {
  const queryClient = useQueryClient()

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:px-6 xl:px-0">
      <Header />
      <main className="py-8">
        {session.isPending ? (
          <p>Carregando sessão…</p>
        ) : session.data ? (
          <div className="grid min-w-0 gap-6 md:grid-cols-[19.375rem_minmax(0,1fr)] md:gap-7">
            <nav aria-label="Navegação do perfil" className="min-w-0 bg-card py-2">
              <h2 className="px-6 py-4 text-lg font-bold">Meu perfil</h2>
              <ul className="flex flex-col">
                {profileTabs.map((item, index) => {
                  const Icon = tabIcons[index]
                  return (
                    <li key={item.id}>
                      <Link
                        to="/profile"
                        search={{ tab: item.id }}
                        aria-current={tab === item.id ? 'page' : undefined}
                        className="flex min-h-12 items-center gap-3 border-l-[6px] border-transparent px-4 font-mono text-[15px] text-accent transition-colors hover:bg-secondary focus-visible:outline-ring aria-[current=page]:border-primary"
                      >
                        <Icon
                          className={`size-4.5 ${index < 2 ? 'text-accent' : 'text-subtle'}`}
                          aria-hidden="true"
                        />
                        <span className={tab === item.id ? 'font-semibold text-accent' : ''}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3 border-t border-primary/30 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      className="h-10 w-full justify-start gap-2 rounded-none px-4 text-[15px] font-bold text-accent"
                    >
                      <LogOut className="size-5" aria-hidden="true" />
                      Sair
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-bold">
                        Sair da conta?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-muted-foreground">
                        Sua sessão será encerrada neste dispositivo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          void sessionApi.logout().finally(() => {
                            queryClient.clear()
                            window.location.assign('/')
                          })
                        }}
                      >
                        Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </nav>
            <section
              aria-label={profileTabs.find((item) => item.id === tab)?.label}
              className="min-h-72 min-w-0 border border-border bg-card p-5 md:p-8"
            >
              <p className="text-sm text-muted-foreground">Olá, {session.data.user.username}.</p>
            </section>
          </div>
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
