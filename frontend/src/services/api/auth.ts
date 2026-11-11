import {
  ApiError,
  assertRole,
  getStorageData,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import type { SafeUser } from '@/types'

/**
 * Authenticates user credentials.
 * Email comparison is case-insensitive and trimmed.
 * Never returns plaintext passwords.
 */
export async function login(email: string, password: string): Promise<SafeUser> {
  await simulateNetwork()
  const { users } = getStorageData()

  const normalizedEmail = email ? email.trim().toLowerCase() : ''
  const user = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail)

  if (!user || user.password !== password) {
    throw new ApiError('Incorrect email or password', 'UNAUTHORIZED')
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
