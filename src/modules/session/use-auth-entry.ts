import { authRedirect } from './auth-redirect'
import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'

export type AuthMode = 'login' | 'signup'

export function useAuthEntry(openModal: (mode: AuthMode) => void, redirect?: string) {
  const location = useLocation()
  const navigate = useNavigate()

  const modalRef = useRef(openModal)
  useEffect(() => {
    modalRef.current = openModal
  }, [openModal])

  return useCallback(
    (mode: AuthMode = 'login') => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        const destination =
          redirect ??
          `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ''}`
        const safeRedirect = authRedirect(destination)
        void navigate({
          to: mode === 'signup' ? '/signup' : '/login',
          search: { redirect: safeRedirect },
        })
        return
      }
      modalRef.current(mode)
    },
    [location.pathname, location.searchStr, location.hash, navigate, redirect],
  )
}
