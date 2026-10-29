import { useState } from 'react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import type { Order } from '../model'

const shortReference = (value: string) =>
  value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value

export function OrderConfirmation({ order }: { order: Order }) {
  const { items, wallets, quote } = order.snapshot

  const [explorerOpen, setExplorerOpen] = useState(false)

  const reference = order.transactionReference || order.id
  const dateParts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(order.createdAt)

  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value.replace('.', '') || ''
  const networks = [...new Set(wallets.map(({ network }) => network))]
  const networkNames: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    solana: 'Solana',
    robinhood: 'Robinhood',
  }

  const metadata = [
    { label: 'ID da transação', value: shortReference(reference), title: reference },
    {
      label: 'Data',
      value: `${datePart('day')} ${datePart('month')}, ${datePart('year')}`,
    },
    { label: 'Total', value: `${quote.totalEth} ETH` },
    { label: 'Carteira', value: wallets.map(({ alias }) => alias).join(', ') },
  ]

  return (
    <section
      aria-label="Confirmação de pedido"
      className="relative mx-auto w-full max-w-[578px] border-b-10 border-primary bg-card font-mono"
    >
      <header className="flex min-h-39 flex-col items-center justify-center gap-4 px-5 py-8 md:px-8">
        <img src="/images/checkout/NgoEU.png" alt="" className="size-20" />
        <h1 className="text-center text-lg leading-[26px] font-bold text-foreground">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
      <dl className="grid grid-cols-2 gap-y-4 border-y border-primary px-5 py-4 text-muted-foreground md:grid-cols-[1.2fr_1.1fr_1fr_1fr] md:px-8">
        {metadata.map(({ label, value, title }, index) => (
          <div
            key={label}
            className={`min-w-0 px-3 first:pl-0 ${index > 0 ? 'md:border-l md:border-primary' : ''} ${index % 2 ? 'border-l border-primary' : ''}`}
          >
            <dt className="text-xs leading-4 text-muted-foreground">{label}</dt>
            <dd
              title={title}
              className="mt-2 wrap-anywhere text-sm leading-5 font-medium text-foreground tabular-nums"
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="px-5 pt-6 md:px-8">
        <h2 className="mb-4 text-base leading-6 font-bold">Detalhes da transação</h2>
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="border-b border-primary/30 text-[13px] leading-5">
            <tr>
              <th scope="col" className="pb-3 font-bold">
                NFTs
              </th>
              <th scope="col" className="w-12 pb-3 text-center font-bold md:w-16">
                Edições
              </th>
              <th scope="col" className="w-24 pb-3 text-right font-medium md:w-32">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.nftId}:${item.editionId}`}>
                <td className="pt-4 pr-2 align-middle">
                  <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-14 shrink-0 rounded-lg object-cover md:size-16"
                    />
                    <div className="min-w-0 space-y-1.5">
                      <p className="wrap-anywhere text-sm leading-5 font-semibold">{item.name}</p>
                      <p className="wrap-anywhere text-xs leading-[18px] text-subtle">
                        {item.editionName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="pt-4 text-center align-middle text-sm leading-5 text-muted-foreground tabular-nums">
                  (x {item.quantity})
                </td>
                <td className="pt-4 text-right align-middle text-base leading-6 font-bold wrap-anywhere text-accent tabular-nums">
                  {item.lineTotalEth} ETH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-6 ml-auto w-full max-w-80 space-y-3 text-sm leading-5 tabular-nums">
          {quote.discountEth !== '0' && (
            <div className="flex justify-between gap-3">
              <dt>Desconto</dt>
              <dd className="wrap-anywhere text-right">−{quote.discountEth} ETH</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt>Taxa de rede</dt>
            <dd className="wrap-anywhere text-right">{quote.networkFeeEth} ETH</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-primary/30 pt-4 font-bold">
            <dt>Total</dt>
            <dd className="wrap-anywhere text-right text-xl leading-7 text-accent">
              {quote.totalEth} ETH
            </dd>
          </div>
        </dl>
        <footer className="mt-6 flex flex-col items-center border-t border-primary/30 pt-6 pb-8">
          <p className="text-center text-sm leading-5.5 text-muted-foreground">
            Transação confirmada {networks.length === 1 ? 'na ' : 'nas redes '}
            {networks.map((network) => networkNames[network] || network).join(', ')}. A propriedade
            foi transferida para sua carteira conectada e registrada na rede.
          </p>
          <Button
            className="mt-6 min-h-11 h-auto max-w-full rounded-[5px] px-4 py-3 text-base leading-5 font-bold whitespace-normal"
            onClick={() => setExplorerOpen(true)}
          >
            {networks.length === 1 && networks[0] === 'ethereum'
              ? 'Ver no Etherscan'
              : 'Ver transação'}
          </Button>
        </footer>
      </div>

      <Dialog open={explorerOpen} onOpenChange={setExplorerOpen}>
        <DialogContent>
          <DialogTitle>Explorador simulado</DialogTitle>
          <DialogDescription>
            Esta compra é uma simulação. A referência abaixo não corresponde a uma transação real na
            blockchain.
          </DialogDescription>
          <p className="break-all text-sm text-muted-foreground">{reference}</p>
        </DialogContent>
      </Dialog>
    </section>
  )
}
