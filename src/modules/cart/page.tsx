import { useToastFeedback } from '#/shared/components/ui/toast'
import { useAuthEntry } from '#/modules/session/use-auth-entry'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '#/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { sessionApi } from '#/modules/session/api'
import { SessionPage } from '#/modules/session/page'
import { cartApi } from './api'
import { cartKey, quoteKey, type Cart, type CartInput } from './model'
import { ethToWei } from '#/modules/catalog'
import { CartDiscovery } from './ui/cart-discovery'

const shimmer =
  'animate-pulse rounded-xl bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]'
const message = (error: unknown) =>
  isAxiosError(error)
    ? (error.response?.data as { message?: string })?.message ||
      'Falha de conexão. Tente novamente.'
    : 'Não foi possível concluir. Tente novamente.'
const eth = (wei: bigint) => {
  const fraction = (wei % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return `${wei / 10n ** 18n}${fraction ? `.${fraction}` : ''}`
}

export function CartPage() {
  const queryClient = useQueryClient()

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })

  const userId = session.data?.user.id

  const [loginOpen, setLoginOpen] = useState(false)
  const openAuth = useAuthEntry(() => setLoginOpen(true))
  const [coupon, setCoupon] = useState('')
  const setNotice = useToastFeedback()

  const cart = useQuery({
    queryKey: cartKey(userId || ''),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    enabled: !!userId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const quote = useQuery({
    queryKey: quoteKey(userId || ''),
    queryFn: ({ signal }) => cartApi.quote({ signal }),
    enabled: !!userId && !!cart.data,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const refresh = async () => {
    if (!userId) return
    await queryClient.invalidateQueries({ queryKey: cartKey(userId) })
    await queryClient.invalidateQueries({ queryKey: quoteKey(userId) })
  }

  const change = useMutation({
    mutationFn: (action: { kind: 'quantity' | 'remove'; input: CartInput }) =>
      action.kind === 'remove' ? cartApi.remove(action.input) : cartApi.setQuantity(action.input),
    onMutate: async ({ kind, input }) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey: cartKey(userId) })
      const previous = queryClient.getQueryData<Cart>(cartKey(userId))
      queryClient.setQueryData<Cart>(
        cartKey(userId),
        (current) =>
          current && {
            ...current,
            items:
              kind === 'remove'
                ? current.items.filter(
                    (line) => line.nftId !== input.nftId || line.editionId !== input.editionId,
                  )
                : current.items.map((line) =>
                    line.nftId === input.nftId && line.editionId === input.editionId
                      ? { ...line, quantity: input.quantity }
                      : line,
                  ),
          },
      )
      setNotice('Atualizando carrinho…')
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (userId && context?.previous) queryClient.setQueryData(cartKey(userId), context.previous)
      setNotice(message(error))
    },
    onSuccess: () => setNotice('Carrinho atualizado.'),
    onSettled: () => {
      void refresh()
    },
  })

  const applyCoupon = useMutation({
    mutationFn: cartApi.coupon,
    onSuccess: () => {
      setCoupon('')
      setNotice('Cupom atualizado.')
      void refresh()
    },
    onError: (error) => setNotice(message(error)),
  })

  const expired = isAxiosError(cart.error) && cart.error.response?.status === 401
  const lines = cart.data?.items || []

  return (
    <div className=" bg-background text-foreground">
      <div className="mx-auto max-w-page px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 xl:px-0">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="mt-4 md:mt-8">
          <div className="relative mb-6 flex min-h-9 items-center justify-center md:hidden">
            <Button
              asChild
              size="icon"
              variant="secondary"
              className="absolute left-0 rounded-full"
              aria-label="Voltar"
            >
              <Link to="/" search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}>
                <ChevronLeft />
              </Link>
            </Button>
            <h1 className="px-11 text-lg leading-6 font-bold">Carrinho de NFTs</h1>
          </div>
          <nav
            aria-label="Caminho de navegação"
            className="mb-3 hidden text-sm text-foreground md:block"
          >
            <Link to="/" search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}>
              Início
            </Link>{' '}
            / Mercado / Carrinho
          </nav>
          {session.isPending ? (
            <div className={`${shimmer} h-72`} aria-label="Carregando sessão" />
          ) : !userId || expired ? (
            <section className="rounded-xl bg-card p-8 text-center">
              <h1 className="text-xl font-bold">Entre para acessar seu carrinho</h1>
              <p className="mt-3 text-muted-foreground">Seus itens ficam salvos na sua conta.</p>
              <Button className="mt-6" onClick={() => openAuth()}>
                Entrar ou criar conta
              </Button>
            </section>
          ) : cart.isPending ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-21.5">
              <div className={`${shimmer} h-72`} />
              <div className={`${shimmer} h-96`} />
            </div>
          ) : cart.isError ? (
            <section role="alert" className="rounded-xl bg-card p-8">
              <h1>Não foi possível carregar o carrinho</h1>
              <Button className="mt-4" onClick={() => void cart.refetch()}>
                Tentar novamente
              </Button>
            </section>
          ) : (
            <div className="flex flex-col gap-8 pb-[calc(28rem+env(safe-area-inset-bottom))] md:grid md:items-start md:pb-0 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-21.5">
              <section aria-label="Itens do carrinho" className="min-w-0">
                {lines.length ? (
                  <>
                    <div className="hidden md:block">
                      <Table className="table-fixed border-separate border-spacing-y-3">
                        <colgroup>
                          <col className="w-[40%]" />
                          <col className="w-[15%]" />
                          <col className="w-[15%]" />
                          <col className="w-[22%]" />
                          <col className="w-[8%]" />
                        </colgroup>
                        <TableHeader>
                          <TableRow className="border-0">
                            <TableHead className="h-8 border-b border-border px-0 pb-3 text-base font-bold text-foreground">
                              NFTs
                            </TableHead>
                            <TableHead className="h-8 border-b border-border px-0 pb-3 text-base text-foreground">
                              Preço
                            </TableHead>
                            <TableHead className="h-8 border-b border-border px-0 pb-3 text-base font-bold text-foreground">
                              Edições
                            </TableHead>
                            <TableHead className="h-8 border-b border-border px-0 pb-3 text-base text-foreground">
                              Total
                            </TableHead>
                            <TableHead className="h-8 border-b border-border" aria-label="Ações" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lines.map((line) => (
                            <TableRow
                              key={`${line.nftId}:${line.editionId}`}
                              className="h-17.5 border-0 bg-card hover:bg-card"
                            >
                              <TableCell className="p-0">
                                <div className="flex min-w-0 items-center gap-4">
                                  <Link
                                    to="/nfts/$nftId"
                                    params={{ nftId: line.nftId }}
                                    className="shrink-0"
                                  >
                                    <img
                                      src={line.nft.displayImageUrl}
                                      alt={line.nft.imageAlt}
                                      className="size-17.5 object-cover"
                                    />
                                  </Link>
                                  <div className="min-w-0">
                                    <Link
                                      to="/nfts/$nftId"
                                      params={{ nftId: line.nftId }}
                                      className="block truncate text-sm font-bold hover:text-accent"
                                    >
                                      {line.nft.name}
                                    </Link>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      Edição:{' '}
                                      {line.nft.editions.find((item) => item.id === line.editionId)
                                        ?.name || line.editionId}
                                    </p>
                                    {line.quantity > line.available && (
                                      <p className="text-xs text-destructive">
                                        Estoque alterado: {line.available} disponível
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-0 text-left text-xs">
                                {line.nft.priceEth} ETH
                              </TableCell>
                              <TableCell className="px-0">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon-xs"
                                    className="rounded-full"
                                    aria-label={`Diminuir ${line.nft.name}`}
                                    disabled={change.isPending || line.quantity <= 1}
                                    onClick={() =>
                                      change.mutate({
                                        kind: 'quantity',
                                        input: {
                                          nftId: line.nftId,
                                          editionId: line.editionId,
                                          quantity: line.quantity - 1,
                                        },
                                      })
                                    }
                                  >
                                    <Minus />
                                  </Button>
                                  <output className="min-w-4 text-center text-sm">
                                    {line.quantity}
                                  </output>
                                  <Button
                                    size="icon-xs"
                                    className="rounded-full"
                                    aria-label={`Aumentar ${line.nft.name}`}
                                    disabled={change.isPending || line.quantity >= line.available}
                                    onClick={() =>
                                      change.mutate({
                                        kind: 'quantity',
                                        input: {
                                          nftId: line.nftId,
                                          editionId: line.editionId,
                                          quantity: line.quantity + 1,
                                        },
                                      })
                                    }
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="px-0 text-left text-xs font-bold text-accent">
                                {eth(ethToWei(line.nft.priceEth) * BigInt(line.quantity))} ETH
                              </TableCell>
                              <TableCell className="px-0 text-left">
                                <Button
                                  size="icon-sm"
                                  variant="icon"
                                  className="text-destructive hover:text-destructive/80 focus-visible:text-destructive"
                                  aria-label={`Remover ${line.nft.name}`}
                                  disabled={change.isPending}
                                  onClick={() =>
                                    change.mutate({
                                      kind: 'remove',
                                      input: {
                                        nftId: line.nftId,
                                        editionId: line.editionId,
                                        quantity: line.quantity,
                                      },
                                    })
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <ul className="space-y-3 md:hidden">
                      {lines.map((line) => (
                        <li
                          key={`${line.nftId}:${line.editionId}`}
                          className="flex min-w-0 gap-3 rounded-xl bg-card p-3"
                        >
                          <Link
                            to="/nfts/$nftId"
                            params={{ nftId: line.nftId }}
                            className="shrink-0 self-start"
                          >
                            <img
                              src={line.nft.displayImageUrl}
                              alt={line.nft.imageAlt}
                              className="size-18 rounded-lg object-cover"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/nfts/$nftId"
                              params={{ nftId: line.nftId }}
                              className="block truncate text-sm font-bold hover:text-accent"
                            >
                              {line.nft.name}
                            </Link>
                            <div className="mt-2 flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate text-xs text-muted-foreground">
                                Edição:{' '}
                                {line.nft.editions.find((item) => item.id === line.editionId)
                                  ?.name || line.editionId}
                              </p>
                              <span className="shrink-0 text-xs font-bold text-accent">
                                {eth(ethToWei(line.nft.priceEth) * BigInt(line.quantity))} ETH
                              </span>
                            </div>
                            {line.quantity > line.available && (
                              <p className="mt-1 text-xs text-destructive">
                                Estoque alterado: {line.available} disponível
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon-xs"
                                  className="rounded-full"
                                  aria-label={`Diminuir ${line.nft.name}`}
                                  disabled={change.isPending || line.quantity <= 1}
                                  onClick={() =>
                                    change.mutate({
                                      kind: 'quantity',
                                      input: {
                                        nftId: line.nftId,
                                        editionId: line.editionId,
                                        quantity: line.quantity - 1,
                                      },
                                    })
                                  }
                                >
                                  <Minus />
                                </Button>
                                <output className="min-w-4 text-center text-sm">
                                  {line.quantity}
                                </output>
                                <Button
                                  size="icon-xs"
                                  className="rounded-full"
                                  aria-label={`Aumentar ${line.nft.name}`}
                                  disabled={change.isPending || line.quantity >= line.available}
                                  onClick={() =>
                                    change.mutate({
                                      kind: 'quantity',
                                      input: {
                                        nftId: line.nftId,
                                        editionId: line.editionId,
                                        quantity: line.quantity + 1,
                                      },
                                    })
                                  }
                                >
                                  <Plus />
                                </Button>
                              </div>
                              <Button
                                size="icon-xs"
                                variant="icon"
                                className="text-destructive hover:text-destructive/80 focus-visible:text-destructive"
                                aria-label={`Remover ${line.nft.name}`}
                                disabled={change.isPending}
                                onClick={() =>
                                  change.mutate({
                                    kind: 'remove',
                                    input: {
                                      nftId: line.nftId,
                                      editionId: line.editionId,
                                      quantity: line.quantity,
                                    },
                                  })
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="rounded-xl bg-card p-8 text-center">
                    <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
                    <Button asChild className="mt-5">
                      <Link
                        to="/"
                        search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
                        hash="catalog"
                      >
                        Explorar NFTs
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
              <aside
                aria-label="Resumo da carteira"
                className="fixed inset-x-0 bottom-0 z-20 max-h-[75dvh] overflow-y-auto rounded-t-[2.5rem] border-t border-border bg-card px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl md:static md:max-h-none md:overflow-visible md:rounded-3xl md:border-0 md:p-6 md:shadow-none lg:rounded-none lg:bg-transparent lg:p-0"
              >
                <h2 className="mb-6 hidden border-b border-border pb-3 text-lg font-medium lg:block">
                  Resumo da carteira
                </h2>
                <label htmlFor="coupon" className="mb-2 hidden text-sm lg:block">
                  Código promocional
                </label>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    applyCoupon.mutate(coupon)
                  }}
                  className="flex items-center justify-center gap-2 lg:gap-0"
                >
                  <label className="sr-only" htmlFor="coupon">
                    Código promocional
                  </label>
                  <Input
                    variant="coupon"
                    id="coupon"
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="Digite o código promocional..."
                  />
                  <Button
                    type="submit"
                    disabled={!coupon.trim() || applyCoupon.isPending}
                    className="rounded-full lg:h-10 lg:rounded-none lg:px-5"
                  >
                    Aplicar
                  </Button>
                </form>
                {quote.isPending ? (
                  <div className={`${shimmer} mt-5 h-32`} aria-label="Calculando resumo" />
                ) : quote.isError ? (
                  <div role="alert" className="mt-5 text-sm">
                    Falha ao calcular valores.{' '}
                    <button className="text-accent underline" onClick={() => void quote.refetch()}>
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  quote.data && (
                    <dl className="mt-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt>Subtotal</dt>
                        <dd>{quote.data.subtotalEth} ETH</dd>
                      </div>
                      {cart.data?.coupon && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-normal">
                          <dt className="min-w-0 flex-1">
                            Cupom{' '}
                            <span className="font-semibold text-accent">{cart.data.coupon}</span>
                          </dt>
                          <dd>(-) {quote.data.discountEth} ETH</dd>
                          <dd>
                            <Button
                              type="button"
                              variant="icon"
                              size="icon"
                              disabled={applyCoupon.isPending}
                              className="size-6 text-destructive hover:text-destructive/80 focus-visible:text-destructive"
                              onClick={() => applyCoupon.mutate(null)}
                              aria-label={`Remover cupom ${cart.data.coupon}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </dd>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between">
                          <dt>Taxa de rede</dt>
                          <dd>{quote.data.networkFeeEth} ETH</dd>
                        </div>
                        <p className="mt-3 text-right text-xs text-accent">Taxa estimada</p>
                      </div>
                      <div className="flex justify-between pt-3 font-bold lg:pt-6">
                        <dt>Total</dt>
                        <dd className="text-accent">{quote.data.totalEth} ETH</dd>
                      </div>
                    </dl>
                  )
                )}
                <Button asChild className="mt-6 h-12 w-full rounded-full lg:h-10 lg:rounded-none">
                  <Link to="/payment" search={{ intent: 'checkout' }}>
                    Conectar e finalizar
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="link"
                  className="mt-3 hidden h-5 w-full p-0 text-[15px] font-normal text-accent md:inline-flex"
                >
                  <Link
                    to="/"
                    search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}
                    hash="catalog"
                  >
                    Continuar explorando
                  </Link>
                </Button>
              </aside>
            </div>
          )}
        </main>
        <CartDiscovery />
      </div>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Acessar conta</DialogTitle>
          <DialogDescription className="sr-only">Entre para acessar o carrinho.</DialogDescription>
          <SessionPage
            onSuccess={() => {
              setLoginOpen(false)
              void queryClient.invalidateQueries({ queryKey: ['session'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
