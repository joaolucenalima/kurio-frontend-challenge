import ReactDOM from 'react-dom/client'
import './shared/styles/globals.css'

const rootElement = document.getElementById('app')!

async function bootstrap() {
  if (import.meta.env.VITE_MOCKS_ENABLED === 'true') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }

  const { App } = await import('./app/app')

  if (rootElement.innerHTML) return
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}

void bootstrap().catch(() => {
  rootElement.textContent =
    'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.'
})
