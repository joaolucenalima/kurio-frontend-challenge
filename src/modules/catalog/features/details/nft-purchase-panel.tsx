import type { Dispatch, SetStateAction } from 'react'
import { Heart, Minus, Plus } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import type { Nft, NftEdition } from '../../model/contracts'
import { ReviewSummary } from '../../ui/review-summary'

interface Props {
  nft: Nft
  variant: 'desktop' | 'mobile'
  edition?: NftEdition
  quantity: number
  setQuantity: Dispatch<SetStateAction<number>>
  selectEdition: (id: string) => void
}

export function PurchasePanel({
  nft,
  variant,
  edition,
  quantity,
  setQuantity,
  selectEdition,
}: Props) {
  return variant === 'desktop' ? (
    <>
      <fieldset className="mt-6">
        <legend className="text-sm font-bold">Edição:</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {nft.editions.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.available === 0}
              aria-pressed={edition?.id === item.id}
              onClick={() => {
                selectEdition(item.id)
              }}
              className="min-h-8 rounded-full border border-border px-3 text-sm text-muted-foreground aria-pressed:border-primary aria-pressed:text-accent disabled:opacity-40"
            >
              {item.name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 hidden flex-wrap items-center justify-between gap-5 md:flex">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" aria-label="Quantidade">
            <Button
              type="button"
              size="icon-sm"
              className="rounded-full"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-6 text-center">
              {quantity}
            </output>
            <Button
              type="button"
              size="icon-sm"
              className="rounded-full"
              aria-label="Aumentar quantidade"
              disabled={!edition || quantity >= edition.available}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {edition ? `${edition.available} disponíveis` : 'Indisponível'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            disabled
            title="Compra disponível em uma próxima etapa"
            className="h-10 w-32"
          >
            COMPRAR
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Favoritos disponíveis em uma próxima etapa"
            className="h-10 w-32 border-primary text-accent"
          >
            <Heart aria-hidden="true" /> Favoritar
          </Button>
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[2.5rem] border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl md:hidden">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Qtd.</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-5 text-center">
              {quantity}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Aumentar quantidade"
              disabled={!edition || quantity >= edition.available}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
            <span
              className="whitespace-nowrap text-xs text-muted-foreground"
              aria-label={edition ? `${edition.available} disponíveis` : 'Indisponível'}
              aria-live="polite"
            >
              {edition ? `${edition.available} disp.` : 'Indisp.'}
            </span>
          </div>
          <span className="font-bold text-accent">{nft.priceEth} ETH</span>
        </div>

        <div className="mx-auto mt-3 max-w-page">
          <ReviewSummary count={nft.reviewCount} />
        </div>
        <div className="mx-auto mt-4 flex max-w-page gap-3">
          <Button
            type="button"
            disabled
            title="Compra disponível em uma próxima etapa"
            className="h-12 flex-1 rounded-full"
          >
            Comprar NFT
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            disabled
            aria-label="Favoritar indisponível"
            className="size-12 rounded-full"
          >
            <Heart aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  )
}
