import { LoaderCircle } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import type { CartLine } from '#/modules/cart/contracts'
import type { CheckoutReview } from '../model'
import { formatEth, formatLineSubtotal } from '../model/money'
import { PriceRow } from './form-primitives'

export function CheckoutReviewDialog({
  review,
  lines,
  displayName,
  totalQuantity,
  labels,
  busy,
  onClose,
  onConfirm,
}: {
  review: CheckoutReview | null
  lines: CartLine[]
  displayName: string
  totalQuantity: number
  labels: Record<string, string>
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={!!review}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[min(95vw,672px)] flex-col gap-0 overflow-hidden border border-border border-b-4 border-b-primary p-0 pb-0">
        <DialogHeader className="mb-0 border-b border-border px-5 py-5 pr-12 md:px-7 md:pr-12">
          <DialogTitle>Confirmar compra</DialogTitle>
          <DialogDescription>
            Revise os itens, as carteiras de destino e o total antes de finalizar.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 md:px-7" aria-busy={busy}>
          <section aria-label="Itens da compra" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Seus NFTs</h3>
              <span className="text-xs text-muted-foreground">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li
                  key={line.nftId + ':' + line.editionId}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={line.nft.displayImageUrl}
                    alt={line.nft.imageAlt}
                    className="size-12 shrink-0 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="wrap-break-word text-sm font-semibold">{line.nft.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.nft.editions.find((edition) => edition.id === line.editionId)?.name ||
                        line.editionId}{' '}
                      · Qtd. {line.quantity}
                    </p>
                  </div>
                  <span className="max-w-[40%] wrap-break-word text-right text-xs font-semibold text-accent">
                    {formatLineSubtotal(line.nft.priceEth, line.quantity)} ETH
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <div className="grid gap-5 border-y border-border py-5 md:grid-cols-2">
            <section className="min-w-0 space-y-2">
              <h3 className="text-sm font-semibold">Colecionador</h3>
              <p className="wrap-break-word text-sm">{displayName}</p>
              {review && (
                <p className="break-all text-xs text-muted-foreground">{review.collector.email}</p>
              )}
              {review?.collector.note && (
                <p className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-muted-foreground">
                  {review.collector.note}
                </p>
              )}
            </section>
            <section className="min-w-0 space-y-3 md:col-span-2">
              <h3 className="text-sm font-semibold">Carteiras de destino</h3>
              {review?.wallets.map((wallet) => (
                <div key={wallet.id} className="space-y-1">
                  <p className="text-xs font-medium">
                    {labels[wallet.network]} ·{' '}
                    {wallet.temporary ? 'Somente nesta compra' : wallet.alias}
                  </p>
                  <p className="break-all text-xs leading-relaxed text-muted-foreground">
                    {wallet.address}
                  </p>
                </div>
              ))}
            </section>
          </div>
          <dl className="space-y-3 text-sm">
            <PriceRow label="Subtotal" value={formatEth(review?.quote.subtotalEth || '0')} />
            <PriceRow label="Desconto" value={'− ' + formatEth(review?.quote.discountEth || '0')} />
            <PriceRow label="Taxa de rede" value={formatEth(review?.quote.networkFeeEth || '0')} />
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-4">
              <dt className="font-semibold">Total da compra</dt>
              <dd className="break-all text-right text-xl font-bold text-accent">
                {formatEth(review?.quote.totalEth || '0')}
              </dd>
            </div>
          </dl>
        </div>
        <footer className="space-y-4 border-t border-border bg-card px-5 py-4 md:px-7">
          <p className="text-xs leading-relaxed text-muted-foreground">
            As taxas e a disponibilidade serão validadas novamente. A autorização e o pagamento são
            simulados.
          </p>
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <Button
              variant="outline"
              className="h-10 md:min-w-36"
              disabled={busy}
              onClick={onClose}
            >
              Voltar e revisar
            </Button>
            <Button variant="cta" className="h-10 md:min-w-44" disabled={busy} onClick={onConfirm}>
              {busy && <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />}
              {busy ? 'Confirmando…' : 'Confirmar compra'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
