import {
  ApiError,
  assertRole,
  getStorageData,
  setUsers,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import { createToken, verifyToken } from '@/services/auth/token'
import {
  hasErrors,
  validateLogin,
  validateRegister,
} from '@/utils/validation'
import type { RegisterInput, SafeUser, User } from '@/types'

/**
 * Authenticates user credentials and generates an authenticated JWT session token.
 * Validates inputs first, then checks credentials.
 * Email comparison is case-insensitive and trimmed.
 * Never returns plaintext passwords.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ user: SafeUser; token: string }> {
  await simulateNetwork()

  const fieldErrors = validateLogin({ email, password })
  if (hasErrors(fieldErrors)) {
    const firstErrorMessage =
      fieldErrors.email || fieldErrors.password || 'Invalid credentials'
    throw new ApiError(
      firstErrorMessage,
      'VALIDATION',
      fieldErrors as Record<string, string>,
    )
  }

  const { users } = getStorageData()
  const normalizedEmail = email ? email.trim().toLowerCase() : ''
  const user = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail)

  if (!user || user.password !== password) {
    throw new ApiError('Incorrect email or password', 'UNAUTHORIZED')
  }

  const safeUser = toSafeUser(user)
  const token = createToken(safeUser)

  return { user: safeUser, token }
}

/**
 * Registers a new user account with role and generates an authenticated session token.
 * Validates fields and ensures unique email address across all users.
 */
export async function register(
  input: RegisterInput,
): Promise<{ user: SafeUser; token: string }> {
  await simulateNetwork()

  const fieldErrors = validateRegister(input)
  if (hasErrors(fieldErrors)) {
    const firstErrorMessage =
      fieldErrors.name ||
      fieldErrors.email ||
      fieldErrors.password ||
      fieldErrors.confirmPassword ||
      fieldErrors.role ||
      'Invalid registration details'
    throw new ApiError(
      firstErrorMessage,
      'VALIDATION',
      fieldErrors as Record<string, string>,
    )
  }

  const { users } = getStorageData()
  const normalizedEmail = input.email.trim().toLowerCase()
  const existingUser = users.find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail,
  )

  if (existingUser) {
    throw new ApiError(
      'An account with this email already exists',
      'VALIDATION',
      { email: 'An account with this email already exists' },
    )
  }

  const newId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  // Passwords are stored in plain text ONLY because this is a mock; a real backend would hash them
  const newUser: User = {
    id: newId,
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    role: input.role,
  }

  setUsers([...users, newUser])

  const safeUser = toSafeUser(newUser)
  const token = createToken(safeUser)

  return { user: safeUser, token }
}

/**
 * Validates a session token and returns the corresponding SafeUser profile.
 * Throws UNAUTHORIZED ApiError if token is expired, malformed, invalid signature, or user not found.
 */
export async function getSessionUser(token: string): Promise<SafeUser> {
  await simulateNetwork()

  const result = verifyToken(token)
  if (!result.valid) {
    if (result.reason === 'expired') {
      throw new ApiError(
        'Your session has expired. Please sign in again.',
        'UNAUTHORIZED',
      )
    }
    throw new ApiError(
      'Your session is not valid. Please sign in again.',
      'UNAUTHORIZED',
    )
  }

  const { users } = getStorageData()
  const user = users.find((u) => u.id === result.payload.sub)
  if (!user) {
    throw new ApiError(
      'Your session is not valid. Please sign in again.',
      'UNAUTHORIZED',
    )
  }

  return toSafeUser(user)
}

/**
 * Fetches a user profile by ID without exposing password.
 */
export async function getUserById(id: string): Promise<SafeUser> {
  await simulateNetwork()
  const { users } = getStorageData()

  const user = users.find((u) => u.id === id)
  if (!user) {
    throw new ApiError('User not found', 'NOT_FOUND')
  }

  return toSafeUser(user)
}

/**
 * Lists all student profiles (Professor/Admin access required).
 */
export async function listStudents(adminId: string): Promise<SafeUser[]> {
  await simulateNetwork()
  const { users } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Professor')

  return users.filter((u) => u.role === 'student').map(toSafeUser)
}
