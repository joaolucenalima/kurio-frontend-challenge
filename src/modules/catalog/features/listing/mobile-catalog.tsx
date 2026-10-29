import {
  ArrowRight,
  Heart,
  House,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  UserRound,
  ScanLine,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import type { CatalogSearch } from '../../model/contracts'
import { CatalogFilters } from './catalog-filters'

export function MobileCatalogHeader({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (value: CatalogSearch) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex gap-2 md:hidden">
      <label className="flex h-11.25 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-card px-3 text-subtle">
        <Search className="size-5.5 shrink-0" aria-hidden="true" />
        <span className="sr-only">Explorar coleções</span>
        <input
          type="search"
          value={search.q ?? ''}
          onChange={(event) => onChange({ ...search, q: event.target.value || undefined, page: 1 })}
          placeholder="Explorar coleções"
          className="min-w-0 w-full bg-transparent text-sm font-bold placeholder:text-subtle outline-none"
        />
      </label>
      <button
        type="button"
        aria-label="Filtrar NFTs"
        onClick={() => setOpen(true)}
        className="flex size-11.25 shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br from-primary/45 to-primary text-card"
      >
        <SlidersHorizontal className="size-5.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto p-6">
          <DialogTitle className="pr-6 text-lg leading-6 font-bold">Filtrar NFTs</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
            Combine os filtros para explorar o catálogo.
          </DialogDescription>
          <div className="mt-6 [&>div]:p-0">
            <CatalogFilters search={search} onChange={onChange} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MobileHero() {
  return (
    <section
      aria-label="Bem-vindo à Kurio"
      className="relative mt-4 flex min-h-47.5 flex-col justify-center overflow-hidden rounded-xl bg-linear-to-r from-primary/20 to-primary/10 px-4 pt-4 pb-7 md:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-8 size-62 rounded-full bg-linear-to-br from-[#dd9a5f]/40 to-primary/0"
      />
      <div className="relative flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-4 font-medium">Bem-vindo à Kurio</p>
          <h1 className="mt-1.5 text-lg leading-7 font-bold">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </h1>
          <p className="mt-1.5 text-xs leading-4.5 text-muted-foreground">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#catalog"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-accent"
          >
            EXPLORAR <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="relative h-36.5 w-34.5 shrink-0">
          <img
            src="/images/nfts/emerald-ape.png"
            alt="Emerald Ape"
            className="size-34.5 rounded-2xl object-cover"
          />
          <img
            src="/images/nfts/sage-nomad.png"
            alt="Sage Nomad"
            className="absolute left-3.5 bottom-0 size-14.5 rounded-2xl object-cover"
          />
        </div>
      </div>
      <div aria-hidden="true" className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.75 rounded-full bg-primary" />
        ))}
      </div>
    </section>
  )
}

export function MobileNavigation() {
  const item =
    'flex min-h-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-accent focus-visible:text-accent'
  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-20 h-[calc(102px+env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-5.75 bottom-0 rounded-t-[28px] bg-card [mask-image:radial-gradient(circle_at_50%_5px,transparent_35px,black_36px)]"
      />
      <div className="relative grid h-25.5 grid-cols-[1fr_1fr_1.3fr_1fr_1fr] items-start px-6 pt-9.75">
        <Link
          to="/"
          search={{ ranking: 'all', sort: 'featured', page: 1 }}
          aria-label="Início"
          aria-current="page"
          className={`${item} text-accent!`}
        >
          <House className="size-5 fill-current" />
        </Link>
        <Link to="/profile" search={{ tab: 'watchlist' }} aria-label="Favoritos" className={item}>
          <Heart className="size-5 fill-current" />
        </Link>
        <div className="flex justify-center">
          <a
            href="#catalog"
            aria-label="Explorar catálogo"
            className="absolute top-0 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground transition-[filter] hover:brightness-110"
          >
            <ScanLine className="size-7" />
          </a>
        </div>
        <Link to="/cart" aria-label="Carrinho" className={item}>
          <ShoppingCart className="size-5" />
        </Link>
        <Link to="/profile" search={{ tab: 'profile' }} aria-label="Perfil" className={item}>
          <UserRound className="size-5" />
        </Link>
      </div>
    </nav>
  )
}
