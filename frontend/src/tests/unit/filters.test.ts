import { describe, it, expect } from 'vitest'
import {
  searchMatches,
  matchesDueFilter,
  matchesStudentStatus,
  matchesAdminCompletion,
  sortAssignments,
  applyStudentAssignmentFilters,
  applyAdminAssignmentFilters,
} from '@/utils/filters'
import type { AdminAssignment, StudentAssignment } from '@/types'

describe('utils/filters', () => {
  const fixedNow = new Date('2026-11-04T12:00:00.000Z')

  describe('searchMatches', () => {
    const item = {
      title: 'Full Stack React Application',
      description: 'Build components with Tailwind CSS and TypeScript',
    }

    it('matches case-insensitively on title', () => {
      expect(searchMatches(item, 'react')).toBe(true)
      expect(searchMatches(item, 'FULL STACK')).toBe(true)
    })

    it('matches case-insensitively on description', () => {
      expect(searchMatches(item, 'tailwind')).toBe(true)
      expect(searchMatches(item, 'typescript')).toBe(true)
    })

    it('trims leading and trailing whitespace', () => {
      expect(searchMatches(item, '  react  ')).toBe(true)
    })

    it('returns false when no match', () => {
      expect(searchMatches(item, 'Python')).toBe(false)
    })

    it('matches all if query is empty or undefined', () => {
      expect(searchMatches(item, '')).toBe(true)
      expect(searchMatches(item, undefined)).toBe(true)
    })
  })

  describe('matchesDueFilter', () => {
    const overdue = '2026-11-01T00:00:00.000Z'
    const today = '2026-11-04T15:00:00.000Z'
    const thisWeek = '2026-11-08T00:00:00.000Z'
    const later = '2026-11-25T00:00:00.000Z'

    it('matches all due filter', () => {
      expect(matchesDueFilter(overdue, 'all', fixedNow)).toBe(true)
      expect(matchesDueFilter(later, 'all', fixedNow)).toBe(true)
    })

    it('matches overdue filter', () => {
      expect(matchesDueFilter(overdue, 'overdue', fixedNow)).toBe(true)
      expect(matchesDueFilter(today, 'overdue', fixedNow)).toBe(false)
    })

    it('matches today filter', () => {
      expect(matchesDueFilter(today, 'today', fixedNow)).toBe(true)
      expect(matchesDueFilter(overdue, 'today', fixedNow)).toBe(false)
    })

    it('matches week filter', () => {
      expect(matchesDueFilter(thisWeek, 'week', fixedNow)).toBe(true)
      expect(matchesDueFilter(later, 'week', fixedNow)).toBe(false)
    })

    it('matches later filter', () => {
      expect(matchesDueFilter(later, 'later', fixedNow)).toBe(true)
      expect(matchesDueFilter(thisWeek, 'later', fixedNow)).toBe(false)
    })
  })

  describe('matchesStudentStatus', () => {
    const todoAsg: StudentAssignment = {
      id: '1',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'A1',
      description: '',
      dueDate: '',
      oneDriveLink: '',
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      assignedTo: 'all',
      status: 'not_submitted',
      submittedAt: null,
    }
    const doneAsg: StudentAssignment = {
      ...todoAsg,
      id: '2',
      status: 'submitted',
      submittedAt: '2026-11-04T10:00:00Z',
    }

    it('filters todo vs submitted correctly', () => {
      expect(matchesStudentStatus(todoAsg, 'all')).toBe(true)
      expect(matchesStudentStatus(todoAsg, 'todo')).toBe(true)
      expect(matchesStudentStatus(todoAsg, 'submitted')).toBe(false)

      expect(matchesStudentStatus(doneAsg, 'all')).toBe(true)
      expect(matchesStudentStatus(doneAsg, 'todo')).toBe(false)
      expect(matchesStudentStatus(doneAsg, 'submitted')).toBe(true)
    })
  })

  describe('matchesAdminCompletion', () => {
    const completeAsg: AdminAssignment = {
      id: '1',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'Complete',
      description: '',
      dueDate: '',
      oneDriveLink: '',
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      assignedTo: ['s1'],
      totalCount: 2,
      submittedCount: 2,
      submissions: [],
    }
    const incompleteAsg: AdminAssignment = {
      ...completeAsg,
      id: '2',
      totalCount: 3,
      submittedCount: 1,
    }
    const nobodyAsg: AdminAssignment = {
      ...completeAsg,
      id: '3',
      totalCount: 3,
      submittedCount: 0,
    }

    it('filters completion categories correctly', () => {
      expect(matchesAdminCompletion(completeAsg, 'complete')).toBe(true)
      expect(matchesAdminCompletion(completeAsg, 'incomplete')).toBe(false)

      expect(matchesAdminCompletion(incompleteAsg, 'incomplete')).toBe(true)
      expect(matchesAdminCompletion(incompleteAsg, 'complete')).toBe(false)

      expect(matchesAdminCompletion(nobodyAsg, 'nobody')).toBe(true)
      expect(matchesAdminCompletion(incompleteAsg, 'nobody')).toBe(false)
    })
  })

  describe('sortAssignments', () => {
    const list = [
      { id: '1', title: 'Gamma', description: '', dueDate: '2026-11-10T00:00:00Z', createdAt: '2026-11-01T00:00:00Z' },
      { id: '2', title: 'Alpha', description: '', dueDate: '2026-11-05T00:00:00Z', createdAt: '2026-11-03T00:00:00Z' },
      { id: '3', title: 'Beta', description: '', dueDate: '2026-11-08T00:00:00Z', createdAt: '2026-11-02T00:00:00Z' },
    ]

    it('sorts by due_asc', () => {
      const sorted = sortAssignments(list, 'due_asc')
      expect(sorted.map((i) => i.id)).toEqual(['2', '3', '1'])
    })

    it('sorts by due_desc', () => {
      const sorted = sortAssignments(list, 'due_desc')
      expect(sorted.map((i) => i.id)).toEqual(['1', '3', '2'])
    })

    it('sorts by newest', () => {
      const sorted = sortAssignments(list, 'newest')
      expect(sorted.map((i) => i.id)).toEqual(['2', '3', '1'])
    })

    it('sorts by title_asc', () => {
      const sorted = sortAssignments(list, 'title_asc')
      expect(sorted.map((i) => i.id)).toEqual(['2', '3', '1'])
    })

    it('maintains stable ordering for identical keys', () => {
      const duplicates = [
        { id: 'a', title: 'Same', description: '', dueDate: '2026-11-05T00:00:00Z', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'b', title: 'Same', description: '', dueDate: '2026-11-05T00:00:00Z', createdAt: '2026-11-01T00:00:00Z' },
      ]
      const sorted = sortAssignments(duplicates, 'title_asc')
      expect(sorted[0].id).toBe('a')
      expect(sorted[1].id).toBe('b')
    })
  })

  describe('composite filters', () => {
    const studentList: StudentAssignment[] = [
      {
        id: '1',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'React Fundamentals',
        description: 'Components and hooks',
        dueDate: '2026-11-01T00:00:00Z',
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '',
        assignedTo: 'all',
        status: 'not_submitted',
        submittedAt: null,
      },
      {
        id: '2',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'React Advanced Patterns',
        description: 'Compound components',
        dueDate: '2026-11-06T00:00:00Z',
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '',
        assignedTo: 'all',
        status: 'submitted',
        submittedAt: '2026-11-03T10:00:00Z',
      },
      {
        id: '3',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Node Backend',
        description: 'Express APIs',
        dueDate: '2026-11-08T00:00:00Z',
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-10-27T00:00:00Z',
        updatedAt: '',
        assignedTo: 'all',
        status: 'not_submitted',
        submittedAt: null,
      },
    ]

    it('combines query, status, and due filters', () => {
      const res = applyStudentAssignmentFilters(
        studentList,
        {
          query: 'React',
          status: 'todo',
          due: 'overdue',
        },
        fixedNow,
      )
      expect(res.length).toBe(1)
      expect(res[0].id).toBe('1')
    })
  })
})
