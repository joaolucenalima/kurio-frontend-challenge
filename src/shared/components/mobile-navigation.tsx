import { NftSearch } from '#/modules/catalog/search'
import { Heart, House, ShoppingCart, UserRound, ScanLine } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '#/modules/session/api'
import { cartApi } from '#/modules/cart/api'
import { cartKey } from '#/modules/cart/model'

export function MobileNavigation() {
  const location = useRouterState({ select: (state) => state.location })
  const isHome = location.pathname === '/'
  const isFavorites =
    location.pathname === '/profile' &&
    new URLSearchParams(location.searchStr).get('tab') === 'watchlist'
  const isProfile = location.pathname === '/profile' && !isFavorites
  const isCart = location.pathname === '/cart'
  const icon = (active: boolean) => `size-5 ${active ? 'fill-current' : 'fill-none'}`
  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  const userId = session.data?.user.id
  const cart = useQuery({
    queryKey: cartKey(userId ?? ''),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    enabled: !!userId,
  })
  const cartQuantity = userId
    ? (cart.data?.items.reduce((total, line) => total + line.quantity, 0) ?? 0)
    : 0
  const item =
    'flex min-h-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-accent focus-visible:text-accent'
  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-20 h-[calc(102px+env(safe-area-inset-bottom))] md:hidden"
    >
      {!isHome && (
        <div className="absolute right-6 -top-8 rounded bg-card p-2">
          <NftSearch />
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-5.75 bottom-0 rounded-t-[28px] bg-card [mask-image:radial-gradient(circle_at_50%_5px,transparent_35px,black_36px)]"
      />
      <div className="relative grid h-25.5 grid-cols-[1fr_1fr_1.3fr_1fr_1fr] items-start px-6 pt-9.75">
        <Link
          to="/"
          search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
          aria-label="Início"
          aria-current={isHome ? 'page' : undefined}
          className={`${item} ${isHome ? 'text-accent!' : ''}`}
        >
          <House className={icon(isHome)} aria-hidden="true" />
        </Link>
        <Link
          to="/profile"
          search={{ tab: 'watchlist' }}
          aria-label="Favoritos"
          aria-current={isFavorites ? 'page' : undefined}
          className={`${item} ${isFavorites ? 'text-accent!' : ''}`}
        >
          <Heart className={icon(isFavorites)} aria-hidden="true" />
        </Link>
        <div className="flex justify-center">
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
            aria-label="Explorar catálogo"
            className="absolute top-0 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground transition-[filter] hover:brightness-110"
          >
            <ScanLine className="size-7" />
          </Link>
        </div>
        <Link
          to="/cart"
          aria-label={`Carrinho de NFTs, ${cartQuantity} itens`}
          aria-current={isCart ? 'page' : undefined}
          className={`${item} ${isCart ? 'text-accent!' : ''}`}
        >
          <span className="relative">
            <ShoppingCart className={icon(isCart)} aria-hidden="true" />
            {cartQuantity > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground"
              >
                {cartQuantity}
              </span>
            )}
          </span>
        </Link>
        <Link
          to="/profile"
          search={{ tab: 'profile' }}
          aria-label="Perfil"
          aria-current={isProfile ? 'page' : undefined}
          className={`${item} ${isProfile ? 'text-accent!' : ''}`}
        >
          <UserRound className={icon(isProfile)} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}
