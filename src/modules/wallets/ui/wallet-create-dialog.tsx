import { useToastFeedback } from '#/shared/components/ui/toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletsApi, walletsKey } from '../api'
import type { Wallet, WalletInput, WalletNetwork } from '../model'
import { WalletForm } from './wallet-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'

const empty: WalletInput = {
  alias: '',
  network: 'ethereum',
  address: '',
  ensName: '',
  kind: 'extension',
  isPrimary: false,
}

export function WalletCreateDialog({
  userId,
  open,
  onOpenChange,
  onCreated,
  initialNetwork = 'ethereum',
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (wallet: Wallet) => void
  initialNetwork?: WalletNetwork
}) {
  const feedback = useToastFeedback()
  const client = useQueryClient()
  const key = walletsKey(userId)
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => walletsApi.list(signal),
    enabled: open,
  })
  const save = useMutation({
    onError: () =>
      feedback('N?o foi poss?vel salvar a carteira. Revise os dados e tente novamente.'),
    mutationFn: (input: WalletInput) => walletsApi.create(input),
    onSuccess: async (wallet) => {
      await client.invalidateQueries({ queryKey: key })
      feedback('Carteira salva.')
      onCreated(wallet)
      onOpenChange(false)
    },
  })
  const wallets = query.data || []
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-5 sm:w-[min(95vw,672px)]">
        <DialogTitle>Adicionar carteira</DialogTitle>
        <DialogDescription>
          Cadastre uma carteira para a rede dos NFTs do seu pedido.
        </DialogDescription>
        {query.isError ? (
          <div role="alert" className="space-y-3 text-sm">
            Não foi possível carregar as carteiras.{' '}
            <button type="button" className="underline" onClick={() => void query.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <WalletForm
            key={`${wallets.length}-${initialNetwork}-${open}`}
            initial={{
              ...empty,
              network: initialNetwork,
              isPrimary: wallets.length === 0,
              alias: wallets.length === 0 ? 'Carteira principal' : '',
            }}
            otherWallets={wallets as Wallet[]}
            saving={save.isPending || query.isPending}
            onSave={(input) => save.mutate({ ...input, isPrimary: wallets.length === 0 })}
          />
        )}
        {save.isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível salvar a carteira. Revise os dados e tente novamente.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
