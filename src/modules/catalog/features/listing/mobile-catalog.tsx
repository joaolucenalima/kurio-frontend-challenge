import { NftSearch } from '../../search'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import type { CatalogSearch } from '../../model/contracts'
import { CatalogFilters } from './catalog-filters'
import { HeroCarousel } from './hero-carousel'

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
      <NftSearch field />
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
          <DialogHeader>
            <DialogTitle>Filtrar NFTs</DialogTitle>
            <DialogDescription>Combine os filtros para explorar o catálogo.</DialogDescription>
          </DialogHeader>
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
      <div className="isolate flex min-w-0 items-center gap-2">
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
        <HeroCarousel mobile />
      </div>
    </section>
  )
}
