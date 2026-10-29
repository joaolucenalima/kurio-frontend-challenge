import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type PurchasePhase =
  | 'idle'
  | 'reviewing'
  | 'revalidating'
  | 'connecting'
  | 'submitting'
  | 'recovering'

export function usePurchaseFlow(identity: string) {
  const identityRef = useRef(identity)
  const lockRef = useRef<{ identity: string; locked: boolean }>({ identity, locked: false })
  const [phase, setPhaseState] = useState<PurchasePhase>('idle')

  useLayoutEffect(() => {
    identityRef.current = identity
    lockRef.current = { identity, locked: false }
    return () => {
      if (identityRef.current === identity) identityRef.current = ''
    }
  }, [identity])

  const start = useCallback(
    (next: Exclude<PurchasePhase, 'idle'>) => {
      if (identityRef.current !== identity || lockRef.current.locked) return false
      lockRef.current = { identity, locked: true }
      setPhaseState(next)
      return true
    },
    [identity],
  )

  const advance = useCallback(
    (next: Exclude<PurchasePhase, 'idle'>) => {
      if (
        identityRef.current === identity &&
        lockRef.current.identity === identity &&
        lockRef.current.locked
      )
        setPhaseState(next)
    },
    [identity],
  )

  const finish = useCallback(() => {
    if (identityRef.current !== identity || lockRef.current.identity !== identity) return
    lockRef.current.locked = false
    setPhaseState('idle')
  }, [identity])

  return { phase, busy: phase !== 'idle', start, advance, finish }
}
