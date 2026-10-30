import { NftSearch } from '#/modules/catalog/search'
import { useAuthEntry } from '#/modules/session/use-auth-entry'
import { LogIn, ShoppingCart, User } from 'lucide-react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '#/shared/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '#/modules/session/api'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { SessionPage } from '#/modules/session/page'
import { cartApi } from '#/modules/cart/api'
import { cartKey } from '#/modules/cart/contracts'

export function Header() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginRedirect, setLoginRedirect] = useState<'/cart'>()

  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location })

  const isMarketFlow =
    location.pathname.startsWith('/nfts/') ||
    location.pathname === '/cart' ||
    location.pathname === '/payment'
  const openAuth = useAuthEntry(() => {
    setLoginRedirect(undefined)
    setLoginOpen(true)
  })
  const openCartAuth = useAuthEntry(() => {
    setLoginRedirect('/cart')
    setLoginOpen(true)
  }, '/cart')

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  const userId = session.data?.user.id

  const cart = useQuery({
    queryKey: cartKey(userId ?? ''),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    enabled: !!userId,
  })

  const cartQuantity = cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0

  return (
    <header className="hidden flex-wrap items-start justify-between gap-y-4 md:flex">
      <Link
        to="/"
        search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
        hash=""
        resetScroll
        className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent flex h-9 items-center font-mono text-sm leading-5 font-bold tracking-widest lg:w-40"
      >
        KURIO
      </Link>
      <nav
        aria-label="Navegação principal"
        className="order-last flex w-full justify-center h-11 gap-6 font-mono text-base leading-6 font-normal tracking-normal lg:order-0 lg:w-auto lg:gap-10"
      >
        <Link
          to="/"
          search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
          hash=""
          resetScroll
          activeOptions={{ exact: true, includeSearch: false, includeHash: true }}
          className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent aria-[current]:border-b-4 aria-[current]:border-primary aria-[current]:font-bold aria-[current]:text-accent aria-[current]:hover:text-primary"
        >
          Início
        </Link>
        <Link
          to="/"
          hash="catalog"
          search={(previous) =>
            location.pathname === '/'
              ? {
                  ...previous,
                  ranking: previous.ranking ?? 'all',
                  sort: previous.sort ?? 'recently-listed',
                  page: previous.page ?? 1,
                }
              : { ranking: 'all', sort: 'recently-listed', page: 1 }
          }
          activeOptions={{ exact: true, includeSearch: false, includeHash: true }}
          aria-current={isMarketFlow ? 'location' : undefined}
          className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent aria-[current]:border-b-4 aria-[current]:border-primary aria-[current]:font-bold aria-[current]:text-accent aria-[current]:hover:text-primary"
        >
          Mercado
        </Link>
        <span
          aria-disabled="true"
          className="cursor-not-allowed"
          title="Disponível em uma próxima etapa"
        >
          Criadores
        </span>
        <span aria-disabled="true" className="cursor-not-allowed" title="Conteúdo fora do escopo">
          Aprenda
        </span>
      </nav>
      <div className="flex h-9 items-center gap-7" aria-label="Ações da conta">
        <NftSearch />
        <Button asChild variant="icon" size="icon" className="relative size-5 rounded-none p-0">
          <Link
            to="/cart"
            aria-label={`Carrinho de NFTs, ${cartQuantity} itens`}
            onClick={(event) => {
              if (
                session.data ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return
              event.preventDefault()
              openCartAuth()
            }}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {cartQuantity > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 font-mono text-[10px] leading-none font-bold text-primary-foreground"
              >
                {cartQuantity}
              </span>
            )}
          </Link>
        </Button>
        {session.data ? (
          <Link
            to="/profile"
            search={{ tab: 'profile' }}
            className="flex h-9 items-center gap-2 font-mono text-base font-medium text-foreground transition-colors hover:text-accent focus-visible:text-accent"
          >
            <User className="size-5" aria-hidden="true" />
            <span>{session.data.user.username}</span>
          </Link>
        ) : (
          <Button
            type="button"
            onClick={() => openAuth()}
            className="font-mono text-base leading-6 font-medium tracking-normal text-primary-foreground"
          >
            <LogIn aria-hidden="true" />
            Entrar
          </Button>
        )}
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="w-[min(95vw,500px)] max-w-125 rounded-t-lg p-0 pb-0">
          <DialogTitle className="sr-only">Acessar conta</DialogTitle>
          <DialogDescription className="sr-only">Entre ou crie uma conta Kurio.</DialogDescription>
          <SessionPage
            redirect={loginRedirect}
            onSuccess={() => {
              setLoginOpen(false)
              if (loginRedirect) void navigate({ to: loginRedirect })
            }}
          />
        </DialogContent>
      </Dialog>
    </header>
  )
}
