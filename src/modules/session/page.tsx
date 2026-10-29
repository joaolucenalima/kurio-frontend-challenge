import { useToastFeedback } from '#/shared/components/ui/toast'
import { authRedirect } from './auth-redirect'
import { useAuthEntry } from './use-auth-entry'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Button } from '#/shared/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { sessionApi } from './api'
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from './model'
import { Input } from '#/shared/components/ui/input'

export function SessionPage({
  redirect,
  onSuccess,
  initialMode = 'login',
  presentation = 'modal',
}: {
  redirect?: string
  onSuccess?: () => void
  initialMode?: 'login' | 'signup'
  presentation?: 'modal' | 'page'
}) {
  const isPage = presentation === 'page'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const openAuth = useAuthEntry(setMode, redirect)
  const setServerError = useToastFeedback()
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    confirmPassword: false,
  })

  const login = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signup = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: LoginInput | SignupInput) =>
      mode === 'login'
        ? sessionApi.login(data as LoginInput)
        : sessionApi.signup(data as SignupInput),
    onSuccess: async (session) => {
      await queryClient.cancelQueries()
      queryClient.clear()
      queryClient.setQueryData(['session'], session)
      if (isPage) {
        await navigate({ href: authRedirect(redirect), replace: true })
      } else {
        onSuccess?.()
      }
    },
    onError: (error) => {
      const data = isAxiosError(error)
        ? (error.response?.data as { message?: string; field?: string })
        : undefined
      if (data?.field && mode === 'signup' && data.field in signup.getValues())
        signup.setError(data.field as keyof SignupInput, { message: data.message })
      else setServerError(data?.message || 'Não foi possível concluir. Tente novamente.')
    },
  })

  const form = mode === 'login' ? login : signup
  const field = (
    name: 'email' | 'password' | 'username' | 'confirmPassword',
    label: string,
    type = 'text',
  ) => {
    const isPassword = name === 'password' || name === 'confirmPassword'
    const visible = isPassword && visiblePasswords[name]
    const active = mode === 'login' ? login : signup
    const registration =
      mode === 'login'
        ? login.register(name as keyof LoginInput)
        : signup.register(name as keyof SignupInput)
    const message = active.formState.errors[name as keyof typeof active.formState.errors]?.message

    return (
      <div key={name}>
        <label htmlFor={name} className="sr-only">
          {label}
        </label>
        <div className="relative">
          <Input
            id={name}
            type={isPassword ? (visible ? 'text' : 'password') : type}
            autoComplete={
              name === 'confirmPassword'
                ? 'new-password'
                : name === 'password'
                  ? mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                  : name
            }
            aria-invalid={!!message}
            aria-describedby={message ? `${name}-error` : undefined}
            placeholder={
              name === 'username'
                ? 'Nome de usuário'
                : name === 'email'
                  ? mode === 'login'
                    ? 'contato@email.com'
                    : 'Digite seu e-mail'
                  : name === 'confirmPassword'
                    ? 'Confirmar senha'
                    : 'Senha'
            }
            className={`${isPage ? 'h-12.5 rounded-[10px]' : ''} ${isPassword ? 'pr-12' : ''}`}
            {...registration}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
              aria-pressed={visible}
              onClick={() =>
                setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))
              }
              className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-subtle transition-colors hover:text-accent focus-visible:text-accent"
            >
              {visible ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        <p
          id={`${name}-error`}
          className="text-xs text-destructive not-empty:mt-2"
          role={message ? 'alert' : undefined}
        >
          {String(message || '')}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full font-mono">
      <section className="w-full">
        {isPage ? (
          <h1
            className={`text-center leading-6 font-bold ${mode === 'login' ? 'text-xl' : 'text-lg'}`}
          >
            {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
          </h1>
        ) : (
          <>
            <nav
              className="flex justify-center gap-3 pt-12 text-xl leading-4 font-medium"
              aria-label="Conta"
            >
              <button
                type="button"
                onClick={() => {
                  openAuth('login')
                  setServerError('')
                }}
                className={`cursor-pointer px-2 transition-colors hover:text-accent ${mode === 'login' ? 'text-accent' : 'text-foreground'}`}
              >
                Entrar
              </button>
              <span className="h-4 w-px bg-destructive" aria-hidden="true" />
              <button
                type="button"
                onClick={() => {
                  openAuth('signup')
                  setServerError('')
                }}
                className={`cursor-pointer px-2 transition-colors hover:text-accent ${mode === 'signup' ? 'text-accent' : 'text-foreground'}`}
              >
                Criar conta
              </button>
            </nav>
            <p className="mx-6 mt-10 min-h-8 text-[13px] leading-4 text-center text-foreground">
              {mode === 'login'
                ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
                : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
            </p>
          </>
        )}
        <form
          onSubmit={form.handleSubmit((values) => {
            setServerError('')
            mutation.mutate(values)
          })}
          noValidate
          className={
            isPage
              ? 'mt-10 w-full space-y-3'
              : 'mx-auto mt-6 w-[calc(100%-32px)] max-w-85 space-y-3'
          }
        >
          {mode === 'signup' && field('username', 'Nome de usuário')}
          {field('email', 'E-mail', 'email')}
          {field('password', 'Senha', 'password')}
          {mode === 'signup' && field('confirmPassword', 'Confirmar senha', 'password')}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setServerError('Recuperação de senha indisponível nesta etapa.')}
              className="block w-full cursor-pointer text-right text-sm text-accent underline-offset-2 hover:text-primary hover:underline"
            >
              Esqueceu a senha?
            </button>
          )}

          <Button
            disabled={mutation.isPending}
            type="submit"
            variant="cta"
            className={`${isPage ? 'mt-10 h-15 rounded-[10px]' : 'mt-6 h-11.25 rounded-[5px]'} w-full cursor-pointer bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {mutation.isPending
              ? 'Aguarde…'
              : mode === 'login'
                ? 'Entrar'
                : isPage
                  ? 'Criar perfil'
                  : 'Criar conta'}
          </Button>
        </form>
        <div className={`${isPage ? 'mt-10' : 'mt-6'} flex items-center gap-3 text-[13px]`}>
          <span className="h-px flex-1 bg-border" />
          <span>Ou continue com</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div
          className={
            isPage
              ? 'mt-3 grid w-full gap-4'
              : 'mx-auto mt-3 grid w-[calc(100%-32px)] max-w-85 gap-3 pb-8 md:pb-24.25'
          }
        >
          <Button
            disabled
            type="button"
            variant="outline"
            className="h-10 rounded-[5px] border-border bg-transparent text-[13px] text-muted-foreground shadow-none disabled:opacity-70"
          >
            <span className="flex items-center justify-center gap-3">
              <img src="/images/google.png" alt="" className="size-5" />
              Continuar com Google
            </span>
          </Button>
          <Button
            disabled
            type="button"
            variant="outline"
            className="h-10 rounded-[5px] border-border bg-transparent text-[13px] text-muted-foreground shadow-none disabled:opacity-70"
          >
            <span className="flex items-center justify-center gap-3">
              <img src="/images/facebook.png" alt="" className="size-5" />
              Continuar com Facebook
            </span>
          </Button>
        </div>
      </section>
    </div>
  )
}
