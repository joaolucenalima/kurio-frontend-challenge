import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { checkoutApi } from '../api'
import type { Order } from '../model'
import { OrderConfirmation } from './order-confirmation'

export function OrderHistory({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<Order | null>(null)
  const orders = useQuery({
    queryKey: ['orders', userId],
    queryFn: ({ signal }) => checkoutApi.listOrders(signal),
  })

  if (orders.isPending) return <p>Carregando compras…</p>
  if (orders.isError)
    return (
      <div role="alert" className="space-y-3">
        <p>Não foi possível carregar suas compras.</p>
        <Button variant="outline" onClick={() => void orders.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  if (!orders.data.length)
    return <p className="text-muted-foreground">Você ainda não realizou compras.</p>

  return (
    <>
      <ul className="space-y-4">
        {orders.data.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-semibold">
                {order.snapshot.items.map((item) => item.name).join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(order.createdAt)}{' '}
                · {order.snapshot.quote.totalEth} ETH
              </p>
              <p className="break-all text-xs text-muted-foreground">Pedido {order.id}</p>
            </div>
            <Button variant="outline" onClick={() => setSelected(order)}>
              Ver recibo
            </Button>
          </li>
        ))}
      </ul>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="w-[min(95vw,578px)] p-0 pb-0">
          <DialogTitle className="sr-only">Recibo da compra</DialogTitle>
          <DialogDescription className="sr-only">Detalhes da compra confirmada</DialogDescription>
          {selected && <OrderConfirmation order={selected} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
