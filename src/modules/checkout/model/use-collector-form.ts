import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { checkoutSchema, type CheckoutInput } from '../model'
import { checkoutStorage } from './storage'

const draftStorageKey = (userId: string) => `kurio.checkout.draft.${userId}`

export function useCollectorForm(userId?: string, profileEmail?: string) {
  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { email: '', note: '' },
  })
  const noteLength = (useWatch({ control: form.control, name: 'note' }) || '').length
  const initialized = useRef(false)

  useEffect(() => {
    if (!userId || !profileEmail || initialized.current) return
    initialized.current = true
    const draft = checkoutStorage.readDraft(draftStorageKey(userId))
    form.reset(draft || { email: profileEmail, note: '' })
  }, [form, profileEmail, userId])

  const registerDraft = (name: keyof CheckoutInput) => {
    const field = form.register(name)
    return {
      ...field,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        void field.onChange(event)
        if (userId)
          checkoutStorage.writeDraft(draftStorageKey(userId), {
            ...form.getValues(),
            [name]: event.target.value,
          })
      },
    }
  }

  return { form, noteLength, registerDraft }
}
