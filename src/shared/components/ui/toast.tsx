import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from 'radix-ui'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { skipToken, useQuery } from '@tanstack/react-query'

type Notice = {
  id?: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'warning' | 'info'
}
type Entry = Notice & { key: string }
const Context = createContext<{ notify: (notice: Notice) => void; clear: () => void } | null>(null)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Entry[]>([])
  const session = useQuery<{ user?: { id: string } } | null>({
    queryKey: ['session'],
    queryFn: skipToken,
  })
  const clear = useCallback(() => setItems([]), [])
  const identity = session.data?.user?.id
  useEffect(() => {
    const timer = window.setTimeout(clear, 0)
    return () => window.clearTimeout(timer)
  }, [identity, clear])
  const notify = useCallback((notice: Notice) => {
    const key = notice.id || notice.title
    setItems((current) =>
      [...current.filter((item) => item.key !== key), { ...notice, key }].slice(-3),
    )
  }, [])
  return (
    <Context.Provider value={{ notify, clear }}>
      <Toast.Provider label="Notifica??o" swipeDirection="right">
        {children}
        {items.map((item) => {
          const Icon =
            item.variant === 'success' ? CheckCircle : item.variant === 'info' ? Info : AlertCircle
          return (
            <Toast.Root
              key={item.key}
              duration={item.variant === 'error' || item.variant === 'warning' ? 8000 : 5000}
              onOpenChange={(open) => {
                if (!open) setItems((current) => current.filter((value) => value.key !== item.key))
              }}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm text-foreground shadow-xl motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-right-4"
            >
              <Icon
                aria-hidden="true"
                className={`size-5 shrink-0 ${item.variant === 'error' ? 'text-destructive' : 'text-accent'}`}
              />
              <div className="min-w-0 flex-1 break-words">
                <Toast.Title className="font-bold">{item.title}</Toast.Title>
                {item.description && (
                  <Toast.Description className="mt-1 text-muted-foreground">
                    {item.description}
                  </Toast.Description>
                )}
              </div>
              <Toast.Close
                aria-label="Fechar notifica??o"
                className="shrink-0 rounded-sm text-muted-foreground hover:text-accent"
              >
                <X aria-hidden="true" className="size-5" />
              </Toast.Close>
            </Toast.Root>
          )
        })}
        <Toast.Viewport
          label="Notifica??es ({hotkey})"
          className="pointer-events-none fixed top-[max(1rem,env(safe-area-inset-top))] right-4 left-4 z-[100] flex max-h-[85vh] list-none flex-col gap-3 outline-none md:left-auto md:w-96"
        />
      </Toast.Provider>
    </Context.Provider>
  )
}
export function useToast() {
  const context = useContext(Context)
  if (!context) throw new Error('ToastProvider ausente')
  return context
}
export function useToastFeedback(variant: Notice['variant'] = 'error') {
  const { notify } = useToast()
  return useCallback(
    (title: string) => {
      if (!title || title === 'Atualizando carrinho?') return
      const success = /atualizad[oa]|salv[oa]|confirmado com sucesso/.test(title)
      notify({ title, variant: success ? 'success' : variant })
    },
    [notify, variant],
  )
}
