import { describe, it, expect } from 'vitest'
import { getStudentStats, getAdminStats, getProfessorCourseStats, getStudentCourseStats } from '@/utils/stats'
import type { StudentAssignment, AdminAssignment, ProfessorCourse, StudentCourse } from '@/types'

describe('Unit: Stats Calculation Helpers', () => {
  const fixedNow = new Date(2026, 10, 5, 12, 0, 0)

  describe('getStudentStats', () => {
    it('handles empty assignments array', () => {
      const stats = getStudentStats([], fixedNow)
      expect(stats).toEqual({
        dueToday: 0,
        overdue: 0,
        submitted: 0,
        completionPercent: 0,
        total: 0,
      })
    })

    it('accurately counts dueToday, overdue, submitted, and percent', () => {
      const mockItems: StudentAssignment[] = [
        {
          id: '1',
          courseId: 'course-web101',
          submissionType: 'individual',
          title: 'Submitted on time',
          description: '',
          dueDate: new Date(2026, 10, 1, 10, 0, 0).toISOString(),
          oneDriveLink: 'https://1drv.ms/test1',
          status: 'submitted',
          submittedAt: new Date(2026, 9, 31, 10, 0, 0).toISOString(),
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
        },
        {
          id: '2',
          courseId: 'course-web101',
          submissionType: 'individual',
          title: 'Overdue task',
          description: '',
          dueDate: new Date(2026, 10, 4, 10, 0, 0).toISOString(), // past due relative to Nov 5
          oneDriveLink: 'https://1drv.ms/test2',
          status: 'not_submitted',
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
        },
        {
          id: '3',
          courseId: 'course-web101',
          submissionType: 'individual',
          title: 'Due today task',
          description: '',
          dueDate: new Date(2026, 10, 5, 18, 0, 0).toISOString(), // same day
          oneDriveLink: 'https://1drv.ms/test3',
          status: 'not_submitted',
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
        },
        {
          id: '4',
          courseId: 'course-web101',
          submissionType: 'individual',
          title: 'Future task',
          description: '',
          dueDate: new Date(2026, 10, 15, 10, 0, 0).toISOString(),
          oneDriveLink: 'https://1drv.ms/test4',
          status: 'not_submitted',
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
        },
      ]

      const stats = getStudentStats(mockItems, fixedNow)
      expect(stats.total).toBe(4)
      expect(stats.submitted).toBe(1)
      expect(stats.overdue).toBe(1)
      expect(stats.dueToday).toBe(1)
      expect(stats.completionPercent).toBe(25) // 1 / 4
    })
  })

  describe('getAdminStats', () => {
    it('handles empty assignments array', () => {
      const stats = getAdminStats([], fixedNow)
      expect(stats).toEqual({
        totalAssignments: 0,
        averageCompletion: 0,
        pendingSubmissions: 0,
        overdueAssignments: 0,
      })
    })

    it('computes total assignments, average completion, pending count and overdue assignments', () => {
      const mockAdminItems: AdminAssignment[] = [
        {
          id: 'a1',
          courseId: 'course-web101',
          submissionType: 'individual',
          title: 'Assignment 1',
          description: '',
          dueDate: new Date(2026, 10, 1, 10, 0, 0).toISOString(), // overdue
          oneDriveLink: 'https://1drv.ms/test-a1',
          assignedTo: ['s1', 's2'],
          submittedCount: 1,
          totalCount: 2,
          submissions: [
            { studentId: 's1', studentName: 'S1', studentEmail: 's1@test.com', status: 'submitted', submittedAt: new Date(2026, 9, 31, 10, 0, 0).toISOString() },
            { studentId: 's2', studentName: 'S2', studentEmail: 's2@test.com', status: 'not_submitted' },
          ],
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
          createdBy: 'admin-1',
        },
        {
          id: 'a2',
          courseId: 'course-dsa201',
          submissionType: 'individual',
          title: 'Assignment 2',
          description: '',
          dueDate: new Date(2026, 10, 10, 10, 0, 0).toISOString(),
          oneDriveLink: 'https://1drv.ms/test-a2',
          assignedTo: ['s1'],
          submittedCount: 1,
          totalCount: 1,
          submissions: [
            { studentId: 's1', studentName: 'S1', studentEmail: 's1@test.com', status: 'submitted', submittedAt: new Date(2026, 9, 31, 10, 0, 0).toISOString() },
          ],
          createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
          createdBy: 'admin-1',
        },
      ]

      // a1: 1 of 2 = 50%
      // a2: 1 of 1 = 100%
      // avg: 75%
      // pending: 1 (s2 on a1)
      // overdue: 1 (a1 has dueDate in past and 1 pending)
      const stats = getAdminStats(mockAdminItems, fixedNow)
      expect(stats.totalAssignments).toBe(2)
      expect(stats.averageCompletion).toBe(75)
      expect(stats.pendingSubmissions).toBe(1)
      expect(stats.overdueAssignments).toBe(1)
    })
  })

  describe('getProfessorCourseStats', () => {
    it('returns zeroes for an empty list of courses', () => {
      const stats = getProfessorCourseStats([])
      expect(stats).toEqual({
        courseCount: 0,
        studentCount: 0,
        assignmentCount: 0,
        groupCount: 0,
      })
    })

    it('accurately sums metrics across multiple courses', () => {
      const mockCourses: ProfessorCourse[] = [
        {
          id: 'c1',
          code: 'WEB101',
          name: 'Web Dev',
          description: 'Frontend & backend',
          semester: 'Autumn 2026',
          professorId: 'p1',
          joinCode: 'WEB-4K7P',
          createdAt: new Date().toISOString(),
          studentCount: 5,
          assignmentCount: 3,
          groupCount: 2,
        },
        {
          id: 'c2',
          code: 'HCI210',
          name: 'HCI',
          description: 'Human-Computer Interaction',
          semester: 'Autumn 2026',
          professorId: 'p1',
          joinCode: 'HCI-9M2X',
          createdAt: new Date().toISOString(),
          studentCount: 4,
          assignmentCount: 2,
          groupCount: 1,
        },
      ]

      const stats = getProfessorCourseStats(mockCourses)
      expect(stats).toEqual({
        courseCount: 2,
        studentCount: 9,
        assignmentCount: 5,
        groupCount: 3,
      })
    })
  })

  describe('getStudentCourseStats', () => {
    it('returns zeroes for an empty list of student courses', () => {
      const stats = getStudentCourseStats([])
      expect(stats).toEqual({
        courseCount: 0,
        assignmentCount: 0,
        completedCount: 0,
        overdueCount: 0,
      })
    })

    it('accurately sums metrics across multiple student courses', () => {
      const mockStudentCourses: StudentCourse[] = [
        {
          id: 'c1',
          code: 'WEB101',
          name: 'Web Dev',
          description: 'Frontend & backend',
          semester: 'Autumn 2026',
          professorId: 'p1',
          professorName: 'Prof. Ada Lovelace',
          joinCode: 'WEB-4K7P',
          createdAt: new Date().toISOString(),
          enrolledAt: new Date().toISOString(),
          assignmentCount: 3,
          acknowledgedCount: 2,
          overdueCount: 1,
          dueSoonCount: 0,
          myGroup: { id: 'g1', name: 'Alpha', role: 'leader' },
        },
        {
          id: 'c2',
          code: 'HCI210',
          name: 'HCI',
          description: 'Design course',
          semester: 'Autumn 2026',
          professorId: 'p2',
          professorName: 'Prof. Alan Turing',
          joinCode: 'HCI-9M2X',
          createdAt: new Date().toISOString(),
          enrolledAt: new Date().toISOString(),
          assignmentCount: 2,
          acknowledgedCount: 2,
          overdueCount: 0,
          dueSoonCount: 1,
          myGroup: null,
        },
      ]

      const stats = getStudentCourseStats(mockStudentCourses)
      expect(stats).toEqual({
        courseCount: 2,
        assignmentCount: 5,
        completedCount: 4,
        overdueCount: 1,
      })
    })
  })
})
