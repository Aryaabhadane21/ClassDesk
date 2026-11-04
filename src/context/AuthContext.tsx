import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { SafeUser } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { readJSON, writeJSON } from '@/services/storage'
import { mockApi } from '@/services/mockApi'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: SafeUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<SafeUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Restore session on mount
  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const savedUserId = readJSON<string | null>(STORAGE_KEYS.SESSION, null)

      if (!savedUserId) {
        if (isMounted) {
          setUser(null)
          setStatus('unauthenticated')
        }
        return
      }

      try {
        const foundUser = await mockApi.getUserById(savedUserId)
        if (isMounted) {
          setUser(foundUser)
          setStatus('authenticated')
        }
      } catch {
        // User could not be found or invalid session
        writeJSON(STORAGE_KEYS.SESSION, null)
        if (isMounted) {
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<SafeUser> => {
    const authenticatedUser = await mockApi.login(email, password)
    // Persist only the user ID to storage (never passwords or whole user object)
    writeJSON(STORAGE_KEYS.SESSION, authenticatedUser.id)
    setUser(authenticatedUser)
    setStatus('authenticated')
    return authenticatedUser
  }, [])

  const logout = useCallback(() => {
    writeJSON(STORAGE_KEYS.SESSION, null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access current authentication state and login/logout functions
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
