import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const isDevTools = window.location.hash === '#devtools'
const Root = lazy(() => isDevTools ? import('./DevToolsView') : import('./App'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <Root />
    </Suspense>
  </StrictMode>,
)
