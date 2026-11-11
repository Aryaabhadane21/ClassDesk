import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProviders } from '@/app/AppProviders'
import { ensureSeeded } from '@/services/storage'
import { mockApi } from '@/services/mockApi'

// Seed storage with initial users, assignments, and submissions if missing
ensureSeeded()

declare global {
  interface Window {
    classdeskApi?: typeof mockApi
  }
}

if (import.meta.env.DEV) {
  // dev helper, removed in step 15
  window.classdeskApi = mockApi
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
