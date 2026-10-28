import ReactDOM from 'react-dom/client'
import { App } from './app/app'
import './shared/styles/globals.css'

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}
