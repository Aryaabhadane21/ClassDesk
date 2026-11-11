import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { RegisterInput, SafeUser } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import {
  decodeToken,
  getStoredToken,
  removeStoredToken,
  setStoredToken,
  verifyToken,
} from '@/services/auth/token'
import { mockApi } from '@/services/mockApi'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
export type SessionNotice = 'expired' | 'invalid' | null

export interface AuthContextValue {
  user: SafeUser | null
  status: AuthStatus
  sessionNotice: SessionNotice
  clearSessionNotice: () => void
  login: (email: string, password: string) => Promise<SafeUser>
  register: (input: RegisterInput) => Promise<SafeUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Startup cleanup: delete any leftover old session key
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.OLD_SESSION)
    window.localStorage.removeItem(STORAGE_KEYS.SESSION)
  } catch {
    // Ignore storage restrictions
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [sessionNotice, setSessionNotice] = useState<SessionNotice>(null)

  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }, [])

  const scheduleExpiryTimer = useCallback(
    (token: string) => {
      clearExpiryTimer()
      const payload = decodeToken(token)
      if (!payload) return

      const msUntilExp = payload.exp * 1000 - Date.now()
      if (msUntilExp <= 0) {
        removeStoredToken()
        if (isMountedRef.current) {
          setUser(null)
          setStatus('unauthenticated')
          setSessionNotice('expired')
        }
        return
      }

      // Cap very long timeouts safely to 2^31 - 1 (~24.8 days)
      const safeTimeoutMs = Math.min(msUntilExp, 0x7fffffff)
      expiryTimerRef.current = setTimeout(() => {
        removeStoredToken()
        if (isMountedRef.current) {
          setUser(null)
          setStatus('unauthenticated')
          setSessionNotice('expired')
        }
      }, safeTimeoutMs)
    },
    [clearExpiryTimer],
  )

  const restoreSession = useCallback(
    async (token: string) => {
      try {
        const foundUser = await mockApi.getSessionUser(token)
        if (isMountedRef.current) {
          setUser(foundUser)
          setStatus('authenticated')
          scheduleExpiryTimer(token)
        }
      } catch (err: unknown) {
        removeStoredToken()
        if (isMountedRef.current) {
          setUser(null)
          setStatus('unauthenticated')
          const isExpired =
            err instanceof Error && err.message.toLowerCase().includes('expired')
          setSessionNotice(isExpired ? 'expired' : 'invalid')
        }
      }
    },
    [scheduleExpiryTimer],
  )

  // Periodic and visibility token check
  const checkCurrentToken = useCallback(() => {
    const token = getStoredToken()
    if (!token) {
      if (status === 'authenticated') {
        clearExpiryTimer()
        if (isMountedRef.current) {
          setUser(null)
          setStatus('unauthenticated')
        }
      }
      return
    }

    const result = verifyToken(token)
    if (!result.valid) {
      clearExpiryTimer()
      removeStoredToken()
      if (isMountedRef.current) {
        setUser(null)
        setStatus('unauthenticated')
        setSessionNotice(result.reason === 'expired' ? 'expired' : 'invalid')
      }
    }
  }, [clearExpiryTimer, status])

  // Restore session on mount
  useEffect(() => {
    isMountedRef.current = true

    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setStatus('unauthenticated')
    } else {
      restoreSession(token)
    }

    return () => {
      isMountedRef.current = false
      clearExpiryTimer()
    }
  }, [clearExpiryTimer, restoreSession])

  // Periodic (30s) and focus/visibility token verification
  useEffect(() => {
    const interval = setInterval(checkCurrentToken, 30000)

    const onFocus = () => checkCurrentToken()
    const onVisibilityChange = () => {
      if (!document.hidden) {
        checkCurrentToken()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [checkCurrentToken])

  // Multi-tab synchronization via localStorage storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TOKEN) {
        if (!e.newValue) {
          // Token removed in another tab -> log out
          clearExpiryTimer()
          if (isMountedRef.current) {
            setUser(null)
            setStatus('unauthenticated')
          }
        } else {
          // Token changed/added in another tab -> sync session
          restoreSession(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [clearExpiryTimer, restoreSession])

  const login = useCallback(
    async (email: string, password: string): Promise<SafeUser> => {
      const { user: authenticatedUser, token } = await mockApi.login(email, password)
      setStoredToken(token)
      if (isMountedRef.current) {
        setUser(authenticatedUser)
        setStatus('authenticated')
        setSessionNotice(null)
        scheduleExpiryTimer(token)
      }
      return authenticatedUser
    },
    [scheduleExpiryTimer],
  )

  const register = useCallback(
    async (input: RegisterInput): Promise<SafeUser> => {
      const { user: registeredUser, token } = await mockApi.register(input)
      setStoredToken(token)
      if (isMountedRef.current) {
        setUser(registeredUser)
        setStatus('authenticated')
        setSessionNotice(null)
        scheduleExpiryTimer(token)
      }
      return registeredUser
    },
    [scheduleExpiryTimer],
  )

  const logout = useCallback(() => {
    clearExpiryTimer()
    removeStoredToken()
    if (isMountedRef.current) {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [clearExpiryTimer])

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        sessionNotice,
        clearSessionNotice,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access current authentication state and auth actions.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
