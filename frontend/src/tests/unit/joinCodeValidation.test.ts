import { describe, it, expect } from 'vitest'
import { normalizeJoinCode, validateJoinCode } from '@/utils/validation'

describe('Unit: Join Code Validation & Normalization', () => {
  describe('normalizeJoinCode', () => {
    it('trims whitespace, converts to uppercase, and removes internal spaces', () => {
      expect(normalizeJoinCode('  web-4k7p  ')).toBe('WEB-4K7P')
      expect(normalizeJoinCode('web 4k7p')).toBe('WEB4K7P')
      expect(normalizeJoinCode('dsa - 7r3t')).toBe('DSA-7R3T')
      expect(normalizeJoinCode('')).toBe('')
      expect(normalizeJoinCode(undefined)).toBe('')
    })
  })

  describe('validateJoinCode', () => {
    it('requires a join code when empty or whitespace', () => {
      expect(validateJoinCode('')).toBe('Enter the join code your professor gave you')
      expect(validateJoinCode('   ')).toBe('Enter the join code your professor gave you')
      expect(validateJoinCode(undefined)).toBe('Enter the join code your professor gave you')
    })

    it('rejects codes shorter than 4 characters', () => {
      expect(validateJoinCode('ABC')).toBe(
        'Join codes only contain letters, numbers and dashes',
      )
    })

    it('rejects codes longer than 16 characters', () => {
      expect(validateJoinCode('A'.repeat(17))).toBe(
        'Join codes only contain letters, numbers and dashes',
      )
    })

    it('rejects codes with special symbols or punctuation other than dashes', () => {
      expect(validateJoinCode('WEB_4K7P')).toBe(
        'Join codes only contain letters, numbers and dashes',
      )
      expect(validateJoinCode('WEB@4K7P')).toBe(
        'Join codes only contain letters, numbers and dashes',
      )
      expect(validateJoinCode('WEB.4K7P')).toBe(
        'Join codes only contain letters, numbers and dashes',
      )
    })

    it('accepts valid join codes with letters, numbers, and dashes', () => {
      expect(validateJoinCode('WEB-4K7P')).toBeUndefined()
      expect(validateJoinCode('HCI-9M2X')).toBeUndefined()
      expect(validateJoinCode('DSA7R3T')).toBeUndefined()
      expect(validateJoinCode('web-4k7p')).toBeUndefined()
      expect(validateJoinCode('web 4k7p')).toBeUndefined()
    })
  })
})
