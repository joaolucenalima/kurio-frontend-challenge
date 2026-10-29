import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  walletsApi,
  walletsKey,
  walletNetworks,
  walletKinds,
  type Wallet,
  type WalletInput,
} from '../index'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
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
  displayName: '',
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

function WalletForm({
  initial,
  onSave,
  saving,
}: {
  initial: WalletInput
  onSave: (value: WalletInput) => void
  saving: boolean
}) {
  const [value, setValue] = useState(initial)
  const formId = useId()

  return (
    <form
      className="grid grid-cols-1 gap-5 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(value)
      }}
    >
      {(
        [
          ['displayName', 'Nome de exibição'],
          ['alias', 'Apelido da carteira'],
          ['address', 'Endereço da carteira'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="space-y-2 text-sm">
          {label} *
          <Input
            required
            value={value[key]}
            onChange={(e) => setValue({ ...value, [key]: e.target.value })}
          />
        </label>
      ))}
      <label className="space-y-2 text-sm">
        Rede *
        <select
          className="h-10 w-full border border-border bg-background px-3"
          value={value.network}
          onChange={(e) =>
            setValue({ ...value, network: e.target.value as WalletInput['network'] })
          }
        >
          {walletNetworks.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        Tipo de carteira *
        <select
          className="h-10 w-full border border-border bg-background px-3"
          value={value.kind}
          onChange={(e) => setValue({ ...value, kind: e.target.value as WalletInput['kind'] })}
        >
          {walletKinds.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${formId}-ens`} className="space-y-2 text-sm">
        Nome ENS
        <Input
          id={`${formId}-ens`}
          value={value.ensName || ''}
          onChange={(e) => setValue({ ...value, ensName: e.target.value })}
        />
      </label>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={saving}>{saving ? 'Salvando…' : 'Salvar carteira'}</Button>
      </div>
    </form>
  )
}

export function WalletsSection({ userId }: { userId: string }) {
  const client = useQueryClient()
  const key = walletsKey(userId)

  const [editing, setEditing] = useState<Wallet | null>(null)
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState('')

  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => walletsApi.list(signal) })

  const refresh = () => client.invalidateQueries({ queryKey: key })

  const save = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) =>
      id ? walletsApi.update(id, input) : walletsApi.create(input),
    onSuccess: () => {
      void refresh()
      setAdding(false)
      setEditing(null)
      setFeedback('Carteira salva.')
    },
    onError: (e) => setFeedback(message(e)),
  })
  const remove = useMutation({
    mutationFn: walletsApi.remove,
    onSuccess: refresh,
    onError: (e) => setFeedback(message(e)),
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
    : { ...empty, isPrimary: true, displayName: '', alias: 'Carteira principal' }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <WalletForm
          key={main?.id || 'primary'}
          initial={primaryInput}
          saving={save.isPending}
          onSave={(input) => save.mutate({ id: main?.id, input: { ...input, isPrimary: true } })}
        />
      </section>
      <section className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[17px]">Carteira secundária</h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={!main}
              onClick={() => main && save.mutate({ input: { ...main, isPrimary: false } })}
            >
              Igual à carteira principal
            </Button>
            <Button onClick={() => setAdding(true)}>Adicionar</Button>
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
                <Button variant="outline" onClick={() => setEditing(w)}>
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={w.nftCount > 0}
                      title={w.nftCount ? 'Carteira com NFTs não pode ser apagada' : undefined}
                    >
                      Apagar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar carteira?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(w.id)}>
                        Apagar
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
          <DialogContent className="sm:max-w-2xl">
            <DialogTitle>
              {editing ? 'Editar carteira' : 'Adicionar carteira secundária'}
            </DialogTitle>
            <WalletForm
              key={editing?.id || 'new'}
              initial={editing ? { ...editing, isPrimary: false } : empty}
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
