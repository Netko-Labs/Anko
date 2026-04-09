import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import DevToolsView from './DevToolsView'

const isDevTools = window.location.hash === '#devtools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDevTools ? <DevToolsView /> : <App />}</StrictMode>,
)
