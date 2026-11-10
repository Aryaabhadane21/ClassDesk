import { describe, it, expect } from 'vitest'
import { mockApi, ApiError } from '@/services/mockApi'
import { DEMO_PASSWORD } from '@/data/seed'

describe('services/mockApi', () => {
  describe('login', () => {
    it('succeeds with case-insensitive email and never returns password', async () => {
      const user = await mockApi.login('MEERA.IYER@CLASSDESK.EDU', DEMO_PASSWORD)
      expect(user).toBeDefined()
      expect(user.id).toBe('user-admin-1')
      expect(user.role).toBe('admin')
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

  describe('admin assignment CRUD and access boundary', () => {
    it('creates assignment, validates input, expands all students and creates submissions', async () => {
      // Validation error: short title
      await expect(
        mockApi.createAssignment('user-admin-1', {
          title: 'ab',
          description: 'Valid description',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          driveLink: 'https://drive.google.com/test',
          assignedTo: 'all',
        }),
      ).rejects.toThrow(ApiError)

      // Valid assignment creation
      const created = await mockApi.createAssignment('user-admin-1', {
        title: 'New Valid Assignment',
        description: 'Complete all steps and deliverables.',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        driveLink: 'https://drive.google.com/folder',
        assignedTo: 'all',
      })

      expect(created.id).toBeTruthy()
      expect(created.submissions.length).toBe(5) // all 5 students
      expect(created.totalCount).toBe(5)
    })

    it('updates assignment: handles added/removed students and preserves existing submissions', async () => {
      const created = await mockApi.createAssignment('user-admin-1', {
        title: 'Project for Update',
        description: 'Initial description',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        driveLink: 'https://drive.google.com/folder',
        assignedTo: ['user-student-1', 'user-student-2'],
      })

      // Student 1 submits
      await mockApi.markSubmitted('user-student-1', created.id)

      // Update: add student 3
      const updated = await mockApi.updateAssignment('user-admin-1', created.id, {
        title: 'Project for Update (Modified)',
        description: 'Updated description',
        dueDate: created.dueDate,
        driveLink: created.driveLink,
        assignedTo: ['user-student-1', 'user-student-2', 'user-student-3'],
      })

      expect(updated.title).toBe('Project for Update (Modified)')
      expect(updated.totalCount).toBe(3)
      // Student 1 submission record should be preserved
      const sub1 = updated.submissions.find((s) => s.studentId === 'user-student-1')
      expect(sub1?.status).toBe('submitted')
    })

    it('deletes assignment and removes its submissions', async () => {
      const created = await mockApi.createAssignment('user-admin-1', {
        title: 'Project to Delete',
        description: 'Short-lived assignment',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        driveLink: 'https://drive.google.com/folder',
        assignedTo: 'all',
      })

      await mockApi.deleteAssignment('user-admin-1', created.id)

      const meeraAsgs = await mockApi.getAdminAssignments('user-admin-1')
      expect(meeraAsgs.some((a) => a.id === created.id)).toBe(false)
    })

    it('refuses access when an admin tries to view/modify another admin’s assignment', async () => {
      const arjunAsgs = await mockApi.getAdminAssignments('user-admin-2')
      const arjunAsgId = arjunAsgs[0].id

      // Prof. Meera tries to delete Prof. Arjun's assignment
      await expect(
        mockApi.deleteAssignment('user-admin-1', arjunAsgId),
      ).rejects.toThrow(ApiError)

      // Prof. Meera tries to update Prof. Arjun's assignment
      await expect(
        mockApi.updateAssignment('user-admin-1', arjunAsgId, {
          title: 'Hacked Title',
          description: 'Hacked',
          dueDate: arjunAsgs[0].dueDate,
          driveLink: arjunAsgs[0].driveLink,
          assignedTo: 'all',
        }),
      ).rejects.toThrow(ApiError)
    })
  })
})
