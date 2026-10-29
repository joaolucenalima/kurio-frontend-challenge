import { Skeleton } from '#/shared/components/ui/skeleton'
/* eslint-disable jsx-a11y/prefer-tag-over-role -- ARIA combobox requires a custom suggestion list with images. */
import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '#/shared/components/ui/popover'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '#/shared/components/ui/dialog'
import { catalogQueries } from './api/queries'
import { collectionOptions, parseCatalogSearch } from './model/contracts'

export function NftSearch({ field = false }: { field?: boolean }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(-1)
  const [mobile, setMobile] = useState(false)
  const id = useId()
  const location = useRouterState({ select: (state) => state.location })
  const navigate = useNavigate()
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    queueMicrotask(() => setOpen(false))
  }, [location.href])
  useEffect(() => {
    const timer = setTimeout(() => setTerm(draft.trim()), 300)
    return () => clearTimeout(timer)
  }, [draft])
  const query = useQuery({
    ...catalogQueries.list({ q: term, ranking: 'all', sort: 'name', page: 1 }),
    enabled: open && !!term,
    retry: false,
  })
  const waiting = draft.trim() !== term || query.isPending
  const items = !waiting && !query.isError ? (query.data?.items.slice(0, 5) ?? []) : []
  const changeOpen = (value: boolean) => {
    if (value) {
      const q =
        location.pathname === '/' ? (new URLSearchParams(location.searchStr).get('q') ?? '') : ''
      setDraft(q)
      setTerm(q)
      setActive(-1)
    }
    setOpen(value)
  }
  const submit = () => {
    const previous =
      location.pathname === '/'
        ? parseCatalogSearch(Object.fromEntries(new URLSearchParams(location.searchStr)))
        : { ranking: 'all' as const, sort: 'recently-listed' as const, page: 1 }
    queueMicrotask(() => setOpen(false))
    void navigate({
      to: '/',
      search: { ...previous, q: draft.trim() || undefined, page: 1 },
      hash: 'catalog',
    })
  }
  const select = (nftId: string) => {
    queueMicrotask(() => setOpen(false))
    void navigate({ to: '/nfts/$nftId', params: { nftId } })
  }
  const trigger = (
    <Button
      variant="icon"
      size={field ? 'default' : 'icon'}
      aria-label="Buscar NFTs"
      className={field ? 'h-11 min-w-0 flex-1 justify-start bg-card text-subtle' : 'size-5 p-0'}
    >
      <Search aria-hidden="true" />
      {field && 'Explorar NFTs'}
    </Button>
  )
  const content = (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="space-y-3"
    >
      <Input
        role="combobox"
        aria-label="Buscar NFTs"
        aria-expanded={!!items.length}
        aria-controls={id}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 && items[active] ? `${id}-${active}` : undefined}
        maxLength={200}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          setActive(-1)
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) =>
              items.length
                ? (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
                : -1,
            )
          }
          if (event.key === 'Enter' && active >= 0 && items[active]) {
            event.preventDefault()
            select(items[active].id)
          }
        }}
        placeholder="Buscar NFTs"
      />
      <p className="text-xs text-muted-foreground">Digite o nome do NFT</p>
      <div role="status" aria-live="polite">
        {draft.trim() && waiting && (
          <div className="space-y-2">
            <span className="sr-only">Buscando NFTs…</span>
            {[0, 1, 2].map((index) => (
              <div key={index} aria-hidden="true" className="flex items-center gap-2 py-2">
                <Skeleton className="size-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {draft.trim() && !waiting && query.isError && (
          <>
            <p>Não foi possível buscar sugestões.</p>
            <Button type="button" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </>
        )}
        {draft.trim() && !waiting && !query.isError && !items.length && (
          <p>Nenhum NFT encontrado.</p>
        )}
      </div>
      <div id={id} role="listbox" aria-label="Sugestões de NFTs">
        {items.map((nft, index) => (
          <Button
            type="button"
            role="option"
            aria-selected={index === active}
            id={`${id}-${index}`}
            key={nft.id}
            variant="ghost"
            className="h-auto w-full justify-start whitespace-normal py-2 aria-selected:bg-accent"
            onClick={() => select(nft.id)}
          >
            <img
              src={nft.displayImageUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded object-cover"
            />
            <span className="min-w-0 text-left">
              {nft.name}
              <span className="block text-xs">
                {collectionOptions.find((option) => option.id === nft.collection)?.name}
              </span>
            </span>
          </Button>
        ))}
      </div>
      <Button type="submit" className="w-full">
        Ver resultados no catálogo
      </Button>
    </form>
  )
  return mobile ? (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Buscar NFTs</DialogTitle>
        <DialogDescription>Pesquise em todo o site.</DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="z-50 w-[min(90vw,400px)] rounded-md border border-border bg-background p-4 text-foreground shadow-xl"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
