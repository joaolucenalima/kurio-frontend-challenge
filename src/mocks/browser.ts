import { setupWorker } from 'msw/browser'
import { handlers, resetSimulation, selectScenario } from './handlers'
import { sessionHandlers, resetAuth, seedAuth } from './session'

export const worker = setupWorker(...handlers, ...sessionHandlers)

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
