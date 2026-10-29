import { setupWorker } from 'msw/browser'
import { handlers, resetSimulation, selectScenario } from './handlers'
import { sessionHandlers, resetAuth, seedAuth } from './session'
import { cartHandlers, resetCarts } from './cart'
import { favoriteHandlers, resetFavorites } from './favorites'

export const worker = setupWorker(
  ...handlers,
  ...sessionHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
)

export async function startMocks() {
  await seedAuth()
  selectScenario(import.meta.env.VITE_MOCK_SCENARIO || 'success')
  await worker.start({
    onUnhandledFrame: 'bypass',
  })
  // Explicit development/demo controls; these never replace REST or socket events.
  window.kurioMocks = {
    reset: () => {
      resetSimulation()
      resetAuth()
      resetCarts()
      resetFavorites()
      void seedAuth()
    },
    scenario: selectScenario,
  }
}

declare global {
  interface Window {
    kurioMocks?: {
      reset: () => void
      scenario: typeof selectScenario
    }
  }
}
