import {
  ensureSeeded,
  getUsers,
  setUsers,
  getCourses,
  setCourses,
  getEnrollments,
  setEnrollments,
  getGroups,
  setGroups,
  getGroupAcks,
  setGroupAcks,
  getAssignments,
  setAssignments,
  getSubmissions,
  setSubmissions,
} from '@/services/storage'
import type { Role, SafeUser, User } from '@/types'

/**
 * Supported API error codes
 */
export type ApiErrorCode = 'NETWORK' | 'VALIDATION' | 'UNAUTHORIZED' | 'NOT_FOUND'

/**
 * Custom API Error for client-side service handling
 */
export class ApiError extends Error {
  code: ApiErrorCode

  constructor(message: string, code: ApiErrorCode) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Configurable simulation parameters
 */
export interface MockApiConfig {
  minLatencyMs: number
  maxLatencyMs: number
  failureRate: number
}

export const apiConfig: MockApiConfig = {
  minLatencyMs: 300,
  maxLatencyMs: 700,
  failureRate: 0,
}

/**
 * Configure API latency and failure rate (used by test harnesses and dev tools).
 */
export function setApiConfig(
  config: Partial<{
    latency: [number, number]
    minLatencyMs: number
    maxLatencyMs: number
    failureRate: number
  }>,
): void {
  if (config.latency) {
    apiConfig.minLatencyMs = config.latency[0]
    apiConfig.maxLatencyMs = config.latency[1]
  }
  if (typeof config.minLatencyMs === 'number') apiConfig.minLatencyMs = config.minLatencyMs
  if (typeof config.maxLatencyMs === 'number') apiConfig.maxLatencyMs = config.maxLatencyMs
  if (typeof config.failureRate === 'number') apiConfig.failureRate = config.failureRate
}

/**
 * Simulate network latency and optional failure (?simulateErrors=true or failureRate)
 */
export async function simulateNetwork(): Promise<void> {
  const min = apiConfig.minLatencyMs
  const max = apiConfig.maxLatencyMs
  const latency = min <= max ? Math.floor(Math.random() * (max - min + 1)) + min : 0

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency))
  }

  let rate = apiConfig.failureRate
  if (typeof window !== 'undefined' && window.location?.search?.includes('simulateErrors=true')) {
    rate = 0.25
  }

  if (rate > 0 && Math.random() < rate) {
    throw new ApiError('Network connection failed. Please try again.', 'NETWORK')
  }
}

/**
 * Strips password to produce a SafeUser representation
 */
export function toSafeUser(user: User): SafeUser {
  const { password: _, ...safe } = user
  return safe
}

/**
 * Validates that a user exists and possesses the expected role.
 * Throws an ApiError with code 'UNAUTHORIZED' if check fails.
 */
export function assertRole(user: User | undefined, expectedRole: Role, roleName: string): User {
  if (!user || user.role !== expectedRole) {
    throw new ApiError(`${roleName} permission required`, 'UNAUTHORIZED')
  }
  return user
}

/**
 * Helper to ensure storage is seeded before read/write operations and return fresh data collections
 */
export function getStorageData() {
  ensureSeeded()
  return {
    users: getUsers(),
    courses: getCourses(),
    enrollments: getEnrollments(),
    groups: getGroups(),
    groupAcks: getGroupAcks(),
    assignments: getAssignments(),
    submissions: getSubmissions(),
  }
}

export {
  ensureSeeded,
  getUsers,
  setUsers,
  getCourses,
  setCourses,
  getEnrollments,
  setEnrollments,
  getGroups,
  setGroups,
  getGroupAcks,
  setGroupAcks,
  getAssignments,
  setAssignments,
  getSubmissions,
  setSubmissions,
}
