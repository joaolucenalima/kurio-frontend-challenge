import { useToastFeedback } from '#/shared/components/ui/toast'
import { useAuthEntry } from '#/modules/session/use-auth-entry'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { SessionPage } from '#/modules/session/page'
import { sessionApi } from '#/modules/session/api'
import type { Nft } from '#/modules/catalog'
import { favoritesApi, favoritesKey } from './index'
import { cn } from '#/shared/lib/utils'

export function FavoriteButton({
  nft,
  className,
  showLabel = false,
}: {
  nft: Nft
  className?: string
  showLabel?: boolean
}) {
  const queryClient = useQueryClient()

  const [loginOpen, setLoginOpen] = useState(false)
  const openAuth = useAuthEntry(() => setLoginOpen(true))
  const setError = useToastFeedback()

  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  const userId = session.data?.user.id
  const key = favoritesKey(userId || '')

  const favorites = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: !!userId,
  })
  const selected = favorites.data?.some((item) => item.id === nft.id) ?? false

  const mutation = useMutation({
    mutationFn: (wasSelected: boolean) =>
      wasSelected ? favoritesApi.remove(nft.id) : favoritesApi.add(nft.id),
    onMutate: async (wasSelected) => {
      setError('')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Nft[]>(key)
      queryClient.setQueryData<Nft[]>(key, (current) =>
        wasSelected ? current?.filter((item) => item.id !== nft.id) : [...(current || []), nft],
      )
      return { previous }
    },
    onError: (_error, _selected, context) => {
      queryClient.setQueryData(key, context?.previous)
      setError('Não foi possível atualizar os favoritos. Tente novamente.')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={showLabel ? 'default' : 'icon-lg'}
        className={cn('border-primary text-accent', className)}
        aria-label={selected ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        aria-pressed={selected}
        disabled={mutation.isPending || (!!userId && favorites.isPending)}
        onClick={() => (userId ? mutation.mutate(selected) : openAuth())}
      >
        <Heart className={selected ? 'fill-accent' : ''} aria-hidden="true" />
        {showLabel && (selected ? 'Favoritado' : 'Favoritar')}
      </Button>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Acessar conta</DialogTitle>
          <DialogDescription className="sr-only">Entre para salvar favoritos.</DialogDescription>
          <SessionPage onSuccess={() => setLoginOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
