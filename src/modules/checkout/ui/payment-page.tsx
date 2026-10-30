import { usePageTitle } from '#/shared/hooks/use-page-title'
import { useCallback } from 'react'
import { useToastFeedback } from '#/shared/components/ui/toast'
/* eslint-disable react/set-state-in-effect */
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ChevronLeft } from 'lucide-react'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { RadioGroup, RadioGroupItem } from '#/shared/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { SessionPage } from '#/modules/session/page'
import { sessionApi } from '#/modules/session/api'
import { TOKEN_KEY } from '#/modules/session/model'
import { profileApi, profileKey } from '#/modules/profile'
import { walletsApi, walletsKey, WalletCreateDialog, type WalletInput } from '#/modules/wallets'
import { cartApi, cartKey, quoteKey } from '#/modules/cart'
import { checkoutApi } from '../api'
import { orderQueryOptions } from '../api/queries'
import { OrderResult } from './order-result'
import { CheckoutReviewDialog } from './checkout-review-dialog'
import { CheckoutSummary } from './checkout-summary'
import { CollectorForm } from './collector-form'
import { WalletSelectionPanel } from './wallet-selection-panel'
import { orderKey, type CheckoutAttempt, type CheckoutReview, type Order } from '../model'
import { checkoutStorage } from '../model/storage'
import { useCollectorForm } from '../model/use-collector-form'
import { useWalletSelection } from '../model/use-wallet-selection'
import { usePurchaseFlow } from '../model/use-purchase-flow'

const shimmer =
  'animate-pulse rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]'
const errorMessage = (error: unknown) =>
  isAxiosError(error)
    ? (error.response?.data as { message?: string })?.message ||
      'Falha de conexão. Tente novamente.'
    : 'Não foi possível concluir. Tente novamente.'

const attemptStorageKey = (userId: string) => `kurio.checkout.attempt.${userId}`
const walletLabel: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
  robinhood: 'Robinhood',
}

type Attempt = CheckoutAttempt
type OrderMutation = { userId: string; token: string; attempt: Attempt }

export function PaymentPage({ startCheckout = false }: { startCheckout?: boolean }) {
  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  return (
    <PaymentContent
      key={`${session.data?.user.id || ''}:${session.data?.token || ''}`}
      startCheckout={startCheckout}
      sessionData={session.data}
      sessionPending={session.isPending}
    />
  )
}

function PaymentContent({
  startCheckout,
  sessionData,
  sessionPending,
}: {
  startCheckout: boolean
  sessionData: Awaited<ReturnType<typeof sessionApi.current>> | undefined
  sessionPending: boolean
}) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const userId = sessionData?.user.id
  const identity = `${userId || ''}:${localStorage.getItem(TOKEN_KEY) || ''}`

  const identityRef = useRef(identity)

  useLayoutEffect(() => {
    identityRef.current = identity
    return () => {
      identityRef.current = ''
    }
  }, [identity])

  const [loginOpen, setLoginOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [temporaryWallets, setTemporaryWallets] = useState<Record<string, WalletInput>>({})
  const [application, setApplication] = useState('metamask')
  const [reviewed, setReviewed] = useState<CheckoutReview | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const purchaseFlow = usePurchaseFlow(identity)
  const authorizing = purchaseFlow.busy

  const realtime = useQuery<boolean>({ queryKey: ['realtime-ready'], queryFn: skipToken })

  const trackedOrder = useQuery({
    ...orderQueryOptions(client, userId || '', orderId || ''),
    enabled: !!userId && !!orderId,
  })
  const order = trackedOrder.data
  usePageTitle(
    order
      ? {
          pending: 'Pedido pendente',
          confirmed: 'Pedido confirmado',
          declined: 'Pagamento recusado',
        }[order.status]
      : 'Pagamento',
  )

  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [feedback, setPersistentFeedback] = useState('')
  const notifyFeedback = useToastFeedback('warning')
  const setFeedback = useCallback(
    (message: string) => {
      setPersistentFeedback(message)
      if (message) notifyFeedback(message)
    },
    [notifyFeedback],
  )

  useEffect(() => {
    const stale = () => {
      setReviewed(null)
      setPersistentFeedback('Preço ou disponibilidade atualizado. Revise sua compra.')
    }
    window.addEventListener('kurio:quote-stale', stale)
    return () => window.removeEventListener('kurio:quote-stale', stale)
  }, [])

  const profile = useQuery({
    queryKey: profileKey(userId || ''),
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: !!userId,
  })
  const cart = useQuery({
    queryKey: cartKey(userId || ''),
    queryFn: ({ signal }) => cartApi.get({ signal }),
    enabled: !!userId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
  const quote = useQuery({
    queryKey: quoteKey(userId || ''),
    queryFn: ({ signal }) => checkoutApi.quote(signal),
    enabled: !!userId && !!cart.data,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
  const wallets = useQuery({
    queryKey: walletsKey(userId || ''),
    queryFn: ({ signal }) => walletsApi.list(signal),
    enabled: !!userId,
  })
  const networkKey = (
    quote.data?.networks || [...new Set(cart.data?.items.map(({ nft }) => nft.network) || [])]
  ).join('|')

  const { form, noteLength, registerDraft } = useCollectorForm(userId, profile.data?.email)

  const networks = networkKey ? networkKey.split('|') : []
  const lines = cart.data?.items || []
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  const {
    choices: walletChoices,
    setChoices: setWalletChoices,
    chosen,
    allReady,
  } = useWalletSelection({
    networks,
    wallets: wallets.data || [],
    temporaryWallets,
    userId,
    loaded: wallets.isSuccess,
  })

  useEffect(() => {
    if (!userId) return
    let active = true
    const controller = new AbortController()
    const saved = checkoutStorage.readAttempt(attemptStorageKey(userId))
    if (!saved) return
    try {
      setAttempt(saved)
      void checkoutApi
        .getByAttempt(saved.idempotencyKey, controller.signal)
        .then(async (value) => {
          if (!active || identityRef.current !== identity) return
          const currentCart =
            startCheckout && value.status !== 'pending'
              ? await cartApi.get({ signal: controller.signal })
              : null
          if (!active || identityRef.current !== identity) return
          if (currentCart?.items.length) {
            localStorage.removeItem(attemptStorageKey(userId))
            setOrderId(null)
            setAttempt(null)
            void client.invalidateQueries({ queryKey: cartKey(userId) })
            void client.invalidateQueries({ queryKey: quoteKey(userId) })
            return
          }
          setOrderId(value.id)
          client.setQueryData(orderKey(userId, value.id), (previous: Order | undefined) =>
            previous && (previous.status !== 'pending' || previous.version > value.version)
              ? previous
              : value,
          )
        })
        .catch(() => {
          if (!active || identityRef.current !== identity) return
          setFeedback(
            'Não foi possível recuperar a tentativa anterior. Tente recuperá-la antes de continuar.',
          )
        })
    } catch {
      localStorage.removeItem(attemptStorageKey(userId))
    }
    return () => {
      active = false
      controller.abort()
    }
  }, [userId, identity, startCheckout, client, setFeedback])
  useEffect(() => {
    if (
      !userId ||
      !cart.data ||
      orderId ||
      attempt ||
      checkoutStorage.readAttempt(attemptStorageKey(userId))
    )
      return
    if (new Set(cart.data.items.map(({ nft }) => nft.network)).size > 1) {
      void navigate({ to: '/cart', replace: true })
    }
  }, [userId, cart.data, orderId, attempt, navigate])
  useEffect(() => {
    if (order && startCheckout) {
      void navigate({
        to: '/payment',
        search: { intent: undefined },
        replace: true,
        resetScroll: false,
      })
    }
  }, [order, startCheckout, navigate])
  useEffect(() => {
    if (order?.status !== 'confirmed' || !userId) return
    setCouponInput('')
    void client.invalidateQueries({ queryKey: cartKey(userId) })
    void client.invalidateQueries({ queryKey: quoteKey(userId) })
  }, [order?.status, userId, client])
  useEffect(() => {
    const requests = [cart.error, quote.error, profile.error, wallets.error]
    if (!requests.some((error) => isAxiosError(error) && error.response?.status === 401)) return
    setLoginOpen(true)
    void client.invalidateQueries({ queryKey: ['session'] })
  }, [cart.error, quote.error, profile.error, wallets.error, client])

  const isCurrent = (ownerId: string, token: string) =>
    identityRef.current === `${ownerId}:${token}` &&
    client.getQueryData<{ user?: { id: string } } | null>(['session'])?.user?.id === ownerId
  const createOrder = useMutation({
    mutationFn: ({ attempt: value }: OrderMutation) => checkoutApi.createOrder(value),
    onSuccess: (created, context) => {
      if (!isCurrent(context.userId, context.token)) return
      setOrderId(created.id)
      client.setQueryData(orderKey(context.userId, created.id), (previous: Order | undefined) =>
        previous && (previous.status !== 'pending' || previous.version > created.version)
          ? previous
          : created,
      )
      setFeedback(
        created.status === 'confirmed'
          ? 'Pedido confirmado com sucesso.'
          : created.status === 'declined'
            ? 'Pagamento recusado pela simulação.'
            : '',
      )
      checkoutStorage.writeAttempt(attemptStorageKey(context.userId), context.attempt)
    },
    onError: async (error, context) => {
      if (!isCurrent(context.userId, context.token)) return
      setFeedback(errorMessage(error))
      checkoutStorage.writeAttempt(attemptStorageKey(context.userId), context.attempt)
      try {
        const recovered = await client.fetchQuery({
          queryKey: ['order-attempt', context.userId, context.attempt.idempotencyKey],
          queryFn: ({ signal }) => checkoutApi.getByAttempt(context.attempt.idempotencyKey, signal),
          staleTime: 0,
        })
        if (!isCurrent(context.userId, context.token)) return
        setOrderId(recovered.id)
        client.setQueryData(orderKey(context.userId, recovered.id), (previous: Order | undefined) =>
          previous && (previous.status !== 'pending' || previous.version > recovered.version)
            ? previous
            : recovered,
        )
        checkoutStorage.writeAttempt(attemptStorageKey(context.userId), context.attempt)
      } catch {
        /* A chave e o conteúdo ficam persistidos para recuperação após nova tentativa. */
      }
    },
  })

  const coupon = useMutation({
    mutationFn: ({ code }: { userId: string; token: string; code: string | null }) =>
      cartApi.coupon(code),
    onSuccess: async (_, context) => {
      if (!isCurrent(context.userId, context.token)) return
      setCouponInput('')
      setFeedback('Cupom atualizado.')
      await client.invalidateQueries({ queryKey: cartKey(context.userId) })
      await client.invalidateQueries({ queryKey: quoteKey(context.userId) })
    },
    onError: (error, context) => {
      if (isCurrent(context.userId, context.token)) {
        setPersistentFeedback('')
        notifyFeedback(errorMessage(error))
      }
    },
  })

  const beginReview = async () => {
    if (purchaseFlow.busy) return
    setFeedback('')

    if (!userId) {
      setLoginOpen(true)
      return
    }
    if (!realtime.data) {
      setFeedback('Conexão indisponível. Aguarde a reconexão e tente novamente.')
      return
    }
    if (attempt) {
      setFeedback('Existe uma tentativa salva. Recupere o pedido antes de iniciar outra compra.')
      return
    }
    if (!quote.data?.valid) {
      setFeedback('A disponibilidade mudou. Atualize o carrinho antes de continuar.')
      return
    }
    if (!allReady) {
      setFeedback('Selecione uma carteira compatível com a rede dos NFTs.')
      return
    }
    if (!purchaseFlow.start('reviewing')) return
    const activeIdentity = identity
    try {
      const fresh = await client.fetchQuery({
        queryKey: quoteKey(userId),
        queryFn: ({ signal }) => checkoutApi.quote(signal),
        staleTime: 0,
      })
      if (identityRef.current !== activeIdentity) return
      if (!fresh.valid) {
        setFeedback('A disponibilidade mudou. Atualize o carrinho antes de continuar.')
        return
      }
      setReviewed({ quote: fresh, collector: form.getValues(), wallets: [...chosen], application })
    } catch (error) {
      if (identityRef.current === activeIdentity) setFeedback(errorMessage(error))
    } finally {
      purchaseFlow.finish()
    }
  }
  const confirm = async () => {
    if (purchaseFlow.busy) return
    if (!allReady || !realtime.data || !reviewed) {
      setFeedback('Revise as carteiras e aguarde a conexão antes de confirmar a compra.')
      return
    }
    if (!userId) {
      setLoginOpen(true)
      return
    }
    if (!purchaseFlow.start('revalidating')) return
    setFeedback('')
    try {
      const activeIdentity = identity
      const currentQuote = await client.fetchQuery({
        queryKey: quoteKey(userId),
        queryFn: ({ signal }) => checkoutApi.quote(signal),
        staleTime: 0,
      })
      if (identityRef.current !== activeIdentity) return
      if (!currentQuote.valid) {
        setReviewed(null)
        setFeedback('Não foi possível finalizar: disponibilidade insuficiente.')
        return
      }
      if (
        currentQuote.id !== reviewed.quote.id ||
        currentQuote.version !== reviewed.quote.version ||
        currentQuote.totalEth !== reviewed.quote.totalEth
      ) {
        setReviewed({ ...reviewed, quote: currentQuote })
        setFeedback(
          'Preço, estoque ou taxas mudaram. Confira os novos valores e confirme novamente.',
        )
        return
      }
      purchaseFlow.advance('connecting')
      for (const wallet of reviewed.wallets) {
        if (identityRef.current !== activeIdentity) return
        await checkoutApi.connect(wallet.id, reviewed.application, wallet)
      }
      if (identityRef.current !== activeIdentity) return
      const payload: Attempt = {
        idempotencyKey: crypto.randomUUID(),
        quoteId: currentQuote.id,
        collector: reviewed.collector,
        wallets: reviewed.wallets.map(
          ({ id, alias, network, address, ensName, kind, temporary }) => ({
            id,
            alias,
            network,
            address,
            ensName,
            kind,
            temporary,
          }),
        ),
      }
      setAttempt(payload)
      checkoutStorage.writeAttempt(attemptStorageKey(userId), payload)
      setReviewed(null)
      purchaseFlow.advance('submitting')
      await createOrder.mutateAsync({
        userId,
        token: localStorage.getItem(TOKEN_KEY) || '',
        attempt: payload,
      })
    } catch (error) {
      if (identityRef.current === identity) setFeedback(errorMessage(error))
    } finally {
      purchaseFlow.finish()
    }
  }
  const recoverAttempt = async () => {
    if (!attempt || !userId) return
    if (!purchaseFlow.start('recovering')) return
    const activeIdentity = identity
    try {
      const recovered = await client.fetchQuery({
        queryKey: ['order-attempt', userId, attempt.idempotencyKey],
        queryFn: ({ signal }) => checkoutApi.getByAttempt(attempt.idempotencyKey, signal),
        staleTime: 0,
      })
      if (
        !isCurrent(userId, localStorage.getItem(TOKEN_KEY) || '') ||
        identityRef.current !== activeIdentity
      )
        return
      setOrderId(recovered.id)
      client.setQueryData(orderKey(userId, recovered.id), (previous: Order | undefined) =>
        previous && (previous.status !== 'pending' || previous.version > recovered.version)
          ? previous
          : recovered,
      )
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 404) {
        if (isCurrent(userId, localStorage.getItem(TOKEN_KEY) || ''))
          setFeedback(
            'Não foi possível consultar a tentativa. Ela continua reservada; tente recuperar novamente.',
          )
        return
      }
      if (
        isCurrent(userId, localStorage.getItem(TOKEN_KEY) || '') &&
        identityRef.current === activeIdentity
      ) {
        purchaseFlow.advance('submitting')
        await createOrder.mutateAsync({
          userId,
          token: localStorage.getItem(TOKEN_KEY) || '',
          attempt,
        })
      }
    } finally {
      purchaseFlow.finish()
    }
  }
  const startNewAttempt = () => {
    if (userId) localStorage.removeItem(attemptStorageKey(userId))
    setOrderId(null)
    setAttempt(null)
    setFeedback('Revise os dados e as carteiras para iniciar uma nova tentativa.')
  }
  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if ((await form.trigger()) && identityRef.current === identity) await beginReview()
  }

  return (
    <div className=" bg-background text-foreground">
      <div className="mx-auto max-w-page px-4 pt-6 pb-24 sm:px-6 xl:px-0">
        <Header />
        <main className="mt-8">
          {feedback && <output className="mb-4 block text-sm">{feedback}</output>}
          <nav aria-label="Caminho de navegação" className="mb-3 hidden text-sm md:block">
            <Link to="/" search={{ ranking: 'all', sort: 'recently-listed', page: 1 }}>
              Início
            </Link>{' '}
            / Mercado / Pagamento
          </nav>
          <div className="mb-6 flex items-center gap-4 md:hidden">
            <Button
              asChild
              size="icon"
              variant="secondary"
              className="rounded-full"
              aria-label="Voltar ao carrinho"
            >
              <Link to="/cart">
                <ChevronLeft />
              </Link>
            </Button>
            <h1 className="font-bold">Pagamento</h1>
          </div>
          {sessionPending ? (
            <div className={`${shimmer} h-72`} aria-label="Carregando sessão" />
          ) : !userId ? (
            <section className="rounded-lg bg-card p-8 text-center">
              <h1 className="font-mono text-xl font-bold">Entre para continuar com o pagamento</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Seu carrinho permanece salvo enquanto você acessa sua conta.
              </p>
              <Button className="mt-6" onClick={() => setLoginOpen(true)}>
                Entrar ou criar conta
              </Button>
            </section>
          ) : order ? (
            <OrderResult order={order} onRecover={startNewAttempt} busy={createOrder.isPending} />
          ) : cart.isPending || quote.isPending || profile.isPending || wallets.isPending ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
              <div className={`${shimmer} h-155`} />
              <div className={`${shimmer} h-155`} />
            </div>
          ) : cart.isError || quote.isError || profile.isError || wallets.isError ? (
            <section role="alert" className="rounded-lg bg-card p-8">
              <h1>Não foi possível carregar o pagamento</h1>
              <Button
                className="mt-4"
                onClick={() => {
                  void cart.refetch()
                  void quote.refetch()
                  void profile.refetch()
                  void wallets.refetch()
                }}
              >
                Tentar novamente
              </Button>
            </section>
          ) : !lines.length ? (
            <section className="rounded-lg bg-card p-8 text-center">
              <h1 className="font-mono text-xl font-bold">Seu carrinho está vazio</h1>
              <Button asChild className="mt-6">
                <Link to="/cart">Voltar ao carrinho</Link>
              </Button>
            </section>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
              <section className="min-w-0 space-y-7">
                <h1 className="hidden font-mono text-2xl font-bold md:block">Pagamento</h1>
                <form id="checkout-form" noValidate onSubmit={submitForm} className="space-y-7">
                  <CollectorForm
                    form={form}
                    registerDraft={registerDraft}
                    username={profile.data?.username || ''}
                    noteLength={noteLength}
                  >
                    <WalletSelectionPanel
                      networks={networks}
                      wallets={wallets.data}
                      choices={walletChoices}
                      labels={walletLabel}
                      temporaryWallets={temporaryWallets}
                      onChooseSaved={(network, walletId) => {
                        setWalletChoices((current) => ({
                          ...current,
                          [network]: { network, kind: 'saved', walletId },
                        }))
                        setReviewed(null)
                      }}
                      onChooseTemporary={(network) => {
                        setWalletChoices((current) => ({
                          ...current,
                          [network]: { network, kind: 'temporary' },
                        }))
                        setReviewed(null)
                      }}
                      onTemporaryChange={(network, value) => {
                        setTemporaryWallets((current) => ({ ...current, [network]: value }))
                        setReviewed(null)
                      }}
                      onAdd={() => setWalletOpen(true)}
                    />
                  </CollectorForm>
                </form>
              </section>
              <aside className="space-y-4 lg:sticky lg:top-6">
                <section className="space-y-4 p-4 md:p-6">
                  <CheckoutSummary
                    lines={lines}
                    totalQuantity={totalQuantity}
                    coupon={cart.data?.coupon || null}
                    quote={quote.data}
                    couponInput={couponInput}
                    couponPending={coupon.isPending}
                    onCouponInput={setCouponInput}
                    onApplyCoupon={(code) =>
                      coupon.mutate({
                        userId: userId || '',
                        token: localStorage.getItem(TOKEN_KEY) || '',
                        code,
                      })
                    }
                    onRemoveCoupon={() =>
                      coupon.mutate({
                        userId: userId || '',
                        token: localStorage.getItem(TOKEN_KEY) || '',
                        code: null,
                      })
                    }
                  />
                  <section className="space-y-4" aria-labelledby="payment-apps-title">
                    <h2
                      id="payment-apps-title"
                      className="text-center font-mono text-[17px] font-bold"
                    >
                      Carteira e rede
                    </h2>
                    <RadioGroup
                      aria-label="Aplicativo de carteira"
                      value={application}
                      onValueChange={(value) => {
                        setApplication(value)
                        setReviewed(null)
                      }}
                      disabled={authorizing || createOrder.isPending}
                    >
                      {[
                        { id: 'metamask', name: 'MetaMask' },
                        { id: 'coinbase', name: 'Coinbase Wallet' },
                      ].map((app) => (
                        <label
                          key={app.id}
                          htmlFor={'app-' + app.id}
                          className="flex cursor-pointer items-center gap-3 border border-border p-3 text-sm has-data-[state=checked]:border-primary"
                        >
                          <RadioGroupItem id={'app-' + app.id} value={app.id} />
                          {app.name}
                        </label>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      Conexão e autorização simuladas pelo aplicativo selecionado.
                    </p>
                  </section>
                  {attempt && (
                    <div className="rounded border border-accent/50 p-3 text-sm">
                      <p>Há uma tentativa salva. Recupere o mesmo pedido antes de iniciar outro.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={recoverAttempt}
                        disabled={authorizing || createOrder.isPending}
                      >
                        {authorizing || createOrder.isPending
                          ? 'Recuperando…'
                          : 'Recuperar tentativa salva'}
                      </Button>
                    </div>
                  )}
                  <Button
                    type="submit"
                    form="checkout-form"
                    variant="cta"
                    className="h-12 w-full"
                    disabled={authorizing || createOrder.isPending}
                  >
                    Confirmar compra
                  </Button>
                  {!quote.data?.valid && (
                    <p role="alert" className="text-sm text-destructive">
                      Há itens sem disponibilidade. Volte ao carrinho para ajustar.
                    </p>
                  )}
                </section>
                <Button asChild variant="link" className="w-full text-accent">
                  <Link to="/cart">Voltar ao carrinho</Link>
                </Button>
              </aside>
            </div>
          )}
        </main>
      </div>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Acessar conta</DialogTitle>
          <DialogDescription className="sr-only">Entre para retomar o pagamento.</DialogDescription>
          <SessionPage
            onSuccess={() => {
              setLoginOpen(false)
              void client.invalidateQueries({ queryKey: ['session'] })
            }}
          />
        </DialogContent>
      </Dialog>
      {userId && (
        <WalletCreateDialog
          userId={userId}
          initialNetwork="ethereum"
          open={walletOpen}
          onOpenChange={setWalletOpen}
          onCreated={(wallet) => {
            setWalletChoices((current) => ({
              ...current,
              [wallet.network]: { network: wallet.network, kind: 'saved', walletId: wallet.id },
            }))
            setReviewed(null)
            void client.invalidateQueries({ queryKey: walletsKey(userId) })
          }}
        />
      )}
      <CheckoutReviewDialog
        review={reviewed}
        lines={lines}
        displayName={profile.data?.displayName || ''}
        totalQuantity={totalQuantity}
        labels={walletLabel}
        busy={authorizing || createOrder.isPending}
        onClose={() => setReviewed(null)}
        onConfirm={() => void confirm()}
      />
    </div>
  )
}
