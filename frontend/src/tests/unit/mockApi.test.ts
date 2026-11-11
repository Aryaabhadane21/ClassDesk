import { describe, it, expect } from 'vitest'
import { mockApi, ApiError } from '@/services/mockApi'
import { DEMO_PASSWORD } from '@/data/seed'

describe('services/mockApi', () => {
  describe('login', () => {
    it('succeeds with case-insensitive email and never returns password', async () => {
      const { user, token } = await mockApi.login('MEERA.IYER@CLASSDESK.EDU', DEMO_PASSWORD)
      expect(user).toBeDefined()
      expect(user.id).toBe('user-admin-1')
      expect(user.role).toBe('admin')
      expect(token).toBeTruthy()
      expect((user as unknown as { password?: string }).password).toBeUndefined()
    })

    it('fails with invalid credentials', async () => {
      await expect(mockApi.login('meera.iyer@classdesk.edu', 'wrong-pass')).rejects.toThrow(
        ApiError,
      )
    })
  })

  describe('student assignments and markSubmitted', () => {
    it('returns only assignments assigned to that student', async () => {
      const student1Asgs = await mockApi.getStudentAssignments('user-student-1')
      expect(student1Asgs.length).toBeGreaterThan(0)
      for (const a of student1Asgs) {
        expect(
          a.assignedTo === 'all' || a.assignedTo.includes('user-student-1'),
        ).toBe(true)
      }
    })

    it('marks an assignment as submitted and is idempotent', async () => {
      const studentId = 'user-student-1'
      const asgs = await mockApi.getStudentAssignments(studentId)
      const target = asgs[0]

      const updated = await mockApi.markSubmitted(studentId, target.id)
      expect(updated.status).toBe('submitted')
      expect(updated.submittedAt).toBeTruthy()

      // Calling markSubmitted again returns same status without error
      const secondCall = await mockApi.markSubmitted(studentId, target.id)
      expect(secondCall.status).toBe('submitted')
    })

    it('throws NOT_FOUND when student is not assigned', async () => {
      await expect(
        mockApi.markSubmitted('user-student-1', 'non-existent-assignment-id'),
      ).rejects.toThrow()
    })
  })

  describe('cross-course assignment aggregates', () => {
    it('retrieves student assignments across all enrolled courses', async () => {
      const asgs = await mockApi.getStudentAssignments('user-student-1')
      expect(asgs.length).toBeGreaterThan(0)
      for (const a of asgs) {
        expect(a.title).toBeTruthy()
        expect(a.status).toMatch(/^(submitted|not_submitted)$/)
      }
    })

    it('retrieves admin assignments across all taught courses', async () => {
      const meeraAsgs = await mockApi.getAdminAssignments('user-admin-1')
      expect(meeraAsgs.length).toBeGreaterThan(0)
      for (const a of meeraAsgs) {
        expect(a.title).toBeTruthy()
        expect(typeof a.submittedCount).toBe('number')
        expect(typeof a.totalCount).toBe('number')
      }
    })
  })
})
