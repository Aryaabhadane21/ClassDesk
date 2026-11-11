import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi, ApiError } from '@/services/mockApi'
import { DEMO_PASSWORD } from '@/data/seed'
import { resetDemoData } from '@/services/storage'
import { createToken } from '@/services/auth/token'

describe('Unit: Auth API (login, register, getSessionUser)', () => {
  beforeEach(() => {
    resetDemoData()
  })

  describe('login', () => {
    it('validates email and password presence before checking credentials', async () => {
      try {
        await mockApi.login('', '')
        expect.unreachable('Should throw validation error')
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError)
        const apiErr = err as ApiError
        expect(apiErr.code).toBe('VALIDATION')
        expect(apiErr.fieldErrors?.email).toBe('Email is required')
        expect(apiErr.fieldErrors?.password).toBe('Password is required')
      }
    })

    it('authenticates valid credentials, returns user and token, and strips password', async () => {
      const { user, token } = await mockApi.login('AARAV.SHARMA@CLASSDESK.EDU', DEMO_PASSWORD)
      expect(user.id).toBe('user-student-1')
      expect(user.role).toBe('student')
      expect(user.name).toBe('Aarav Sharma')
      expect((user as unknown as { password?: string }).password).toBeUndefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('rejects incorrect credentials with generic UNAUTHORIZED message', async () => {
      await expect(mockApi.login('aarav.sharma@classdesk.edu', 'wrong-pass')).rejects.toThrow(
        'Incorrect email or password',
      )
    })
  })

  describe('register', () => {
    it('validates registration input fields and carries fieldErrors', async () => {
      try {
        await mockApi.register({
          name: 'A',
          email: 'invalid-email',
          password: 'short',
          role: 'student',
        })
        expect.unreachable('Should throw validation error')
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError)
        const apiErr = err as ApiError
        expect(apiErr.code).toBe('VALIDATION')
        expect(apiErr.fieldErrors?.name).toBe('Name must be between 2 and 60 characters')
        expect(apiErr.fieldErrors?.email).toBe('Enter a valid email address')
        expect(apiErr.fieldErrors?.password).toBe('Password must be at least 8 characters')
      }
    })

    it('rejects duplicate email case-insensitively', async () => {
      try {
        await mockApi.register({
          name: 'Aarav Imposter',
          email: '  AARAV.SHARMA@classdesk.edu  ',
          password: 'NewPassword123',
          role: 'student',
        })
        expect.unreachable('Should throw duplicate error')
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError)
        const apiErr = err as ApiError
        expect(apiErr.code).toBe('VALIDATION')
        expect(apiErr.message).toBe('An account with this email already exists')
        expect(apiErr.fieldErrors?.email).toBe('An account with this email already exists')
      }
    })

    it('registers new user, returns safe user and token, and allows subsequent login', async () => {
      const newEmail = 'neha.verma@classdesk.edu'
      const newPassword = 'SecurePassword2026'

      const { user, token } = await mockApi.register({
        name: 'Neha Verma',
        email: newEmail,
        password: newPassword,
        role: 'student',
      })

      expect(user.id).toBeTruthy()
      expect(user.name).toBe('Neha Verma')
      expect(user.email).toBe(newEmail)
      expect(user.role).toBe('student')
      expect((user as unknown as { password?: string }).password).toBeUndefined()
      expect(token).toBeTruthy()

      // The new user can now log in
      const loginRes = await mockApi.login(newEmail, newPassword)
      expect(loginRes.user.id).toBe(user.id)
      expect(loginRes.user.name).toBe('Neha Verma')
    })
  })

  describe('getSessionUser', () => {
    it('returns the SafeUser profile for a valid token', async () => {
      const { token } = await mockApi.login('meera.iyer@classdesk.edu', DEMO_PASSWORD)
      const user = await mockApi.getSessionUser(token)
      expect(user.id).toBe('user-admin-1')
      expect(user.name).toBe('Prof. Meera Iyer')
      expect((user as unknown as { password?: string }).password).toBeUndefined()
    })

    it('throws UNAUTHORIZED with specific message for expired token', async () => {
      const expiredToken = createToken(
        {
          id: 'user-student-1',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@classdesk.edu',
          role: 'student',
        },
        Date.now() - 3600000 * 24, // 24 hours ago
        -3600, // expired 1 hour before iat
      )

      await expect(mockApi.getSessionUser(expiredToken)).rejects.toThrow(
        'Your session has expired. Please sign in again.',
      )
    })

    it('throws UNAUTHORIZED for tampered or malformed token', async () => {
      const { token } = await mockApi.login('meera.iyer@classdesk.edu', DEMO_PASSWORD)
      const tampered = `${token.slice(0, -4)}ffff`

      await expect(mockApi.getSessionUser(tampered)).rejects.toThrow(
        'Your session is not valid. Please sign in again.',
      )

      await expect(mockApi.getSessionUser('not-a-token')).rejects.toThrow(
        'Your session is not valid. Please sign in again.',
      )
    })

    it('throws UNAUTHORIZED when token belongs to an unknown/deleted user', async () => {
      const token = createToken({
        id: 'user-non-existent',
        name: 'Ghost User',
        email: 'ghost@classdesk.edu',
        role: 'student',
      })

      await expect(mockApi.getSessionUser(token)).rejects.toThrow(
        'Your session is not valid. Please sign in again.',
      )
    })
  })
})
