import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import type { Order } from '../model'
import { OrderConfirmation } from './order-confirmation'
import { PriceRow } from './form-primitives'

const eth = (value: string) => `${value} ETH`

export function OrderResult({
  order,
  onRecover,
  busy,
}: {
  order: Order
  onRecover: () => void
  busy: boolean
}) {
  const confirmed = order.status === 'confirmed'
  const declined = order.status === 'declined'

  const [open, setOpen] = useState(true)
  const terminal = confirmed || declined
  const title = confirmed
    ? 'Pedido confirmado'
    : declined
      ? 'Pagamento recusado'
      : 'Pedido em processamento'

  return (
    <>
      <section className="mx-auto max-w-3xl space-y-4 rounded bg-card p-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button onClick={() => setOpen(true)}>Ver recibo do pedido</Button>
          {terminal && (
            <Button asChild variant="outline">
              <Link
                to="/"
                search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
                hash="catalog"
              >
                Voltar ao catálogo
              </Link>
            </Button>
          )}
        </div>
      </section>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (terminal) setOpen(next)
        }}
      >
        <DialogContent
          showCloseButton={terminal}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (!terminal) event.preventDefault()
          }}
          className="w-[min(95vw,578px)] p-0 pb-0"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Acompanhamento e recibo do pedido {order.id}
          </DialogDescription>
          <output className="sr-only">{title}</output>
          {confirmed ? (
            <OrderConfirmation order={order} />
          ) : (
            <section className="mx-auto max-w-3xl space-y-6 rounded bg-card p-5 pt-10 sm:p-8">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 rounded-full p-2 ${declined ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-accent'}`}
                >
                  {declined ? <AlertCircle /> : <LoaderCircle className="animate-spin" />}
                </span>
                <div>
                  <h1 className="font-mono text-xl font-bold">
                    {declined ? 'Pagamento recusado' : 'Pedido em processamento'}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {declined
                      ? 'O pagamento foi recusado. Seus itens continuam no carrinho.'
                      : 'O estado será atualizado automaticamente e pode ser recuperado após recarregar.'}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 border-y border-border py-4 text-sm">
                <PriceRow label="Pedido" value={order.id} />
                <PriceRow label="Estado" value={order.status} />
                <PriceRow label="Colecionador" value={order.snapshot.collector.displayName} />
                <PriceRow label="E-mail" value={order.snapshot.collector.email} />
                {order.snapshot.wallets.map((wallet) => (
                  <PriceRow
                    key={wallet.id}
                    label={`Carteira ${wallet.network}`}
                    value={wallet.address}
                  />
                ))}
                {order.transactionReference && (
                  <PriceRow label="Referência simulada" value={order.transactionReference} />
                )}
                {order.snapshot.items.map((item) => (
                  <PriceRow
                    key={`${item.nftId}:${item.editionId}`}
                    label={`${item.name} · ${item.editionName} × ${item.quantity}`}
                    value={`${item.lineTotalEth} ETH`}
                  />
                ))}
                <PriceRow label="Taxa de rede" value={eth(order.snapshot.quote.networkFeeEth)} />
                <PriceRow label="Total do pedido" value={eth(order.snapshot.quote.totalEth)} />
              </dl>
              {order.status === 'pending' && (
                <p className="text-sm text-muted-foreground">Tentativa {order.idempotencyKey}</p>
              )}
              {declined && (
                <Button variant="outline" onClick={onRecover} disabled={busy}>
                  {busy ? 'Preparando…' : 'Fazer uma nova tentativa'}
                </Button>
              )}
            </section>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
