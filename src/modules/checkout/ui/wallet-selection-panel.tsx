import { Plus } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { RadioGroup, RadioGroupItem } from '#/shared/components/ui/radio-group'
import { Input } from '#/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import type { Wallet, WalletInput, WalletNetwork } from '#/modules/wallets'
import { walletSchema } from '#/modules/wallets'
import type { WalletChoice } from '../model'
import { Field } from './form-primitives'

export function WalletSelectionPanel({
  networks,
  wallets,
  choices,
  labels,
  temporaryWallets,
  onChooseSaved,
  onChooseTemporary,
  onTemporaryChange,
  onAdd,
}: {
  networks: string[]
  wallets: Wallet[]
  choices: Record<string, WalletChoice>
  labels: Record<string, string>
  temporaryWallets: Record<string, WalletInput>
  onChooseSaved: (network: string, walletId: string) => void
  onChooseTemporary: (network: string) => void
  onTemporaryChange: (network: string, value: WalletInput) => void
  onAdd: () => void
}) {
  return (
    <section className="space-y-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[17px] font-bold">Carteiras cadastradas</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          Adicionar carteira
        </Button>
      </div>
      {networks.map((network) => {
        const options = wallets.filter((wallet) => wallet.network === network)
        return (
          <div key={network} className="border-t border-border pt-5">
            <fieldset aria-label={labels[network]} className="min-w-0 space-y-4">
              {options.length > 0 && (
                <RadioGroup
                  aria-label={'Carteiras de ' + labels[network]}
                  value={choices[network]?.kind === 'saved' ? choices[network].walletId : ''}
                  onValueChange={(value) => onChooseSaved(network, value)}
                >
                  {options.map((wallet) => (
                    <label
                      key={wallet.id}
                      htmlFor={'payment-wallet-' + wallet.id}
                      className="flex cursor-pointer items-center gap-2 border border-border p-3 text-sm has-data-[state=checked]:border-primary"
                    >
                      <RadioGroupItem id={'payment-wallet-' + wallet.id} value={wallet.id} />
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {wallet.alias}
                          {wallet.isPrimary ? ' · principal' : ''}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {labels[wallet.network]} ·{' '}
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
              <RadioGroup
                aria-label={'Usar outra carteira de ' + labels[network] + '?'}
                value={choices[network]?.kind === 'temporary' ? 'other' : ''}
                onValueChange={() => onChooseTemporary(network)}
              >
                <label
                  htmlFor={'use-other-wallet-' + network}
                  className="flex min-h-11 cursor-pointer items-center gap-2 py-2 text-sm"
                >
                  <RadioGroupItem id={'use-other-wallet-' + network} value="other" />
                  Usar outra carteira?
                </label>
              </RadioGroup>
              <h3 className="text-sm font-semibold">{labels[network]}</h3>
              {choices[network]?.kind === 'temporary' && (
                <TemporaryWalletForm
                  network={network as WalletNetwork}
                  labels={labels}
                  value={temporaryWallets[network]}
                  onChange={(value) => onTemporaryChange(network, value)}
                />
              )}
            </fieldset>
          </div>
        )
      })}
    </section>
  )
}

function TemporaryWalletForm({
  network,
  value,
  labels,
  onChange,
}: {
  network: WalletNetwork
  value?: WalletInput
  labels: Record<string, string>
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
    <div className="grid gap-5 pt-2 md:grid-cols-2">
      <p className="text-xs text-muted-foreground md:col-span-2">
        Informe uma carteira para esta compra. Ela não será salva no seu perfil.
      </p>
      <Field label={'Rede · ' + labels[network]}>
        <Input value={labels[network]} readOnly />
      </Field>
      <Field label={'Endereço da carteira · ' + labels[network]} error={addressError || undefined}>
        <Input
          value={initial.address}
          onChange={(event) => onChange({ ...initial, address: event.target.value })}
          aria-invalid={!!addressError}
          placeholder={network === 'solana' ? 'Endereço Solana' : '0x…'}
          required
        />
      </Field>
      <Field label={'Tipo de carteira · ' + labels[network]}>
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
          label={'Nome ENS (opcional) · ' + labels[network]}
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
