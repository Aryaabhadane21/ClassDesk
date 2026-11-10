import type { Role } from '@/types'

/**
 * Returns the primary landing page path for a given user role.
 */
export function getHomePath(role: Role): string {
  return role === 'admin' ? '/admin' : '/student'
}

/**
 * Checks whether a given route path is permitted for a specific role.
 */
export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (role === 'admin') {
    return pathname.startsWith('/admin')
  }
  if (role === 'student') {
    return pathname.startsWith('/student')
  }
  return false
}
