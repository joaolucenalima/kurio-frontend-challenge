import { Trash2 } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import type { CartLine, Quote } from '#/modules/cart/contracts'
import { formatLineSubtotal, formatEth } from '../model/money'
import { PriceRow } from './form-primitives'

export function CheckoutSummary({
  lines,
  totalQuantity,
  coupon,
  quote,
  couponInput,
  couponPending,
  onCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  lines: CartLine[]
  totalQuantity: number
  coupon: string | null
  quote?: Quote
  couponInput: string
  couponPending: boolean
  onCouponInput: (value: string) => void
  onApplyCoupon: (code: string | null) => void
  onRemoveCoupon: () => void
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[17px] font-bold">Seus NFTs</h2>
      <p className="text-xs text-muted-foreground">
        {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border pb-2 text-xs font-bold">
        <span>NFT</span>
        <span className="text-right">Subtotal</span>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto">
        {lines.map((line) => (
          <article
            key={`${line.nftId}:${line.editionId}`}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3"
          >
            <div className="flex min-w-0 gap-3">
              <img
                src={line.nft.displayImageUrl}
                alt={line.nft.imageAlt}
                className="size-17.5 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold">{line.nft.name}</h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {line.nft.editions.find(({ id }) => id === line.editionId)?.name ||
                    line.editionId}{' '}
                  · Qtd. {line.quantity}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {line.nft.priceEth} ETH por unidade
                </p>
              </div>
            </div>
            <span className="max-w-24 wrap-break-word text-right text-xs font-bold text-accent">
              {formatLineSubtotal(line.nft.priceEth, line.quantity)} ETH
            </span>
          </article>
        ))}
      </div>
      <label htmlFor="coupon" className="mb-2 hidden text-sm lg:block">
        Código promocional
      </label>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onApplyCoupon(couponInput.trim() || null)
        }}
        className="flex gap-2 lg:gap-0"
      >
        <label className="sr-only" htmlFor="coupon">
          Código promocional
        </label>
        <Input
          variant="coupon"
          id="coupon"
          value={couponInput}
          onChange={(event) => onCouponInput(event.target.value)}
          placeholder="Digite o código promocional..."
        />
        <Button
          type="submit"
          disabled={!couponInput.trim() || couponPending}
          className="rounded-full lg:h-10 lg:rounded-none lg:px-5"
        >
          Aplicar
        </Button>
      </form>
      <dl className="space-y-3 border-t border-accent/60 pt-4 text-sm">
        <PriceRow label="Subtotal" value={quote ? formatEth(quote.subtotalEth) : '—'} />
        {coupon && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-normal">
            <dt className="min-w-0 flex-1">
              Cupom <span className="font-semibold text-accent">{coupon}</span>
            </dt>
            <dd>(-) {quote?.discountEth} ETH</dd>
            <dd>
              <Button
                type="button"
                variant="icon"
                size="icon"
                disabled={couponPending}
                className="size-6 text-destructive hover:text-destructive/80 focus-visible:text-destructive"
                onClick={onRemoveCoupon}
                aria-label={'Remover cupom ' + coupon}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </dd>
          </div>
        )}
        <div>
          <PriceRow label="Taxa de rede" value={quote ? formatEth(quote.networkFeeEth) : '—'} />
          <p className="mt-2 text-right text-xs text-accent">Taxa estimada</p>
        </div>
        <div className="flex justify-between border-t border-accent/60 pt-4 font-bold">
          <dt>Total</dt>
          <dd className="text-accent">{quote ? formatEth(quote.totalEth) : '—'}</dd>
        </div>
      </dl>
    </section>
  )
}
