import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { resetDemoData } from '@/services/storage'
import { createToken, setStoredToken, getStoredToken } from '@/services/auth/token'
import { STORAGE_KEYS } from '@/utils/constants'
import { DEMO_PASSWORD } from '@/data/seed'

describe('Unit: AuthContext with JWT Token Session', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    resetDemoData()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('initializes as unauthenticated when no token is in storage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })
    expect(result.current.user).toBeNull()
    expect(result.current.sessionNotice).toBeNull()
  })

  it('restores authenticated session on mount from a valid stored token', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    setStoredToken(token)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })
    expect(result.current.user?.id).toBe('user-student-1')
    expect(result.current.user?.name).toBe('Aarav Sharma')
  })

  it('clears bad/tampered token on mount and sets sessionNotice to invalid', async () => {
    setStoredToken('invalid.token.value')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })
    expect(result.current.user).toBeNull()
    expect(getStoredToken()).toBeNull()
    expect(result.current.sessionNotice).toBe('invalid')
  })

  it('clears expired token on mount and sets sessionNotice to expired', async () => {
    const expiredToken = createToken(
      {
        id: 'user-student-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@classdesk.edu',
        role: 'student',
      },
      Date.now() - 3600000 * 24,
      -3600,
    )
    setStoredToken(expiredToken)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })
    expect(result.current.user).toBeNull()
    expect(getStoredToken()).toBeNull()
    expect(result.current.sessionNotice).toBe('expired')
  })

  it('login stores token, sets authenticated status, and returns safe user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })

    let loggedInUser
    await act(async () => {
      loggedInUser = await result.current.login(
        'aarav.sharma@classdesk.edu',
        DEMO_PASSWORD,
      )
    })

    expect(loggedInUser?.id).toBe('user-student-1')
    expect(result.current.status).toBe('authenticated')
    expect(result.current.user?.id).toBe('user-student-1')
    expect(getStoredToken()).toBeTruthy()
  })

  it('register stores token, authenticates new user, and clears notice', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })

    let registeredUser
    await act(async () => {
      registeredUser = await result.current.register({
        name: 'Fresh User',
        email: 'fresh.user@classdesk.edu',
        password: 'Password2026',
        role: 'student',
      })
    })

    expect(registeredUser?.name).toBe('Fresh User')
    expect(result.current.status).toBe('authenticated')
    expect(result.current.user?.email).toBe('fresh.user@classdesk.edu')
    expect(getStoredToken()).toBeTruthy()
  })

  it('logout removes token from storage and clears user without notice', async () => {
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    setStoredToken(token)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(getStoredToken()).toBeNull()
    expect(result.current.sessionNotice).toBeNull()
  })

  it('detects a tampered token on window focus and logs out with invalid notice', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    setStoredToken(token)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })

    // Corrupt token in localStorage directly
    setStoredToken(`${token.slice(0, -6)}tamper`)

    // Trigger focus event
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(result.current.sessionNotice).toBe('invalid')
  })

  it('logs out when token is removed in another tab via storage event', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    setStoredToken(token)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })

    // Simulate another tab clearing the token
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.TOKEN,
          oldValue: token,
          newValue: null,
        }),
      )
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
  })

  it('automatically logs out and sets expired notice when token expires via timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    // Create token that expires in 5 seconds
    const shortToken = createToken(
      {
        id: 'user-student-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@classdesk.edu',
        role: 'student',
      },
      Date.now(),
      5, // 5 seconds lifetime
    )
    setStoredToken(shortToken)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })

    // Advance clock past expiration
    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(result.current.sessionNotice).toBe('expired')
  })
})
