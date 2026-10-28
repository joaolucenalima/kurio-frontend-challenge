import { setupWorker } from 'msw/browser'
import { handlers, resetSimulation, selectScenario } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMocks() {
  selectScenario(import.meta.env.VITE_MOCK_SCENARIO || 'success')
  await worker.start({
    onUnhandledFrame: 'bypass',
  })
  // Explicit development/demo controls; these never replace REST or socket events.
  window.kurioMocks = {
    reset: resetSimulation,
    scenario: selectScenario,
  }
}

declare global {
  interface Window {
    kurioMocks?: {
      reset: typeof resetSimulation
      scenario: typeof selectScenario
    }
  }
}
