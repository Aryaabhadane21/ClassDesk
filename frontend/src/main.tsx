import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProviders } from '@/app/AppProviders'
import { ensureSeeded } from '@/services/storage'
import { mockApi } from '@/services/mockApi'
import {
  base64UrlEncode,
  createToken,
  decodeToken,
  getStoredToken,
  setStoredToken,
} from '@/services/auth/token'
import type { TokenPayload } from '@/types'

// Seed storage with initial users, assignments, and submissions if missing
ensureSeeded()

export interface ClassdeskDev {
  expireSession: () => void
  tamperToken: () => void
  decodeStoredToken: () => TokenPayload | null
}

declare global {
  interface Window {
    classdeskApi?: typeof mockApi
    classdeskDev?: ClassdeskDev
  }
}

if (import.meta.env.DEV) {
  // dev helpers, removed in step 15
  window.classdeskApi = mockApi
  window.classdeskDev = {
    expireSession: () => {
      const raw = getStoredToken()
      if (!raw) return
      const payload = decodeToken(raw)
      if (!payload) return
      const expiredToken = createToken(
        { id: payload.sub, name: payload.name, email: '', role: payload.role },
        Date.now() - 3600000 * 24,
        -3600,
      )
      setStoredToken(expiredToken)
    },
    tamperToken: () => {
      const raw = getStoredToken()
      if (!raw) return
      const parts = raw.split('.')
      if (parts.length !== 3) return
      const payload = decodeToken(raw)
      if (!payload) return
      payload.name = `${payload.name} [TAMPERED]`
      const tamperedPayload = base64UrlEncode(JSON.stringify(payload))
      const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`
      setStoredToken(tampered)
    },
    decodeStoredToken: () => {
      const raw = getStoredToken()
      return raw ? decodeToken(raw) : null
    },
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
