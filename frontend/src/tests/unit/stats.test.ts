import { describe, it, expect } from 'vitest'
import {
  getProfessorCourseStats,
  getStudentCourseStats,
  getCourseAssignmentStats,
} from '@/utils/stats'
import type {
  ProfessorCourse,
  StudentCourse,
  ProfessorCourseAssignment,
} from '@/types'

describe('Unit: Stats Calculation Helpers', () => {
  const fixedNow = new Date(2026, 10, 5, 12, 0, 0)

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

  describe('getCourseAssignmentStats', () => {
    it('returns zeroes for an empty list of assignments', () => {
      const stats = getCourseAssignmentStats([], fixedNow)
      expect(stats).toEqual({
        assignmentCount: 0,
        overdueCount: 0,
        averageCompletion: 0,
      })
    })

    it('computes assignment count, overdue count, and average completion across individual and group assignments', () => {
      const mockItems: ProfessorCourseAssignment[] = [
        {
          assignment: {
            id: 'asg-1',
            courseId: 'course-1',
            submissionType: 'individual',
            audience: 'all',
            title: 'Individual Task',
            description: '',
            dueDate: new Date(2026, 10, 1).toISOString(), // overdue relative to fixedNow (Nov 5)
            oneDriveLink: 'https://1drv.ms/test1',
            createdBy: 'p1',
            assignedTo: ['s1', 's2'],
            createdAt: new Date(2026, 9, 20).toISOString(),
            updatedAt: new Date(2026, 9, 20).toISOString(),
          },
          tracking: {
            kind: 'individual',
            total: 2,
            submitted: 1, // 1 pending -> overdue
            entries: [],
          },
        },
        {
          assignment: {
            id: 'asg-2',
            courseId: 'course-1',
            submissionType: 'group',
            audience: 'all',
            title: 'Group Task',
            description: '',
            dueDate: new Date(2026, 10, 2).toISOString(), // overdue relative to fixedNow
            oneDriveLink: 'https://1drv.ms/test2',
            createdBy: 'p1',
            assignedTo: ['s1', 's2'],
            createdAt: new Date(2026, 9, 20).toISOString(),
            updatedAt: new Date(2026, 9, 20).toISOString(),
          },
          tracking: {
            kind: 'group',
            total: 2,
            submitted: 2, // 100% complete -> NOT overdue even though deadline passed
            entries: [],
            ungroupedStudents: [],
          },
        },
        {
          assignment: {
            id: 'asg-3',
            courseId: 'course-1',
            submissionType: 'individual',
            audience: 'selected',
            title: 'Future Selected Task',
            description: '',
            dueDate: new Date(2026, 10, 20).toISOString(), // future relative to fixedNow
            oneDriveLink: 'https://1drv.ms/test3',
            createdBy: 'p1',
            assignedTo: ['s1'],
            createdAt: new Date(2026, 9, 20).toISOString(),
            updatedAt: new Date(2026, 9, 20).toISOString(),
          },
          tracking: {
            kind: 'individual',
            total: 1,
            submitted: 0, // 0%
            entries: [],
          },
        },
      ]

      // asg-1: 1 of 2 = 50%
      // asg-2: 2 of 2 = 100%
      // asg-3: 0 of 1 = 0%
      // avg: (50 + 100 + 0) / 3 = 50%
      // overdue: 1 (asg-1 has deadline passed and 1 pending; asg-2 has deadline passed but 0 pending)
      const stats = getCourseAssignmentStats(mockItems, fixedNow)
      expect(stats.assignmentCount).toBe(3)
      expect(stats.overdueCount).toBe(1)
      expect(stats.averageCompletion).toBe(50)
    })
  })
})
