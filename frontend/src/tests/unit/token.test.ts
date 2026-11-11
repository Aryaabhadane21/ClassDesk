import { describe, it, expect } from 'vitest'
import {
  base64UrlDecode,
  base64UrlEncode,
  createToken,
  decodeToken,
  TOKEN_LIFETIME_SECONDS,
  verifyToken,
} from '@/services/auth/token'
import type { SafeUser } from '@/types'

describe('Unit: Token Module (simulated JWT)', () => {
  const sampleUser: SafeUser = {
    id: 'user-sample-123',
    name: 'Sample User',
    email: 'sample@classdesk.edu',
    role: 'student',
  }

  it('exports TOKEN_LIFETIME_SECONDS equal to 8 hours', () => {
    expect(TOKEN_LIFETIME_SECONDS).toBe(8 * 60 * 60)
  })

  it('handles UTF-8 safe base64url roundtrip encoding without external libraries', () => {
    const raw = 'Hello World! Special chars: é, ü, 🚀, 日本語'
    const encoded = base64UrlEncode(raw)
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
    const decoded = base64UrlDecode(encoded)
    expect(decoded).toBe(raw)
  })

  it('creates and verifies a valid token successfully (roundtrip)', () => {
    const now = 1700000000000
    const token = createToken(sampleUser, now)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)

    const verification = verifyToken(token, now)
    expect(verification.valid).toBe(true)
    if (verification.valid) {
      expect(verification.payload.sub).toBe(sampleUser.id)
      expect(verification.payload.name).toBe(sampleUser.name)
      expect(verification.payload.role).toBe(sampleUser.role)
      expect(verification.payload.iat).toBe(Math.floor(now / 1000))
      expect(verification.payload.exp).toBe(Math.floor(now / 1000) + TOKEN_LIFETIME_SECONDS)
    }
  })

  it('detects tampered payload without correct signature (bad_signature)', () => {
    const now = 1700000000000
    const token = createToken(sampleUser, now)
    const [header, payload, sig] = token.split('.')

    // Tamper payload to elevate role to admin
    const decoded = JSON.parse(base64UrlDecode(payload))
    decoded.role = 'admin'
    const tamperedPayload = base64UrlEncode(JSON.stringify(decoded))
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`

    const verification = verifyToken(tamperedToken, now)
    expect(verification.valid).toBe(false)
    if (!verification.valid) {
      expect(verification.reason).toBe('bad_signature')
    }
  })

  it('detects malformed and garbage strings gracefully (malformed)', () => {
    expect(verifyToken('').valid).toBe(false)
    expect(verifyToken('garbage-string').valid).toBe(false)
    expect(verifyToken('header.payload').valid).toBe(false)
    expect(verifyToken('a.b.c.d').valid).toBe(false)
    expect(verifyToken('badBase64!.badPayload!.badSig!').valid).toBe(false)

    // Token with invalid JSON in header or payload
    const badHeader = base64UrlEncode('not-json')
    const badPayload = base64UrlEncode('not-json')
    expect(verifyToken(`${badHeader}.${badPayload}.fakeSig`).valid).toBe(false)
  })

  it('detects expired token when clock advances past exp (expired)', () => {
    const now = 1700000000000
    const lifetime = 60 // 1 minute
    const token = createToken(sampleUser, now, lifetime)

    // Valid immediately
    expect(verifyToken(token, now).valid).toBe(true)

    // Expired after 61 seconds
    const futureTime = now + 61 * 1000
    const verification = verifyToken(token, futureTime)
    expect(verification.valid).toBe(false)
    if (!verification.valid) {
      expect(verification.reason).toBe('expired')
    }
  })

  it('decodeToken parses payload without throwing, returning null for malformed tokens', () => {
    const now = 1700000000000
    const token = createToken(sampleUser, now)

    const payload = decodeToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe(sampleUser.id)
    expect(payload?.name).toBe(sampleUser.name)

    // Invalid tokens return null instead of throwing
    expect(decodeToken('garbage')).toBeNull()
    expect(decodeToken('a.badjson.c')).toBeNull()
    expect(decodeToken(null as never)).toBeNull()
  })
})
