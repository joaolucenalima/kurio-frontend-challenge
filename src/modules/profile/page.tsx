import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { sessionApi } from '#/modules/session/api'
import { FavoritesList } from '#/modules/favorites'
import { ProfileEditor } from './ui/profile-editor'
import { WalletsSection } from '#/modules/wallets/ui/wallets-section'
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
  {
    id: 'profile',
    label: 'Dados do perfil',
    title: 'Perfil do colecionador',
    description: 'Gerencie as informações da sua conta de colecionador.',
  },
  {
    id: 'wallets',
    label: 'Carteiras',
    title: 'Carteira principal',
    description: 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',
  },
  {
    id: 'activity',
    label: 'Atividade',
    title: 'Atividade',
    description: 'Acompanhe as atividades da sua conta.',
  },
  {
    id: 'watchlist',
    label: 'Lista de interesse',
    title: 'Lista de interesse',
    description: 'Veja os NFTs que você salvou como favoritos.',
  },
  {
    id: 'offers',
    label: 'Ofertas',
    title: 'Ofertas',
    description: 'Consulte as ofertas relacionadas à sua conta.',
  },
  {
    id: 'downloads',
    label: 'Arquivos baixados',
    title: 'Arquivos baixados',
    description: 'Acesse os arquivos disponíveis para download.',
  },
  {
    id: 'support',
    label: 'Suporte',
    title: 'Suporte',
    description: 'Encontre ajuda para usar sua conta.',
  },
] as const

const tabIcons = [UserRound, MapPin, ShoppingBag, Heart, Activity, Download, TriangleAlert]

export type ProfileTab = (typeof profileTabs)[number]['id']

export function ProfilePage({ tab }: { tab: ProfileTab }) {
  const queryClient = useQueryClient()
  const activeTab = profileTabs.find((item) => item.id === tab) ?? profileTabs[0]

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:px-6 xl:px-0">
      <Header />
      <main className="py-8">
        {session.isPending ? (
          <p>Carregando sessão…</p>
        ) : session.data ? (
          <div className="grid items-start min-w-0 gap-6 md:grid-cols-[19.5rem_minmax(0,1fr)] md:gap-7">
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

            <section aria-labelledby="profile-section-title" className="min-h-72 min-w-0">
              <div className="mb-8 space-y-2">
                <h1 id="profile-section-title" className="text-[17px] leading-4 font-bold">
                  {activeTab.title}
                </h1>
                <p className="text-sm leading-4 text-muted-foreground">{activeTab.description}</p>
              </div>
              {tab === 'profile' ? <ProfileEditor userId={session.data.user.id} /> : null}
              {tab === 'wallets' ? <WalletsSection userId={session.data.user.id} /> : null}
              {tab === 'watchlist' ? <FavoritesList userId={session.data.user.id} /> : null}
            </section>
          </div>
        ) : (
          <p>
            Entre na sua conta para acessar o perfil.{' '}
            <Link
              to="/"
              search={{ ranking: 'all', sort: 'featured', page: 1 }}
              className="text-accent underline"
            >
              Voltar ao início
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}
