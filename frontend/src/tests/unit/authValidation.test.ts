import { describe, it, expect } from 'vitest'
import {
  hasErrors,
  isValidEmail,
  validateLogin,
  validateRegister,
} from '@/utils/validation'

describe('Unit: Auth Validation (validateLogin & validateRegister)', () => {
  describe('isValidEmail', () => {
    it('returns true for standard email formats', () => {
      expect(isValidEmail('test@classdesk.edu')).toBe(true)
      expect(isValidEmail('student.1@domain.co.in')).toBe(true)
      expect(isValidEmail('  user@sub.domain.org  ')).toBe(true)
    })

    it('returns false for invalid email formats', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('plainaddress')).toBe(false)
      expect(isValidEmail('@missinguser.com')).toBe(false)
      expect(isValidEmail('missingdomain@')).toBe(false)
      expect(isValidEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('validateLogin', () => {
    it('requires email and password', () => {
      const errors = validateLogin({})
      expect(errors.email).toBe('Email is required')
      expect(errors.password).toBe('Password is required')
      expect(hasErrors(errors)).toBe(true)
    })

    it('checks email format', () => {
      const errors = validateLogin({ email: 'bad-email', password: 'password123' })
      expect(errors.email).toBe('Enter a valid email address')
      expect(errors.password).toBeUndefined()
      expect(hasErrors(errors)).toBe(true)
    })

    it('succeeds with valid email and password', () => {
      const errors = validateLogin({
        email: 'user@classdesk.edu',
        password: 'ValidPassword1',
      })
      expect(errors.email).toBeUndefined()
      expect(errors.password).toBeUndefined()
      expect(hasErrors(errors)).toBe(false)
    })
  })

  describe('validateRegister', () => {
    it('validates name length (2-60 characters)', () => {
      // Empty name
      expect(validateRegister({ name: '' }).name).toBe('Name is required')
      // 1 character name
      expect(validateRegister({ name: 'A' }).name).toBe('Name must be between 2 and 60 characters')
      // 61 characters name
      const longName = 'A'.repeat(61)
      expect(validateRegister({ name: longName }).name).toBe(
        'Name must be between 2 and 60 characters',
      )
      // Valid name
      expect(validateRegister({ name: 'John Doe' }).name).toBeUndefined()
    })

    it('validates email format and max length (120 characters)', () => {
      // Empty
      expect(validateRegister({ email: '' }).email).toBe('Email is required')
      // Format
      expect(validateRegister({ email: 'notanemail' }).email).toBe('Enter a valid email address')
      // Exceeds 120 chars
      const longEmail = `${'a'.repeat(115)}@domain.com`
      expect(validateRegister({ email: longEmail }).email).toBe(
        'Email must not exceed 120 characters',
      )
      // Valid email
      expect(validateRegister({ email: 'student@classdesk.edu' }).email).toBeUndefined()
    })

    it('validates password requirements (8-64 chars, letter + number)', () => {
      // Empty
      expect(validateRegister({ password: '' }).password).toBe('Password is required')
      // < 8 chars
      expect(validateRegister({ password: 'Pass1' }).password).toBe(
        'Password must be at least 8 characters',
      )
      // > 64 chars
      expect(validateRegister({ password: 'A1'.repeat(33) }).password).toBe(
        'Password must not exceed 64 characters',
      )
      // No letter
      expect(validateRegister({ password: '123456789' }).password).toBe(
        'Password needs at least one letter and one number',
      )
      // No number
      expect(validateRegister({ password: 'abcdefghijk' }).password).toBe(
        'Password needs at least one letter and one number',
      )
      // Valid password
      expect(validateRegister({ password: 'ValidPass1' }).password).toBeUndefined()
    })

    it('validates confirmPassword when provided', () => {
      expect(
        validateRegister({
          password: 'Password1',
          confirmPassword: 'MismatchPassword2',
        }).confirmPassword,
      ).toBe('Passwords do not match')

      expect(
        validateRegister({
          password: 'Password1',
          confirmPassword: 'Password1',
        }).confirmPassword,
      ).toBeUndefined()
    })

    it('validates role (student or admin)', () => {
      expect(validateRegister({ role: undefined }).role).toBe('Choose a role')
      expect(validateRegister({ role: 'other' as never }).role).toBe('Choose a role')
      expect(validateRegister({ role: 'student' }).role).toBeUndefined()
      expect(validateRegister({ role: 'admin' }).role).toBeUndefined()
    })

    it('returns no errors for completely valid registration payload', () => {
      const errors = validateRegister({
        name: 'Jane Doe',
        email: 'jane.doe@classdesk.edu',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
        role: 'student',
      })
      expect(hasErrors(errors)).toBe(false)
    })
  })
})
