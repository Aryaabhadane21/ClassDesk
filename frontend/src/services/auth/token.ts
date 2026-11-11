import type { SafeUser, TokenPayload } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

/**
 * 8-hour token lifetime in seconds (8 * 60 * 60)
 */
export const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60

/**
 * Reads the stored session token from localStorage.
 */
export function getStoredToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!val) return null
      if (val.startsWith('"') && val.endsWith('"')) {
        try {
          return JSON.parse(val) as string
        } catch {
          return val
        }
      }
      return val
    }
  } catch {
    // In-memory fallback or storage access denied
  }
  return null
}

/**
 * Writes the session token to localStorage.
 */
export function setStoredToken(token: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    }
  } catch {
    // In-memory fallback
  }
}

/**
 * Removes the session token from localStorage.
 */
export function removeStoredToken(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.TOKEN)
    }
  } catch {
    // In-memory fallback
  }
}

/**
 * Simulated secret key used for token signing in this client-only application.
 * simulated for this front-end-only project, NOT secure.
 */
const SIMULATED_SECRET = 'classdesk_mock_jwt_secret_do_not_use_in_production'

/**
 * Standard simulated JWT header
 */
const TOKEN_HEADER = {
  alg: 'HS256-SIM',
  typ: 'JWT',
} as const

/**
 * UTF-8 safe base64url encoder without external libraries
 */
export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * UTF-8 safe base64url decoder without external libraries
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Fast deterministic non-cryptographic cyrb53 hash function.
 * simulated for this front-end-only project, NOT secure.
 */
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return hash.toString(16).padStart(14, '0')
}

/**
 * Computes deterministic hex signature for header.payload.
 * simulated for this front-end-only project, NOT secure.
 */
export function computeSignature(headerAndPayload: string): string {
  return cyrb53(`${headerAndPayload}.${SIMULATED_SECRET}`)
}

/**
 * Generates a signed simulated JWT token for a user.
 */
export function createToken(
  user: SafeUser,
  now = Date.now(),
  lifetimeSeconds = TOKEN_LIFETIME_SECONDS,
): string {
  const iat = Math.floor(now / 1000)
  const exp = iat + lifetimeSeconds

  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    iat,
    exp,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(TOKEN_HEADER))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = computeSignature(`${encodedHeader}.${encodedPayload}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Decodes the token payload without verifying the signature or expiry.
 * Used for inspecting expiration timers and dev helpers. Never throws.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const json = base64UrlDecode(parts[1])
    const payload = JSON.parse(json) as TokenPayload

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export type TokenVerifyResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: 'malformed' | 'bad_signature' | 'expired' }

/**
 * Verifies the structure, signature, and expiration of a simulated JWT token.
 * Never throws.
 */
export function verifyToken(token: string, now = Date.now()): TokenVerifyResult {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'malformed' }
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, reason: 'malformed' }
    }

    let headerJson: string
    let payloadJson: string
    try {
      headerJson = base64UrlDecode(parts[0])
      payloadJson = base64UrlDecode(parts[1])
    } catch {
      return { valid: false, reason: 'malformed' }
    }

    let header: { alg?: string; typ?: string }
    let payload: TokenPayload
    try {
      header = JSON.parse(headerJson)
      payload = JSON.parse(payloadJson)
    } catch {
      return { valid: false, reason: 'malformed' }
    }

    if (!header || header.alg !== TOKEN_HEADER.alg || header.typ !== TOKEN_HEADER.typ) {
      return { valid: false, reason: 'malformed' }
    }

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return { valid: false, reason: 'malformed' }
    }

    const expectedSig = computeSignature(`${parts[0]}.${parts[1]}`)
    if (parts[2] !== expectedSig) {
      return { valid: false, reason: 'bad_signature' }
    }

    const nowSeconds = Math.floor(now / 1000)
    if (payload.exp <= nowSeconds) {
      return { valid: false, reason: 'expired' }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false, reason: 'malformed' }
  }
}
