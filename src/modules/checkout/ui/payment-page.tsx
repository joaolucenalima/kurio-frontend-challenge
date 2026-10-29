import { useCallback } from 'react'
import { useToastFeedback } from '#/shared/components/ui/toast'
/* eslint-disable react/set-state-in-effect */
import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertCircle, Check, ChevronLeft, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
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
import {
  walletsApi,
  walletsKey,
  WalletCreateDialog,
  type WalletNetwork,
  walletSchema,
  type WalletInput,
} from '#/modules/wallets'
import { cartApi, cartKey, quoteKey } from '#/modules/cart'
import { ethToWei } from '#/modules/catalog'
import { checkoutApi } from '../api'
import { OrderConfirmation } from './order-confirmation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  checkoutSchema,
  type CheckoutInput,
  type CheckoutQuote,
  type Order,
  type CheckoutWallet,
} from '../model'

const shimmer =
  'animate-pulse rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]'
const eth = (value: string) => `${value} ETH`
const lineSubtotal = (price: string, quantity: number) => {
  const value = ethToWei(price) * BigInt(quantity)
  const fraction = (value % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / 10n ** 18n}${fraction ? `.${fraction}` : ''}`
}
const errorMessage = (error: unknown) =>
  isAxiosError(error)
    ? (error.response?.data as { message?: string })?.message ||
      'Falha de conexão. Tente novamente.'
    : 'Não foi possível concluir. Tente novamente.'
const attemptStorageKey = (userId: string) => `kurio.checkout.attempt.${userId}`
const draftStorageKey = (userId: string) => `kurio.checkout.draft.${userId}`
const walletLabel: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
  robinhood: 'Robinhood',
}

type Attempt = {
  idempotencyKey: string
  quoteId: string
  collector: CheckoutInput
  wallets: CheckoutWallet[]
}
type OrderMutation = { userId: string; token: string; attempt: Attempt }

export function PaymentPage({ startCheckout = false }: { startCheckout?: boolean }) {
  const client = useQueryClient()

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })

  const userId = session.data?.user.id
  const identity = `${userId || ''}:${localStorage.getItem(TOKEN_KEY) || ''}`

  const identityRef = useRef(identity)
  const previousIdentityRef = useRef(identity)

  useLayoutEffect(() => {
    identityRef.current = identity
  }, [identity])

  const confirmLock = useRef(false)

  const [loginOpen, setLoginOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [walletNetwork, setWalletNetwork] = useState<WalletNetwork>('ethereum')
  const [authorizing, setAuthorizing] = useState(false)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [preferOtherWallet, setPreferOtherWallet] = useState(false)
  const [temporaryWallets, setTemporaryWallets] = useState<Record<string, WalletInput>>({})
  const [application, setApplication] = useState('metamask')
  const [review, setReview] = useState(false)
  const [reviewed, setReviewed] = useState<CheckoutQuote | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [noteLength, setNoteLength] = useState(0)
  const [feedback, setPersistentFeedback] = useState('')
  const notifyFeedback = useToastFeedback('warning')
  const setFeedback = useCallback(
    (message: string) => {
      setPersistentFeedback(message)
      notifyFeedback(message)
    },
    [notifyFeedback],
  )

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { email: '', note: '' },
  })
  const registerDraft = (name: keyof CheckoutInput) => {
    const field = form.register(name)
    return {
      ...field,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        void field.onChange(event)
        if (name === 'note') setNoteLength(event.target.value.length)
        if (userId)
          localStorage.setItem(
            draftStorageKey(userId),
            JSON.stringify({ ...form.getValues(), [name]: event.target.value }),
          )
      },
    }
  }
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

  const networks = networkKey ? networkKey.split('|') : []
  const lines = cart.data?.items || []
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  const chosen = networks.flatMap<CheckoutWallet>((network) => {
    const saved = wallets.data?.find(
      (wallet) => wallet.id === selected[network] && wallet.network === network,
    )
    if (saved) return [saved]
    const parsed = walletSchema.safeParse(temporaryWallets[network])
    return parsed.success
      ? [{ ...parsed.data, id: 'temporary:' + userId + ':' + network, temporary: true }]
      : []
  })
  const primaryWallet = wallets.data?.find((wallet) => wallet.isPrimary)
  const requiresOtherNetwork =
    !!primaryWallet && networks.some((network) => network !== primaryWallet.network)
  const usesOtherWallet =
    requiresOtherNetwork ||
    preferOtherWallet ||
    chosen.some((wallet) => wallet.id !== primaryWallet?.id)
  const allReady =
    networks.length > 0 &&
    networks.every((network) => {
      const wallet = chosen.find((item) => item.network === network)
      return !!wallet && wallet.network === network
    })

  useEffect(() => {
    if (!profile.data || form.formState.isDirty) return
    try {
      const saved = localStorage.getItem(draftStorageKey(userId || ''))
      if (saved) {
        const values = JSON.parse(saved) as CheckoutInput
        form.reset(values)
        setNoteLength(values.note.length)
        return
      }
    } catch {
      if (userId) localStorage.removeItem(draftStorageKey(userId))
    }
    form.reset({ email: profile.data.email, note: '' })
    setNoteLength(0)
  }, [profile.data, form, form.formState.isDirty, userId])

  useEffect(() => {
    const previousUserId = previousIdentityRef.current.split(':')[0]
    previousIdentityRef.current = identity
    if (
      identity === `${userId || ''}:${localStorage.getItem(TOKEN_KEY) || ''}` &&
      !previousUserId &&
      userId
    ) {
      setOrder(null)
      setAttempt(null)
      setReviewed(null)
      setReview(false)
      setSelected({})
      setPreferOtherWallet(false)
      setTemporaryWallets({})
      setFeedback('')
      return
    }
    confirmLock.current = false
    setOrder(null)
    setAttempt(null)
    setReviewed(null)
    setReview(false)
    setSelected({})
    setPreferOtherWallet(false)
    setTemporaryWallets({})
    setFeedback('')
    if (previousUserId && userId && previousUserId !== userId) form.reset({ email: '', note: '' })
    else if (!userId) form.reset({ email: '', note: '' })
    if (!userId || (previousUserId && previousUserId !== userId)) setNoteLength(0)
  }, [form, identity, userId, setFeedback])

  useEffect(() => {
    if (!wallets.data?.length) return
    setSelected((current) => {
      const next = { ...current }
      for (const network of networkKey.split('|').filter(Boolean)) {
        const currentWallet = wallets.data.find(
          (wallet) => wallet.id === next[network] && wallet.network === network,
        )
        next[network] =
          currentWallet?.id ||
          wallets.data.find((wallet) => wallet.network === network && wallet.isPrimary)?.id ||
          wallets.data.find((wallet) => wallet.network === network)?.id ||
          ''
      }
      return next
    })
  }, [wallets.data, networkKey])

  useEffect(() => {
    if (!userId) return
    let active = true
    const raw = localStorage.getItem(attemptStorageKey(userId))
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as { attempt: Attempt; order?: Order }
      if (startCheckout && saved.order && saved.order.status !== 'pending') {
        localStorage.removeItem(attemptStorageKey(userId))
        setOrder(null)
        setAttempt(null)
        return
      }
      setAttempt(saved.attempt)
      void checkoutApi
        .getByAttempt(saved.attempt.idempotencyKey)
        .then((value) => {
          if (!active || identityRef.current !== identity) return
          if (startCheckout && value.status !== 'pending') {
            localStorage.removeItem(attemptStorageKey(userId))
            setOrder(null)
            setAttempt(null)
            void client.invalidateQueries({ queryKey: cartKey(userId) })
            void client.invalidateQueries({ queryKey: quoteKey(userId) })
            return
          }
          setOrder(value)
          localStorage.setItem(
            attemptStorageKey(userId),
            JSON.stringify({ attempt: saved.attempt, order: value }),
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
    }
  }, [userId, identity, startCheckout, client, setFeedback])
  useEffect(() => {
    if (!order || !userId || order.status !== 'pending') return
    const token = localStorage.getItem(TOKEN_KEY)
    const activeIdentity = identity
    const timer = window.setInterval(() => {
      void checkoutApi
        .getOrder(order.id)
        .then((value) => {
          if (identityRef.current === activeIdentity && localStorage.getItem(TOKEN_KEY) === token)
            setOrder(value)
        })
        .catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [order, userId, identity])
  useEffect(() => {
    if (order?.status !== 'confirmed' || !userId) return
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
      setOrder(created)
      setFeedback(
        created.status === 'confirmed'
          ? 'Pedido confirmado com sucesso.'
          : created.status === 'declined'
            ? 'Pagamento recusado pela simulação.'
            : 'Pedido pendente. Vamos atualizar o status automaticamente.',
      )
      localStorage.setItem(
        attemptStorageKey(context.userId),
        JSON.stringify({ attempt: context.attempt, order: created }),
      )
    },
    onError: async (error, context) => {
      if (!isCurrent(context.userId, context.token)) return
      setFeedback(errorMessage(error))
      localStorage.setItem(
        attemptStorageKey(context.userId),
        JSON.stringify({ attempt: context.attempt }),
      )
      try {
        const recovered = await checkoutApi.getByAttempt(context.attempt.idempotencyKey)
        if (!isCurrent(context.userId, context.token)) return
        setOrder(recovered)
        localStorage.setItem(
          attemptStorageKey(context.userId),
          JSON.stringify({ attempt: context.attempt, order: recovered }),
        )
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
      if (isCurrent(context.userId, context.token)) setFeedback(errorMessage(error))
    },
  })
  const beginReview = async () => {
    setFeedback('')
    if (!userId) {
      setLoginOpen(true)
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
      setFeedback('Selecione uma carteira compatível para cada rede dos NFTs.')
      return
    }
    try {
      const activeIdentity = identity
      const fresh = await client.fetchQuery({
        queryKey: quoteKey(userId),
        queryFn: () => checkoutApi.quote(),
        staleTime: 0,
      })
      if (identityRef.current !== activeIdentity) return
      if (!fresh.valid) {
        setFeedback('A disponibilidade mudou. Atualize o carrinho antes de continuar.')
        return
      }
      setReviewed(fresh)
      setReview(true)
    } catch (error) {
      setFeedback(errorMessage(error))
    }
  }
  const confirm = async () => {
    if (!userId || !reviewed || !allReady || confirmLock.current) return
    confirmLock.current = true
    setAuthorizing(true)
    setFeedback('')
    try {
      const activeIdentity = identity
      const currentQuote = await checkoutApi.quote()
      if (identityRef.current !== activeIdentity) return
      if (!currentQuote.valid) {
        setReview(false)
        setReviewed(null)
        setFeedback('Não foi possível finalizar: disponibilidade insuficiente.')
        return
      }
      if (
        currentQuote.id !== reviewed.id ||
        currentQuote.version !== reviewed.version ||
        currentQuote.totalEth !== reviewed.totalEth
      ) {
        setReviewed(currentQuote)
        setFeedback(
          'Preço, estoque ou taxas mudaram. Confira os novos valores e confirme novamente.',
        )
        return
      }
      for (const wallet of chosen) {
        if (identityRef.current !== activeIdentity) return
        await checkoutApi.connect(wallet.id, application, wallet)
      }
      if (identityRef.current !== activeIdentity) return
      const values = form.getValues()
      const payload: Attempt = {
        idempotencyKey: crypto.randomUUID(),
        quoteId: currentQuote.id,
        collector: values,
        wallets: chosen.map(({ id, alias, network, address, ensName, kind, temporary }) => ({
          id,
          alias,
          network,
          address,
          ensName,
          kind,
          temporary,
        })),
      }
      setAttempt(payload)
      localStorage.setItem(attemptStorageKey(userId), JSON.stringify({ attempt: payload }))
      setReview(false)
      createOrder.mutate({ userId, token: localStorage.getItem(TOKEN_KEY) || '', attempt: payload })
    } catch (error) {
      if (identityRef.current === identity) setFeedback(errorMessage(error))
    } finally {
      confirmLock.current = false
      setAuthorizing(false)
    }
  }
  const recoverAttempt = () => {
    if (!attempt || !userId) return
    createOrder.mutate({ userId, token: localStorage.getItem(TOKEN_KEY) || '', attempt })
  }
  const startNewAttempt = () => {
    if (userId) localStorage.removeItem(attemptStorageKey(userId))
    setOrder(null)
    setAttempt(null)
    setFeedback('Revise os dados e as carteiras para iniciar uma nova tentativa.')
  }
  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (await form.trigger()) await beginReview()
  }

  return (
    <div className=" bg-background text-foreground">
      <div className="mx-auto max-w-page px-4 pt-6 pb-24 sm:px-6 xl:px-0">
        <Header />
        <main className="mt-8">
          <nav aria-label="Caminho de navegação" className="mb-3 hidden text-sm md:block">
            <Link to="/" search={{ ranking: 'all', sort: 'featured', page: 1 }}>
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
          {session.isPending ? (
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
            <OrderResult
              order={order}
              feedback={feedback}
              onRecover={startNewAttempt}
              busy={createOrder.isPending}
            />
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
                  <section className="space-y-5">
                    <h2 className="font-mono text-[17px] font-bold">Perfil do colecionador</h2>
                    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                      <Field label="E-mail" error={form.formState.errors.email?.message}>
                        <Input
                          type="email"
                          {...registerDraft('email')}
                          aria-invalid={!!form.formState.errors.email}
                        />
                      </Field>
                      <Field label="Nome de usuário">
                        <Input
                          value={profile.data?.username || ''}
                          readOnly
                          className="text-muted-foreground"
                        />
                      </Field>
                      <section className="space-y-5 md:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="font-mono text-[17px] font-bold">Carteiras cadastradas</h2>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setWalletNetwork('ethereum')
                              setWalletOpen(true)
                            }}
                          >
                            <Plus />
                            Adicionar carteira
                          </Button>
                        </div>
                        {networks.map((network, index) => {
                          const options = wallets.data.filter(
                            (wallet) => wallet.network === network,
                          )
                          return (
                            <div key={network} className="space-y-4">
                              {index === 1 && (
                                <div className="space-y-2">
                                  <RadioGroup
                                    aria-label="Usar outra carteira?"
                                    value={usesOtherWallet ? 'other' : 'primary'}
                                    onValueChange={() => {
                                      setPreferOtherWallet(true)
                                      setReviewed(null)
                                    }}
                                  >
                                    <label
                                      htmlFor="use-other-wallet"
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <RadioGroupItem id="use-other-wallet" value="other" />
                                      Usar outra carteira?
                                    </label>
                                  </RadioGroup>
                                  {requiresOtherNetwork && (
                                    <p className="text-xs text-muted-foreground">
                                      Outra carteira é obrigatória porque a compra inclui uma rede
                                      diferente da carteira principal.
                                    </p>
                                  )}
                                </div>
                              )}
                              <fieldset className={options.length ? 'space-y-3' : 'space-y-1'}>
                                <legend
                                  className={`${options.length ? 'mb-3' : 'mb-1'} text-sm font-semibold`}
                                >
                                  {walletLabel[network]}
                                </legend>
                                {options.length > 0 && (
                                  <RadioGroup
                                    aria-label={'Carteiras de ' + walletLabel[network]}
                                    value={selected[network] || ''}
                                    onValueChange={(value) => {
                                      setSelected((current) => ({ ...current, [network]: value }))
                                      setPreferOtherWallet(value !== primaryWallet?.id)
                                      setReviewed(null)
                                    }}
                                  >
                                    {options.map((wallet) => (
                                      <label
                                        key={wallet.id}
                                        htmlFor={'payment-wallet-' + wallet.id}
                                        className="flex cursor-pointer items-center gap-3 border border-border p-3 text-sm has-[[data-state=checked]]:border-primary"
                                      >
                                        <RadioGroupItem
                                          id={'payment-wallet-' + wallet.id}
                                          value={wallet.id}
                                        />
                                        <span className="min-w-0">
                                          <span className="block font-semibold">
                                            {wallet.alias}
                                            {wallet.isPrimary ? ' · principal' : ''}
                                          </span>
                                          <span className="block text-xs text-muted-foreground">
                                            {walletLabel[wallet.network]} ·{' '}
                                            {
                                              {
                                                extension: 'Extensão',
                                                hardware: 'Hardware',
                                                custodial: 'Custodial',
                                              }[wallet.kind]
                                            }
                                          </span>
                                          <span className="block break-all text-xs text-muted-foreground">
                                            {wallet.address}
                                          </span>
                                        </span>
                                      </label>
                                    ))}
                                  </RadioGroup>
                                )}
                                {!options.length && (
                                  <TemporaryWalletForm
                                    network={network as WalletNetwork}
                                    value={temporaryWallets[network]}
                                    onChange={(value) => {
                                      setTemporaryWallets((current) => ({
                                        ...current,
                                        [network]: value,
                                      }))
                                      setReviewed(null)
                                    }}
                                  />
                                )}
                              </fieldset>
                            </div>
                          )
                        })}
                        {networks.length < 2 && (
                          <div className="space-y-2">
                            <RadioGroup
                              aria-label="Usar outra carteira?"
                              value={usesOtherWallet ? 'other' : 'primary'}
                              onValueChange={() => {
                                setPreferOtherWallet(true)
                                setReviewed(null)
                              }}
                            >
                              <label
                                htmlFor="use-other-wallet"
                                className="flex items-center gap-2 text-sm"
                              >
                                <RadioGroupItem id="use-other-wallet" value="other" />
                                Usar outra carteira?
                              </label>
                            </RadioGroup>
                            {requiresOtherNetwork && (
                              <p className="text-xs text-muted-foreground">
                                Outra carteira é obrigatória porque a compra inclui uma rede
                                diferente da carteira principal.
                              </p>
                            )}
                          </div>
                        )}
                      </section>
                      <Field
                        label="Observação do colecionador (opcional)"
                        error={form.formState.errors.note?.message}
                        className="md:col-span-2"
                      >
                        <Textarea
                          {...registerDraft('note')}
                          maxLength={500}
                          rows={4}
                          aria-invalid={!!form.formState.errors.note}
                        />
                        <span className="text-right text-xs text-muted-foreground">
                          {noteLength}/500
                        </span>
                      </Field>
                    </div>
                  </section>
                </form>
              </section>
              <aside className="space-y-4 lg:sticky lg:top-6">
                <section className="space-y-4 p-4 md:p-6">
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
                            className="size-[70px] shrink-0 rounded-sm object-cover"
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
                        <span className="max-w-24 break-words text-right text-xs font-bold text-accent">
                          {lineSubtotal(line.nft.priceEth, line.quantity)} ETH
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
                      coupon.mutate({
                        userId: userId || '',
                        token: localStorage.getItem(TOKEN_KEY) || '',
                        code: couponInput.trim() || null,
                      })
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
                      onChange={(event) => setCouponInput(event.target.value)}
                      placeholder="Digite o código promocional..."
                    />
                    <Button
                      type="submit"
                      disabled={!couponInput.trim() || coupon.isPending}
                      className="rounded-full lg:h-10 lg:rounded-none lg:px-5"
                    >
                      Aplicar
                    </Button>
                  </form>
                  <dl className="space-y-3 border-t border-accent/60 pt-4 text-sm">
                    <PriceRow
                      label="Subtotal"
                      value={quote.data ? eth(quote.data.subtotalEth) : '—'}
                    />
                    {cart.data?.coupon && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-normal">
                        <dt className="min-w-0 flex-1">
                          Cupom{' '}
                          <span className="font-semibold text-accent">{cart.data.coupon}</span>
                        </dt>
                        <dd>(-) {quote.data?.discountEth} ETH</dd>
                        <dd>
                          <Button
                            type="button"
                            variant="icon"
                            size="icon"
                            disabled={coupon.isPending}
                            className="size-6 text-destructive hover:text-destructive/80 focus-visible:text-destructive"
                            onClick={() =>
                              coupon.mutate({
                                userId: userId || '',
                                token: localStorage.getItem(TOKEN_KEY) || '',
                                code: null,
                              })
                            }
                            aria-label={'Remover cupom ' + cart.data.coupon}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </dd>
                      </div>
                    )}
                    <div>
                      <PriceRow
                        label="Taxa de rede"
                        value={quote.data ? eth(quote.data.networkFeeEth) : '—'}
                      />
                      <p className="mt-2 text-right text-xs text-accent">Taxa estimada</p>
                    </div>
                    <div className="flex justify-between border-t border-accent/60 pt-4 font-bold">
                      <dt>Total</dt>
                      <dd className="text-accent">{quote.data ? eth(quote.data.totalEth) : '—'}</dd>
                    </div>
                  </dl>
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
                          className="flex cursor-pointer items-center gap-3 border border-border p-3 text-sm has-[[data-state=checked]]:border-primary"
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
                        disabled={createOrder.isPending}
                      >
                        {createOrder.isPending ? 'Recuperando…' : 'Recuperar tentativa salva'}
                      </Button>
                    </div>
                  )}
                  <Button
                    type="submit"
                    form="checkout-form"
                    variant="cta"
                    className="h-12 w-full"
                    disabled={
                      !!attempt ||
                      authorizing ||
                      createOrder.isPending ||
                      !quote.data?.valid ||
                      !allReady
                    }
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

          <output aria-live="polite" className="mt-4 block text-sm text-accent">
            {feedback}
          </output>
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
          initialNetwork={walletNetwork}
          open={walletOpen}
          onOpenChange={setWalletOpen}
          onCreated={(wallet) => {
            setSelected((current) => ({ ...current, [wallet.network]: wallet.id }))
            void client.invalidateQueries({ queryKey: walletsKey(userId) })
          }}
        />
      )}
      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent className="flex max-h-[90dvh] w-[min(95vw,672px)] flex-col gap-0 overflow-hidden border border-border border-b-4 border-b-primary p-0 pb-0">
          <header className="space-y-2 border-b border-border px-5 py-5 pr-12 md:px-7 md:pr-12">
            <DialogTitle className="font-mono text-xl font-bold">Confirmar compra</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Revise os itens, as carteiras de destino e o total antes de finalizar.
            </DialogDescription>
          </header>
          <div
            className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 md:px-7"
            aria-busy={authorizing || createOrder.isPending}
          >
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
                      <p className="break-words text-sm font-semibold">{line.nft.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {line.nft.editions.find((edition) => edition.id === line.editionId)?.name ||
                          line.editionId}{' '}
                        · Qtd. {line.quantity}
                      </p>
                    </div>
                    <span className="max-w-[40%] break-words text-right text-xs font-semibold text-accent">
                      {lineSubtotal(line.nft.priceEth, line.quantity)} ETH
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <div className="grid gap-5 border-y border-border py-5 md:grid-cols-2">
              <section className="min-w-0 space-y-2">
                <h3 className="text-sm font-semibold">Colecionador</h3>
                <p className="break-words text-sm">{profile.data?.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{form.getValues('email')}</p>
                {form.getValues('note') && (
                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                    {form.getValues('note')}
                  </p>
                )}
              </section>
              <section className="min-w-0 space-y-3 md:col-span-2">
                <h3 className="text-sm font-semibold">Carteiras de destino</h3>
                {chosen.map((wallet) => (
                  <div key={wallet.id} className="space-y-1">
                    <p className="text-xs font-medium">
                      {walletLabel[wallet.network]} ·{' '}
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
              <PriceRow label="Subtotal" value={eth(reviewed?.subtotalEth || '0')} />
              <PriceRow label="Desconto" value={'− ' + eth(reviewed?.discountEth || '0')} />
              <PriceRow label="Taxa de rede" value={eth(reviewed?.networkFeeEth || '0')} />
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-4">
                <dt className="font-semibold">Total da compra</dt>
                <dd className="break-all text-right text-xl font-bold text-accent">
                  {eth(reviewed?.totalEth || '0')}
                </dd>
              </div>
            </dl>
          </div>
          <footer className="space-y-4 border-t border-border bg-card px-5 py-4 md:px-7">
            <p className="text-xs leading-relaxed text-muted-foreground">
              As taxas e a disponibilidade serão validadas novamente. A autorização e o pagamento
              são simulados.
            </p>
            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <Button
                variant="outline"
                className="h-10 md:min-w-36"
                disabled={authorizing || createOrder.isPending}
                onClick={() => setReview(false)}
              >
                Voltar e revisar
              </Button>
              <Button
                variant="cta"
                className="h-10 md:min-w-44"
                disabled={authorizing || createOrder.isPending || !allReady}
                onClick={() => void confirm()}
              >
                {(authorizing || createOrder.isPending) && (
                  <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
                )}
                {authorizing || createOrder.isPending ? 'Confirmando…' : 'Confirmar compra'}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  const id = `checkout-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  const applyId = (child: ReactNode) =>
    isValidElement<{ id?: string; 'aria-describedby'?: string }>(child)
      ? cloneElement(child, { id, 'aria-describedby': error ? `${id}-error` : undefined })
      : child
  const child = Array.isArray(children) ? children.map(applyId) : applyId(children)
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm">
        {label}
      </label>
      {child && <div className="*:w-full">{child}</div>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
function OrderResult({
  order,
  feedback: _feedback,
  onRecover,
  busy,
}: {
  order: Order
  feedback: string
  onRecover: () => void
  busy: boolean
}) {
  const confirmed = order.status === 'confirmed'
  const declined = order.status === 'declined'

  if (confirmed) return <OrderConfirmation order={order} />

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded bg-card p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 rounded-full p-2 ${confirmed ? 'bg-accent/20 text-accent' : declined ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-accent'}`}
        >
          {confirmed ? (
            <Check />
          ) : declined ? (
            <AlertCircle />
          ) : (
            <LoaderCircle className="animate-spin" />
          )}
        </span>
        <div>
          <h1 className="font-mono text-xl font-bold">
            {confirmed
              ? 'Pedido confirmado'
              : declined
                ? 'Pagamento recusado'
                : 'Pedido em processamento'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {confirmed
              ? 'Sua compra foi confirmada pela simulação.'
              : declined
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
          <PriceRow key={wallet.id} label={`Carteira ${wallet.network}`} value={wallet.address} />
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
      {confirmed && (
        <Button asChild>
          <Link to="/cart">Continuar</Link>
        </Button>
      )}
    </section>
  )
}

function TemporaryWalletForm({
  network,
  value,
  onChange,
}: {
  network: WalletNetwork
  value?: WalletInput
  onChange: (value: WalletInput) => void
}) {
  const initial: WalletInput = value || {
    alias: 'Carteira desta compra',
    network,
    address: '',
    kind: 'extension',
    ensName: '',
    isPrimary: false,
  }
  const parsed = walletSchema.safeParse(initial)
  const addressError =
    initial.address && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[0] === 'address')?.message
      : undefined
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <p className="text-xs text-muted-foreground md:col-span-2">
        Informe uma carteira para esta compra. Ela não será salva no seu perfil.
      </p>
      <Field label={'Rede · ' + walletLabel[network]}>
        <Input value={walletLabel[network]} readOnly />
      </Field>
      <Field
        label={'Endereço da carteira · ' + walletLabel[network]}
        error={addressError || undefined}
      >
        <Input
          value={initial.address}
          onChange={(event) => onChange({ ...initial, address: event.target.value })}
          aria-invalid={!!addressError}
          placeholder={network === 'solana' ? 'Endereço Solana' : '0x…'}
          required
        />
      </Field>
      <Field label={'Tipo de carteira · ' + walletLabel[network]}>
        <Select
          value={initial.kind}
          onValueChange={(kind) => onChange({ ...initial, kind: kind as WalletInput['kind'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="extension">Extensão</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="custodial">Custodial</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {network !== 'solana' && (
        <Field
          label={'Nome ENS (opcional) · ' + walletLabel[network]}
          error={
            !parsed.success
              ? parsed.error.issues.find((issue) => issue.path[0] === 'ensName')?.message
              : undefined
          }
        >
          <Input
            value={initial.ensName || ''}
            onChange={(event) => onChange({ ...initial, ensName: event.target.value })}
          />
        </Field>
      )}
    </div>
  )
}
