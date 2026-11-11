import { describe, it, expect, beforeEach } from 'vitest'
import {
  ensureSeeded,
  readJSON,
  writeJSON,
  getCourses,
  getAssignments,
} from '@/services/storage'
import { SCHEMA_VERSION, STORAGE_KEYS } from '@/utils/constants'

describe('Unit: Storage Versioning and Migration', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('triggers full reset and reseed when stored schema version is outdated, while preserving theme', () => {
    // 1. Setup an outdated schema version (v1) with custom obsolete state
    writeJSON(STORAGE_KEYS.SCHEMA_VERSION, 1)
    writeJSON(STORAGE_KEYS.THEME, 'dark')
    writeJSON(STORAGE_KEYS.ASSIGNMENTS, [
      { id: 'obsolete-asg', title: 'Old Asg' },
    ])
    writeJSON(STORAGE_KEYS.SESSION, 'user-student-old')

    // 2. Run ensureSeeded()
    ensureSeeded()

    // 3. Schema version must be updated to current
    const updatedVersion = readJSON(STORAGE_KEYS.SCHEMA_VERSION, null)
    expect(updatedVersion).toBe(SCHEMA_VERSION)

    // 4. Active theme MUST be preserved
    const theme = readJSON(STORAGE_KEYS.THEME, null)
    expect(theme).toBe('dark')

    // 5. Old data must be cleared and fresh seed data reseeded
    const courses = getCourses()
    expect(courses.length).toBe(4)

    const assignments = getAssignments()
    expect(assignments.some((a) => a.id === 'obsolete-asg')).toBe(false)
    expect(assignments.length).toBe(12)

    // 6. Old session must be cleared
    const session = readJSON(STORAGE_KEYS.SESSION, null)
    expect(session).toBeNull()
  })

  it('does not wipe data when schema version matches CURRENT_SCHEMA_VERSION', () => {
    ensureSeeded()

    const initialCourses = getCourses()
    expect(initialCourses.length).toBe(4)

    // Add a test course while keeping version = SCHEMA_VERSION
    const customCourses = [
      ...initialCourses,
      {
        id: 'course-custom-test',
        code: 'TEST999',
        name: 'Custom Test Course',
        description: 'Test',
        semester: 'Autumn 2026',
        professorId: 'user-admin-1',
        joinCode: 'TEST-1234',
        createdAt: new Date().toISOString(),
      },
    ]
    writeJSON(STORAGE_KEYS.COURSES, customCourses)

    // Run ensureSeeded() again
    ensureSeeded()

    const afterCourses = getCourses()
    expect(afterCourses.some((c) => c.id === 'course-custom-test')).toBe(true)
    expect(afterCourses.length).toBe(5)
  })
})
