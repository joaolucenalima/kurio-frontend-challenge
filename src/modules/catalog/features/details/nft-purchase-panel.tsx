import type { Dispatch, SetStateAction } from 'react'
import { Minus, Plus } from 'lucide-react'
import { FavoriteButton } from '#/modules/favorites'
import { Button } from '#/shared/components/ui/button'
import type { Nft, NftEdition } from '../../model/contracts'
import { ReviewSummary } from '../../ui/review-summary'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { sessionApi } from '#/modules/session/api'
import { SessionPage } from '#/modules/session/page'
import { cartApi } from '#/modules/cart/api'
import { cartKey } from '#/modules/cart/model'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'

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
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [loginOpen, setLoginOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })

  const add = useMutation({
    mutationFn: cartApi.add,
    onSuccess: async () => {
      const userId = queryClient.getQueryData<Awaited<ReturnType<typeof sessionApi.current>>>([
        'session',
      ])?.user.id
      if (userId) await queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      await navigate({ to: '/cart' })
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        queryClient.setQueryData(['session'], null)
        setLoginOpen(true)
      } else
        setNotice(
          isAxiosError(error)
            ? (error.response?.data as { message?: string })?.message ||
                'Não foi possível adicionar.'
            : 'Não foi possível adicionar.',
        )
    },
  })

  const buy = () => {
    if (!edition || quantity < 1) return
    if (!session.data) {
      setLoginOpen(true)
      return
    }
    add.mutate({ nftId: nft.id, editionId: edition.id, quantity })
  }

  const authDialog = (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent>
        <DialogTitle className="sr-only">Acessar conta</DialogTitle>
        <DialogDescription className="sr-only">
          Entre para adicionar este NFT ao carrinho.
        </DialogDescription>
        <SessionPage
          onSuccess={() => {
            setLoginOpen(false)
            if (edition) add.mutate({ nftId: nft.id, editionId: edition.id, quantity })
          }}
        />
      </DialogContent>
    </Dialog>
  )

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
            disabled={!edition || add.isPending}
            onClick={buy}
            className="h-10 w-32"
          >
            {add.isPending ? 'Adicionando…' : 'COMPRAR'}
          </Button>
          <FavoriteButton nft={nft} showLabel className="h-10 w-36" />
        </div>
      </div>
      <output className="mt-2 block text-sm text-destructive">{notice}</output>
      {authDialog}
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
            disabled={!edition || add.isPending}
            onClick={buy}
            className="h-12 flex-1 rounded-full"
          >
            {add.isPending ? 'Adicionando…' : 'Comprar NFT'}
          </Button>
          <FavoriteButton nft={nft} className="size-12 rounded-full" />
        </div>
        <output className="mx-auto mt-2 block max-w-page text-sm text-destructive">{notice}</output>
        {authDialog}
      </div>
    </>
  )
}
