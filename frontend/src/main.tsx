import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProviders } from '@/app/AppProviders'
import { ensureSeeded } from '@/services/storage'

// Seed storage with initial users, assignments, and submissions if missing
ensureSeeded()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
