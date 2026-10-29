import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Trash2 } from 'lucide-react'
import { TOKEN_KEY, type Session } from '#/modules/session/model'
import { type Wallet, type WalletInput } from '../model'
import { Button } from '#/shared/components/ui/button'
import { Checkbox } from '#/shared/components/ui/checkbox'
import { walletsApi, walletsKey } from '../api'
import { WalletForm } from './wallet-form'
import { Dialog, DialogContent, DialogTitle } from '#/shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/shared/components/ui/alert-dialog'

const empty: WalletInput = {
  alias: '',
  network: 'ethereum',
  address: '',
  ensName: '',
  kind: 'extension',
  isPrimary: false,
}

function message(error: unknown) {
  return isAxiosError(error)
    ? error.response?.data?.message || 'Não foi possível salvar.'
    : 'Não foi possível salvar.'
}

export function WalletsSection({ userId }: { userId: string }) {
  const copyCheckboxId = useId()
  const [copyPrimary, setCopyPrimary] = useState(false)
  const client = useQueryClient()
  const key = walletsKey(userId)
  const token = localStorage.getItem(TOKEN_KEY)
  const isCurrentSession = () =>
    client.getQueryData<Session | null>(['session'])?.user.id === userId &&
    localStorage.getItem(TOKEN_KEY) === token

  const [editing, setEditing] = useState<Wallet | null>(null)
  const [adding, setAdding] = useState(false)
  const [newWallet, setNewWallet] = useState<WalletInput>(empty)
  const [feedback, setFeedback] = useState('')

  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => walletsApi.list(signal) })

  const refresh = () =>
    isCurrentSession() ? client.invalidateQueries({ queryKey: key }) : Promise.resolve()

  const save = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) =>
      id ? walletsApi.update(id, input) : walletsApi.create(input),
    onSuccess: () => {
      if (!isCurrentSession()) return
      void refresh()
      setAdding(false)
      setEditing(null)
      setFeedback('Carteira salva.')
    },
    onError: (e) => {
      if (isCurrentSession()) setFeedback(message(e))
    },
  })
  const remove = useMutation({
    mutationFn: walletsApi.remove,
    onSuccess: refresh,
    onError: (e) => {
      if (isCurrentSession()) setFeedback(message(e))
    },
  })

  if (query.isPending) return <div aria-busy="true" className="h-44 animate-pulse bg-card" />

  if (query.isError)
    return (
      <div role="alert">
        Falha ao carregar carteiras.{' '}
        <Button variant="outline" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )

  const main = query.data.find((w) => w.isPrimary)
  const secondary = query.data.filter((w) => !w.isPrimary)

  const primaryInput: WalletInput = main
    ? { ...main }
    : { ...empty, isPrimary: true, alias: 'Carteira principal' }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <WalletForm
          key={main?.id || 'primary'}
          initial={primaryInput}
          otherWallets={secondary}
          locked={!!main?.nftCount}
          saving={save.isPending}
          onSave={(input) => save.mutate({ id: main?.id, input: { ...input, isPrimary: true } })}
        />
      </section>
      <section className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[17px]">Carteira secundária</h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex min-h-9 items-center gap-2">
              <Checkbox
                id={copyCheckboxId}
                checked={copyPrimary}
                disabled={!main || save.isPending}
                onCheckedChange={(checked) => setCopyPrimary(checked === true)}
              />
              <label htmlFor={copyCheckboxId} className="cursor-pointer text-sm text-foreground">
                Igual à carteira principal
              </label>
            </div>
            <Button
              variant="link"
              className="px-0 text-base text-accent"
              onClick={() => {
                setNewWallet(
                  copyPrimary && main
                    ? {
                        alias: main.alias,
                        network: main.network,
                        address: main.address,
                        ensName: main.ensName,
                        kind: main.kind,
                        isPrimary: false,
                      }
                    : { ...empty },
                )
                setAdding(true)
              }}
            >
              Adicionar
            </Button>
          </div>
        </header>
        {secondary.length ? (
          secondary.map((w) => (
            <article
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border p-4"
            >
              <div>
                <strong>{w.alias}</strong>
                <p className="break-all text-sm text-muted-foreground">
                  {w.network} · {w.address} · {w.nftCount} NFTs
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  aria-label={`Editar carteira ${w.alias}`}
                  title="Editar carteira"
                  onClick={() => setEditing(w)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      aria-label={`Apagar carteira ${w.alias}`}
                      disabled={w.nftCount > 0 || remove.isPending}
                      title={
                        w.nftCount ? 'Carteira com NFTs não pode ser apagada' : 'Apagar carteira'
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar carteira?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseja apagar a carteira “{w.alias}”? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={remove.isPending || w.nftCount > 0}
                        onClick={() => {
                          if (!remove.isPending && w.nftCount === 0) remove.mutate(w.id)
                        }}
                      >
                        Confirmar exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Você ainda não adicionou uma carteira secundária.
          </p>
        )}
      </section>
      {feedback && (
        <output className="block" aria-live="polite">
          {feedback}
        </output>
      )}
      {[adding, !!editing].some(Boolean) && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setAdding(false)
              setEditing(null)
            }
          }}
        >
          <DialogContent className="space-y-6 sm:w-[min(95vw,672px)]">
            <DialogTitle>
              {editing ? 'Editar carteira' : 'Adicionar carteira secundária'}
            </DialogTitle>
            <WalletForm
              key={editing?.id || 'new'}
              initial={editing ? { ...editing, isPrimary: false } : newWallet}
              otherWallets={query.data.filter((wallet) => wallet.id !== editing?.id)}
              locked={!!editing?.nftCount}
              saving={save.isPending}
              onSave={(input) =>
                save.mutate({
                  id: editing?.id,
                  input: {
                    ...input,
                    isPrimary: false,
                    ...(editing?.nftCount
                      ? { network: editing.network, address: editing.address }
                      : {}),
                  },
                })
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
