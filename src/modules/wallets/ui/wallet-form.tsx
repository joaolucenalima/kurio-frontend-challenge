import { useEffect, useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { walletConflicts, walletSchema, type WalletInput } from '../model'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'

const networks = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
  robinhood: 'Robinhood',
}
const kinds = { extension: 'Extensão', hardware: 'Hardware', custodial: 'Custodial' }
const fields = [
  ['alias', 'Apelido da carteira'],
  ['network', 'Rede'],
  ['address', 'Endereço da carteira'],
  ['kind', 'Tipo de carteira'],
  ['ensName', 'Nome ENS'],
] as const

export function WalletForm({
  initial,
  onSave,
  saving,
  locked = false,
  otherWallets = [],
}: {
  initial: WalletInput
  onSave: (value: WalletInput) => void
  saving: boolean
  locked?: boolean
  otherWallets?: WalletInput[]
}) {
  const id = useId()
  const form = useForm<WalletInput>({ resolver: zodResolver(walletSchema), defaultValues: initial })
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(initial)
  }, [initial, form])
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const conflicts = walletConflicts(values, otherWallets)
        if (conflicts.length) {
          conflicts.forEach(({ field, message }, index) =>
            form.setError(field, { type: 'validate', message }, { shouldFocus: index === 0 }),
          )
          return
        }
        onSave(values)
      })}
      className="space-y-7"
    >
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        {fields.map(([name, label]) => {
          const error = form.formState.errors[name]?.message
          const fieldId = `${id}-${name}`
          const options = name === 'network' ? networks : name === 'kind' ? kinds : null
          return (
            <div key={name} className="min-w-0 space-y-2">
              <label htmlFor={fieldId} className="block text-[15px] leading-5">
                {label}
                {name !== 'ensName' && (
                  <span className="ml-1 text-destructive" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              {options ? (
                <Controller
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={saving || (locked && name === 'network')}
                    >
                      <SelectTrigger
                        ref={field.ref}
                        onBlur={field.onBlur}
                        id={fieldId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${fieldId}-error` : undefined}
                        className="w-full rounded-sm border-border shadow-none data-[size=default]:h-10"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(options).map(([value, title]) => (
                          <SelectItem key={value} value={value}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : name === 'ensName' ? (
                <div className="flex h-10 overflow-hidden rounded-sm border border-border focus-within:ring-2 focus-within:ring-ring">
                  <Controller
                    control={form.control}
                    name="ensName"
                    render={({ field }) => (
                      <Input
                        id={fieldId}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        value={(field.value || '').replace(/\.eth$/, '')}
                        onChange={(event) => {
                          const name = event.target.value.replace(/\.eth$/, '')
                          field.onChange(name ? `${name}.eth` : '')
                        }}
                        disabled={saving}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${fieldId}-error` : undefined}
                        className="h-full min-w-0 rounded-none border-0"
                      />
                    )}
                  />
                  <span className="flex h-full items-center border-l border-border px-3 text-sm text-muted-foreground">
                    .eth
                  </span>
                </div>
              ) : (
                <Input
                  id={fieldId}
                  {...form.register(name)}
                  readOnly={locked && name === 'address'}
                  disabled={saving}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                />
              )}
              {error && (
                <p id={`${fieldId}-error`} role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {locked && (
        <p className="text-sm text-muted-foreground">
          Esta carteira possui NFTs. A rede e o endereço não podem ser alterados.
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" className="min-h-10" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}
