/**
 * Current schema version for stored client-side collections.
 */
export const SCHEMA_VERSION = 3

/**
 * Current active semester for ClassDesk.
 */
export const CURRENT_SEMESTER = 'Autumn 2026'

/**
 * LocalStorage keys for client-side state persistence in ClassDesk.
 * All keys are namespaced with the "classdesk:" prefix.
 */
export const STORAGE_KEYS = {
  USERS: 'classdesk:users',
  ASSIGNMENTS: 'classdesk:assignments',
  SUBMISSIONS: 'classdesk:submissions',
  COURSES: 'classdesk:courses',
  ENROLLMENTS: 'classdesk:enrollments',
  GROUPS: 'classdesk:groups',
  GROUP_ACKS: 'classdesk:groupAcks',
  SCHEMA_VERSION: 'classdesk:schemaVersion',
  TOKEN: 'classdesk:token',
  SESSION: 'classdesk:session',
  OLD_SESSION: 'classdesk:session',
  THEME: 'classdesk:theme',
  NOTIFICATION_READS: 'classdesk:notificationReads',
} as const

export const STORAGE_KEY_USERS = STORAGE_KEYS.USERS
export const STORAGE_KEY_ASSIGNMENTS = STORAGE_KEYS.ASSIGNMENTS
export const STORAGE_KEY_SUBMISSIONS = STORAGE_KEYS.SUBMISSIONS
export const STORAGE_KEY_COURSES = STORAGE_KEYS.COURSES
export const STORAGE_KEY_ENROLLMENTS = STORAGE_KEYS.ENROLLMENTS
export const STORAGE_KEY_GROUPS = STORAGE_KEYS.GROUPS
export const STORAGE_KEY_GROUP_ACKS = STORAGE_KEYS.GROUP_ACKS
export const STORAGE_KEY_SCHEMA_VERSION = STORAGE_KEYS.SCHEMA_VERSION
export const STORAGE_KEY_SESSION = STORAGE_KEYS.SESSION
export const STORAGE_KEY_THEME = STORAGE_KEYS.THEME
export const STORAGE_KEY_NOTIFICATION_READS = STORAGE_KEYS.NOTIFICATION_READS
