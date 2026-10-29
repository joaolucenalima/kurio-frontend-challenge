import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { sessionApi } from './api'
import { SessionPage } from './page'
import { useAuthEntry } from './use-auth-entry'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { Button } from '#/shared/components/ui/button'

export function RequireSession({ children }: { children: ReactNode }) {
  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const openAuth = useAuthEntry(() => setOpen(true))
  const needsLogin = session.isSuccess && !session.data

  useEffect(() => {
    if (needsLogin) openAuth()
  }, [needsLogin, openAuth])

  if (session.data) return children
  if (session.isError)
    return (
      <main className="p-6" role="alert">
        <p>Não foi possível verificar sua sessão.</p>
        <Button className="mt-4" onClick={() => void session.refetch()}>
          Tentar novamente
        </Button>
      </main>
    )

  return (
    <>
      <main
        className="mx-auto max-w-page px-6 py-8"
        aria-busy="true"
        aria-label="Carregando página privada"
      >
        <output className="sr-only">Aguardando autenticação para carregar a página.</output>
        <div aria-hidden="true" className="space-y-8">
          <div className="h-10 w-1/3 rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]" />
          <div className="grid gap-6 md:grid-cols-[19.5rem_minmax(0,1fr)]">
            <div className="h-80 rounded-xl bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]" />
            <div className="h-96 rounded-xl bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]" />
          </div>
        </div>
      </main>
      <Dialog
        open={open && needsLogin}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value && needsLogin)
            void navigate({ to: '/', search: { ranking: 'all', sort: 'recently-listed', page: 1 } })
        }}
      >
        <DialogContent>
          <DialogTitle className="sr-only">Acessar conta</DialogTitle>
          <DialogDescription className="sr-only">
            Entre para acessar esta página privada.
          </DialogDescription>
          <SessionPage onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
