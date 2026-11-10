import { STORAGE_KEYS } from '@/utils/constants'
import { generateSeedData } from '@/data/seed'
import type { Assignment, Submission, User } from '@/types'

// In-memory fallback map if localStorage is unavailable, disabled, or throws quota limits
const inMemoryStorage = new Map<string, string>()

/**
 * Safely read and parse JSON data from storage.
 * Falls back gracefully to an in-memory cache or default value on error.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return JSON.parse(item) as T
      }
    }
  } catch {
    // LocalStorage access threw; fall through to inMemoryStorage
  }

  const memoryItem = inMemoryStorage.get(key)
  if (memoryItem !== undefined) {
    try {
      return JSON.parse(memoryItem) as T
    } catch {
      return fallback
    }
  }

  return fallback
}

/**
 * Safely serialize and write JSON data to storage.
 * Always synchronizes with an in-memory cache to guarantee persistence across failure modes.
 */
export function writeJSON<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value)
  inMemoryStorage.set(key, serialized)

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized)
    }
  } catch (error) {
    console.warn(`[ClassDesk Storage] LocalStorage write failed for "${key}", using in-memory store.`, error)
  }
}

/**
 * Seeds users, assignments, and submissions into localStorage only if not already present.
 * Never overwrites existing data.
 */
export function ensureSeeded(): void {
  const existingUsers = readJSON<User[] | null>(STORAGE_KEYS.USERS, null)
  const existingAssignments = readJSON<Assignment[] | null>(STORAGE_KEYS.ASSIGNMENTS, null)
  const existingSubmissions = readJSON<Submission[] | null>(STORAGE_KEYS.SUBMISSIONS, null)

  if (!existingUsers || !existingAssignments || !existingSubmissions) {
    const seed = generateSeedData()
    if (!existingUsers) {
      writeJSON(STORAGE_KEYS.USERS, seed.users)
    }
    if (!existingAssignments) {
      writeJSON(STORAGE_KEYS.ASSIGNMENTS, seed.assignments)
    }
    if (!existingSubmissions) {
      writeJSON(STORAGE_KEYS.SUBMISSIONS, seed.submissions)
    }
  }
}

/**
 * Clears existing assignment, submission, and notification data and reseeds fresh demo state.
 */
export function resetDemoData(): void {
  const seed = generateSeedData()
  writeJSON(STORAGE_KEYS.USERS, seed.users)
  writeJSON(STORAGE_KEYS.ASSIGNMENTS, seed.assignments)
  writeJSON(STORAGE_KEYS.SUBMISSIONS, seed.submissions)
  writeJSON(STORAGE_KEYS.NOTIFICATION_READS, {})
}

export type NotificationReadMap = Record<string, string[]>

/**
 * Retrieves the list of read notification IDs for a user.
 */
export function getReadNotificationIds(userId: string): string[] {
  const map = readJSON<NotificationReadMap>(STORAGE_KEYS.NOTIFICATION_READS, {})
  return Array.isArray(map[userId]) ? map[userId] : []
}

/**
 * Marks a notification as read for a user.
 */
export function markNotificationRead(userId: string, notificationId: string): void {
  const map = readJSON<NotificationReadMap>(STORAGE_KEYS.NOTIFICATION_READS, {})
  const current = Array.isArray(map[userId]) ? map[userId] : []
  if (!current.includes(notificationId)) {
    map[userId] = [...current, notificationId]
    writeJSON(STORAGE_KEYS.NOTIFICATION_READS, map)
  }
}

/**
 * Marks multiple notifications as read for a user.
 */
export function markAllNotificationsRead(
  userId: string,
  notificationIds: string[],
): void {
  const map = readJSON<NotificationReadMap>(STORAGE_KEYS.NOTIFICATION_READS, {})
  const current = Array.isArray(map[userId]) ? map[userId] : []
  const merged = Array.from(new Set([...current, ...notificationIds]))
  map[userId] = merged
  writeJSON(STORAGE_KEYS.NOTIFICATION_READS, map)
}

/**
 * Prunes read notification IDs that are no longer valid.
 */
export function pruneReadNotificationIds(
  userId: string,
  validNotificationIds: string[],
): void {
  const map = readJSON<NotificationReadMap>(STORAGE_KEYS.NOTIFICATION_READS, {})
  const current = Array.isArray(map[userId]) ? map[userId] : []
  const validSet = new Set(validNotificationIds)
  const pruned = current.filter((id) => validSet.has(id))
  if (pruned.length !== current.length) {
    map[userId] = pruned
    writeJSON(STORAGE_KEYS.NOTIFICATION_READS, map)
  }
}

