import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ThemeProvider } from '@/context/theme-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConfigGuard } from '@/components/ConfigGuard'
import { registerPWA } from '@/pwa'
import '@/styles/index.css'

registerPWA()

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:24px;font-family:sans-serif">Élément #root introuvable.</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <ConfigGuard>
            <App />
          </ConfigGuard>
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>,
  )
}
