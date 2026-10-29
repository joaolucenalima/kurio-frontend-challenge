import { realtimeHandlers, changeNft, disconnectSockets, publish } from './realtime'
import { resetNftState } from './fixtures'
import { resumeOrders } from './checkout'
import { setupWorker } from 'msw/browser'
import { httpClient } from '#/shared/api/http'
import { handlers, resetSimulation, selectScenario } from './handlers'
import { sessionHandlers, resetAuth, seedAuth } from './session'
import { cartHandlers, resetCarts } from './cart'
import { favoriteHandlers, resetFavorites, failNextFavoriteMutation } from './favorites'
import { profileHandlers } from './profile'
import { resetWallets, walletHandlers } from './wallets'
import { checkoutHandlers } from './checkout'

export const worker = setupWorker(
  ...realtimeHandlers,
  ...handlers,
  ...sessionHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...checkoutHandlers,
)

let recoveryInstalled = false
let reactivation: Promise<void> | undefined

// Chromium may restart an idle worker and lose MSW's in-memory active client IDs.
// Repeating MSW's activation handshake reconnects this page to the restarted worker.
function activateMockClient() {
  if (reactivation) return reactivation

  reactivation = new Promise<void>((resolve, reject) => {
    const serviceWorker = navigator.serviceWorker.controller
    if (!serviceWorker) {
      reject(new Error('O Service Worker dos mocks não está controlando a página'))
      return
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== serviceWorker || event.data?.type !== 'MOCKING_ENABLED') return
      cleanup()
      resolve()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('O Service Worker dos mocks não respondeu à reativação'))
    }, 1_000)

    navigator.serviceWorker.addEventListener('message', handleMessage)
    serviceWorker.postMessage('MOCK_ACTIVATE')
  }).finally(() => {
    reactivation = undefined
  })

  return reactivation
}

function installMockRecovery() {
  if (recoveryInstalled) return
  recoveryInstalled = true

  const reactivateWhenVisible = () => {
    if (document.visibilityState !== 'visible') return
    void activateMockClient().catch(() => undefined)
  }

  document.addEventListener('visibilitychange', reactivateWhenVisible)
  window.addEventListener('focus', reactivateWhenVisible)
  window.addEventListener('pageshow', reactivateWhenVisible)

  httpClient.interceptors.request.use(async (config) => {
    await activateMockClient()
    return config
  })
}

export async function startMocks() {
  await seedAuth()
  selectScenario(import.meta.env.VITE_MOCK_SCENARIO || 'success')
  await worker.start({
    onUnhandledFrame: 'bypass',
  })
  installMockRecovery()
  resumeOrders()
  // Explicit development/demo controls; these never replace REST or socket events.
  window.kurioMocks = {
    changeNft,
    failNextFavoriteMutation,
    disconnect: disconnectSockets,
    publish,
    reset: async () => {
      disconnectSockets()
      resetNftState()
      resetSimulation()
      resetAuth()
      resetCarts()
      resetFavorites()
      resetWallets()
      localStorage.removeItem('kurio.mock.orders.v1')
      localStorage.removeItem('kurio.mock.checkout-wallets.v1')
      localStorage.removeItem('kurio.mock.wallet-connections.v1')
      await seedAuth()
    },
    scenario: selectScenario,
  }
}

declare global {
  interface Window {
    kurioMocks?: {
      reset: () => void
      changeNft: typeof changeNft
      failNextFavoriteMutation: typeof failNextFavoriteMutation
      disconnect: typeof disconnectSockets
      publish: typeof publish
      scenario: typeof selectScenario
    }
  }
}
