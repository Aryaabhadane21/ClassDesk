/**
 * LocalStorage keys for client-side state persistence in ClassDesk.
 * All keys are namespaced with the "classdesk:" prefix.
 */
export const STORAGE_KEYS = {
  USERS: 'classdesk:users',
  ASSIGNMENTS: 'classdesk:assignments',
  SUBMISSIONS: 'classdesk:submissions',
  SESSION: 'classdesk:session',
  THEME: 'classdesk:theme',
  NOTIFICATION_READS: 'classdesk:notificationReads',
} as const

export const STORAGE_KEY_USERS = STORAGE_KEYS.USERS
export const STORAGE_KEY_ASSIGNMENTS = STORAGE_KEYS.ASSIGNMENTS
export const STORAGE_KEY_SUBMISSIONS = STORAGE_KEYS.SUBMISSIONS
export const STORAGE_KEY_SESSION = STORAGE_KEYS.SESSION
export const STORAGE_KEY_THEME = STORAGE_KEYS.THEME
export const STORAGE_KEY_NOTIFICATION_READS = STORAGE_KEYS.NOTIFICATION_READS
