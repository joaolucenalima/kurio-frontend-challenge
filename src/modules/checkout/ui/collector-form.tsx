import type { ChangeEvent, ReactNode } from 'react'
import type { UseFormRegisterReturn, UseFormReturn } from 'react-hook-form'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import type { CheckoutInput } from '../model'
import { Field } from './form-primitives'

type DraftRegistration = Omit<UseFormRegisterReturn<keyof CheckoutInput>, 'onChange'> & {
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function CollectorForm({
  form,
  registerDraft,
  username,
  noteLength,
  children,
}: {
  form: UseFormReturn<CheckoutInput>
  registerDraft: (name: keyof CheckoutInput) => DraftRegistration
  username: string
  noteLength: number
  children: ReactNode
}) {
  return (
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
          <Input value={username} readOnly className="text-muted-foreground" />
        </Field>
        {children}
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
          <span className="text-right text-xs text-muted-foreground">{noteLength}/500</span>
        </Field>
      </div>
    </section>
  )
}
