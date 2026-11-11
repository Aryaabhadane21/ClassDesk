import { SCHEMA_VERSION, STORAGE_KEYS } from '@/utils/constants'
import { generateSeedData } from '@/data/seed'
import type {
  Assignment,
  Course,
  Enrollment,
  Group,
  GroupAcknowledgement,
  Submission,
  User,
} from '@/types'

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
 * Safely remove an item from both localStorage and in-memory fallback.
 */
export function removeKey(key: string): void {
  inMemoryStorage.delete(key)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage deletion errors
  }
}

/**
 * Seeds collections into storage and migrates if schemaVersion differs.
 * If stored schemaVersion differs from SCHEMA_VERSION (2), clears all classdesk data keys
 * (users, assignments, submissions, courses, enrollments, groups, groupAcks, session, notificationReads)
 * while preserving the user's theme setting, then reseeds fresh demo data and sets the new version.
 */
export function ensureSeeded(): void {
  const storedVersion = readJSON<number | null>(STORAGE_KEYS.SCHEMA_VERSION, null)

  if (storedVersion !== SCHEMA_VERSION) {
    // Version mismatch: clear all data keys except THEME
    const keysToClear = [
      STORAGE_KEYS.USERS,
      STORAGE_KEYS.ASSIGNMENTS,
      STORAGE_KEYS.SUBMISSIONS,
      STORAGE_KEYS.COURSES,
      STORAGE_KEYS.ENROLLMENTS,
      STORAGE_KEYS.GROUPS,
      STORAGE_KEYS.GROUP_ACKS,
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.NOTIFICATION_READS,
    ]

    for (const key of keysToClear) {
      removeKey(key)
    }

    const seed = generateSeedData()
    writeJSON(STORAGE_KEYS.USERS, seed.users)
    writeJSON(STORAGE_KEYS.COURSES, seed.courses)
    writeJSON(STORAGE_KEYS.ENROLLMENTS, seed.enrollments)
    writeJSON(STORAGE_KEYS.GROUPS, seed.groups)
    writeJSON(STORAGE_KEYS.GROUP_ACKS, seed.groupAcks)
    writeJSON(STORAGE_KEYS.ASSIGNMENTS, seed.assignments)
    writeJSON(STORAGE_KEYS.SUBMISSIONS, seed.submissions)
    writeJSON(STORAGE_KEYS.NOTIFICATION_READS, {})
    writeJSON(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
    return
  }

  // Version matches, ensure each individual collection exists
  const existingUsers = readJSON<User[] | null>(STORAGE_KEYS.USERS, null)
  const existingAssignments = readJSON<Assignment[] | null>(STORAGE_KEYS.ASSIGNMENTS, null)
  const existingSubmissions = readJSON<Submission[] | null>(STORAGE_KEYS.SUBMISSIONS, null)
  const existingCourses = readJSON<Course[] | null>(STORAGE_KEYS.COURSES, null)
  const existingEnrollments = readJSON<Enrollment[] | null>(STORAGE_KEYS.ENROLLMENTS, null)
  const existingGroups = readJSON<Group[] | null>(STORAGE_KEYS.GROUPS, null)
  const existingGroupAcks = readJSON<GroupAcknowledgement[] | null>(STORAGE_KEYS.GROUP_ACKS, null)

  if (
    !existingUsers ||
    !existingAssignments ||
    !existingSubmissions ||
    !existingCourses ||
    !existingEnrollments ||
    !existingGroups ||
    !existingGroupAcks
  ) {
    const seed = generateSeedData()
    if (!existingUsers) writeJSON(STORAGE_KEYS.USERS, seed.users)
    if (!existingCourses) writeJSON(STORAGE_KEYS.COURSES, seed.courses)
    if (!existingEnrollments) writeJSON(STORAGE_KEYS.ENROLLMENTS, seed.enrollments)
    if (!existingGroups) writeJSON(STORAGE_KEYS.GROUPS, seed.groups)
    if (!existingGroupAcks) writeJSON(STORAGE_KEYS.GROUP_ACKS, seed.groupAcks)
    if (!existingAssignments) writeJSON(STORAGE_KEYS.ASSIGNMENTS, seed.assignments)
    if (!existingSubmissions) writeJSON(STORAGE_KEYS.SUBMISSIONS, seed.submissions)
    writeJSON(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
  }
}

/**
 * Resets all demo data to pristine seed state while preserving active theme.
 */
export function resetDemoData(): void {
  const seed = generateSeedData()
  writeJSON(STORAGE_KEYS.USERS, seed.users)
  writeJSON(STORAGE_KEYS.COURSES, seed.courses)
  writeJSON(STORAGE_KEYS.ENROLLMENTS, seed.enrollments)
  writeJSON(STORAGE_KEYS.GROUPS, seed.groups)
  writeJSON(STORAGE_KEYS.GROUP_ACKS, seed.groupAcks)
  writeJSON(STORAGE_KEYS.ASSIGNMENTS, seed.assignments)
  writeJSON(STORAGE_KEYS.SUBMISSIONS, seed.submissions)
  writeJSON(STORAGE_KEYS.NOTIFICATION_READS, {})
  writeJSON(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
}

// ---------------------------------------------------------------------------
// Typed Collection Read/Write Helpers
// ---------------------------------------------------------------------------

export function getUsers(): User[] {
  return readJSON<User[]>(STORAGE_KEYS.USERS, [])
}

export function setUsers(users: User[]): void {
  writeJSON(STORAGE_KEYS.USERS, users)
}

export function getCourses(): Course[] {
  return readJSON<Course[]>(STORAGE_KEYS.COURSES, [])
}

export function setCourses(courses: Course[]): void {
  writeJSON(STORAGE_KEYS.COURSES, courses)
}

export function getEnrollments(): Enrollment[] {
  return readJSON<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, [])
}

export function setEnrollments(enrollments: Enrollment[]): void {
  writeJSON(STORAGE_KEYS.ENROLLMENTS, enrollments)
}

export function getGroups(): Group[] {
  return readJSON<Group[]>(STORAGE_KEYS.GROUPS, [])
}

export function setGroups(groups: Group[]): void {
  writeJSON(STORAGE_KEYS.GROUPS, groups)
}

export function getGroupAcks(): GroupAcknowledgement[] {
  return readJSON<GroupAcknowledgement[]>(STORAGE_KEYS.GROUP_ACKS, [])
}

export function setGroupAcks(acks: GroupAcknowledgement[]): void {
  writeJSON(STORAGE_KEYS.GROUP_ACKS, acks)
}

export function getAssignments(): Assignment[] {
  return readJSON<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, [])
}

export function setAssignments(assignments: Assignment[]): void {
  writeJSON(STORAGE_KEYS.ASSIGNMENTS, assignments)
}

export function getSubmissions(): Submission[] {
  return readJSON<Submission[]>(STORAGE_KEYS.SUBMISSIONS, [])
}

export function setSubmissions(submissions: Submission[]): void {
  writeJSON(STORAGE_KEYS.SUBMISSIONS, submissions)
}

// ---------------------------------------------------------------------------
// Notification Read Tracking Helpers
// ---------------------------------------------------------------------------

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
