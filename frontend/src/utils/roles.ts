import type { Role } from '@/types'

/**
 * Returns human-readable label for a role.
 * In UI, 'admin' is displayed as "Professor".
 */
export function roleLabel(role?: Role | string): string {
  if (role === 'admin') return 'Professor'
  if (role === 'student') return 'Student'
  return role || ''
}
