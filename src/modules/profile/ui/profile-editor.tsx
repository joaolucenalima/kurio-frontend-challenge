import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { isAxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { profileApi, profileKey } from '../api/profile-api'
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChange,
  type ProfileInput,
} from '../model/contracts'
import type { Session } from '#/modules/session/model'
import { TOKEN_KEY } from '#/modules/session/model'

function errorMessage(error: unknown) {
  return isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Não foi possível salvar. Tente novamente.'
}

function Skeleton() {
  return (
    <div aria-label="Carregando dados do perfil" className="space-y-8" aria-busy="true">
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-32 animate-[shimmer_1.6s_linear_infinite] bg-size-[200%_100%] bg-linear-to-r from-card via-border to-card motion-reduce:animate-none" />
            <div className="h-10 w-full animate-[shimmer_1.6s_linear_infinite] bg-size-[200%_100%] bg-linear-to-r from-card via-border to-card motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-[15px] leading-5">
        {label}
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function ProfileEditor({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  const [feedback, setFeedback] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

  const profileQuery = useQuery({
    queryKey: profileKey(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
  })

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', username: '', email: '', ensName: '', walletAlias: '' },
  })

  useEffect(() => {
    if (profileQuery.data && !profileForm.formState.isDirty) profileForm.reset(profileQuery.data)
  }, [profileForm, profileQuery.data])

  const passwordForm = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const updateProfile = useMutation({
    mutationFn: (values: ProfileInput) => profileApi.update(values),
    onSuccess: (profile) => {
      const session = queryClient.getQueryData<Session | null>(['session'])
      if (
        !session ||
        session.user.id !== userId ||
        session.token !== localStorage.getItem(TOKEN_KEY)
      )
        return
      queryClient.setQueryData(profileKey(userId), profile)
      queryClient.setQueryData<Session | null>(['session'], (session) =>
        session
          ? {
              ...session,
              user: { ...session.user, username: profile.username, email: profile.email },
            }
          : session,
      )
      profileForm.reset(profile)
      setFeedback('Perfil atualizado.')
    },
    onError: (error) => {
      if (queryClient.getQueryData<Session | null>(['session'])?.user.id === userId)
        setFeedback(errorMessage(error))
    },
  })

  const updatePassword = useMutation({
    mutationFn: (values: PasswordChange) => profileApi.changePassword(values),
    onSuccess: () => {
      if (
        localStorage.getItem(TOKEN_KEY) !==
        queryClient.getQueryData<Session | null>(['session'])?.token
      )
        return
      passwordForm.reset()
      setPasswordFeedback('Senha atualizada.')
    },
    onError: (error) => {
      if (queryClient.getQueryData<Session | null>(['session'])?.user.id === userId)
        setPasswordFeedback(errorMessage(error))
    },
  })

  if (profileQuery.isPending) return <Skeleton />
  if (profileQuery.isError)
    return (
      <div role="alert" className="space-y-3 text-sm text-destructive">
        <p>Não foi possível carregar os dados do perfil.</p>
        <Button type="button" variant="outline" onClick={() => void profileQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )

  const profileError = profileForm.formState.errors
  const passwordError = passwordForm.formState.errors

  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-9 md:grid-cols-2">
      <form
        noValidate
        onSubmit={profileForm.handleSubmit((values) => {
          setFeedback('')
          updateProfile.mutate(values)
        })}
        className="space-y-7 md:col-span-2"
      >
        <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
          <Field
            id="displayName"
            label="Nome de exibição"
            error={profileError.displayName?.message}
          >
            <Input
              id="displayName"
              autoComplete="name"
              aria-invalid={!!profileError.displayName}
              aria-describedby={profileError.displayName ? 'displayName-error' : undefined}
              {...profileForm.register('displayName')}
            />
          </Field>
          <Field id="username" label="Nome de usuário" error={profileError.username?.message}>
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={!!profileError.username}
              aria-describedby={profileError.username ? 'username-error' : undefined}
              {...profileForm.register('username')}
            />
          </Field>
          <Field id="email" label="E-mail" error={profileError.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!profileError.email}
              aria-describedby={profileError.email ? 'email-error' : undefined}
              {...profileForm.register('email')}
            />
          </Field>
          <Field id="ensName" label="Nome ENS" error={profileError.ensName?.message}>
            <div className="flex h-10 overflow-hidden rounded-sm border border-border focus-within:ring-2 focus-within:ring-ring">
              <Input
                id="ensName"
                aria-invalid={!!profileError.ensName}
                aria-describedby={profileError.ensName ? 'ensName-error' : undefined}
                className="h-full min-w-0 rounded-none border-0"
                {...profileForm.register('ensName')}
              />
              <span className="flex h-full items-center border-l border-border px-3 text-sm text-muted-foreground">
                .eth
              </span>
            </div>
          </Field>
          <Field
            id="walletAlias"
            label="Apelido da carteira"
            error={profileError.walletAlias?.message}
          >
            <Input
              id="walletAlias"
              aria-invalid={!!profileError.walletAlias}
              aria-describedby={profileError.walletAlias ? 'walletAlias-error' : undefined}
              {...profileForm.register('walletAlias')}
            />
          </Field>
        </div>
        <div className="flex flex-col items-end gap-3">
          {feedback && (
            <p aria-live="polite" className="min-h-5 w-full text-sm text-muted-foreground">
              {feedback}
            </p>
          )}
          <Button type="submit" disabled={updateProfile.isPending} className="min-h-10 min-w-32">
            {updateProfile.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="mb-6 text-base font-medium">
          Alterar senha
        </h2>
        <form
          noValidate
          onSubmit={passwordForm.handleSubmit((values) => {
            setPasswordFeedback('')
            updatePassword.mutate(values)
          })}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-x-7 gap-y-6 sm:grid-cols-2">
            {(
              [
                ['currentPassword', 'Senha atual', 'current-password'],
                ['newPassword', 'Nova senha', 'new-password'],
                ['confirmPassword', 'Confirmar nova senha', 'new-password'],
              ] as const
            ).map(([name, label, autoComplete]) => {
              const error = passwordError[name]?.message
              return (
                <Field key={name} id={name} label={label} error={error}>
                  <div className="relative">
                    <Input
                      id={name}
                      type={showPasswords[name] ? 'text' : 'password'}
                      autoComplete={autoComplete}
                      className="pr-11"
                      aria-invalid={!!error}
                      aria-describedby={error ? `${name}-error` : undefined}
                      {...passwordForm.register(name)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-subtle hover:text-accent focus-visible:text-accent"
                      aria-label={`${showPasswords[name] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
                      aria-pressed={showPasswords[name]}
                      onClick={() =>
                        setShowPasswords((shown) => ({ ...shown, [name]: !shown[name] }))
                      }
                    >
                      {showPasswords[name] ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </Field>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {passwordFeedback && (
              <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
                {passwordFeedback}
              </p>
            )}
            <Button
              type="submit"
              disabled={updatePassword.isPending}
              className="min-h-10 min-w-32 self-start"
            >
              {updatePassword.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
