import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { ensureSeeded } from '@/services/storage'
import { mockApi } from '@/services/mockApi'

// Seed storage with initial users, assignments, and submissions if missing
ensureSeeded()

// dev helper, removed in a later step
if (import.meta.env.DEV) {
  window.classdeskApi = mockApi
}

declare global {
  interface Window {
    classdeskApi?: typeof mockApi
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
