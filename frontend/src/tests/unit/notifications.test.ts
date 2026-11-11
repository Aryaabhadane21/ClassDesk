import { describe, it, expect } from 'vitest'
import {
  deriveStudentNotifications,
  deriveAdminNotifications,
  formatRelativeTime,
} from '@/utils/notifications'
import type { StudentAssignment, AdminAssignment } from '@/types'

describe('utils/notifications', () => {
  const fixedNow = new Date('2026-11-04T12:00:00.000Z')

  it('formats relative time for past and future correctly', () => {
    expect(formatRelativeTime('2026-11-04T11:59:30.000Z', fixedNow)).toBe('just now')
    expect(formatRelativeTime('2026-11-04T10:00:00.000Z', fixedNow)).toBe('2h ago')
    expect(formatRelativeTime('2026-11-03T12:00:00.000Z', fixedNow)).toBe('yesterday')
    expect(formatRelativeTime('2026-11-05T12:00:00.000Z', fixedNow)).toBe('tomorrow')
    expect(formatRelativeTime('2026-11-07T12:00:00.000Z', fixedNow)).toBe('in 3 days')
  })

  it('derives student notifications with deterministic IDs and ignores submitted ones for due_soon/overdue', () => {
    const assignments: StudentAssignment[] = [
      {
        id: 'asg-overdue',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Overdue Project',
        description: '',
        dueDate: '2026-11-01T00:00:00.000Z', // past due
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-10-20T00:00:00.000Z',
        updatedAt: '',
        assignedTo: 'all',
        status: 'not_submitted',
        submittedAt: null,
      },
      {
        id: 'asg-due-soon',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Due Soon Quiz',
        description: '',
        dueDate: '2026-11-06T00:00:00.000Z', // in 2 days
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-11-03T00:00:00.000Z', // recent
        updatedAt: '',
        assignedTo: 'all',
        status: 'not_submitted',
        submittedAt: null,
      },
      {
        id: 'asg-done',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Finished Project',
        description: '',
        dueDate: '2026-11-01T00:00:00.000Z', // past due but submitted
        oneDriveLink: '',
        createdBy: '',
        createdAt: '2026-10-20T00:00:00.000Z',
        updatedAt: '',
        assignedTo: 'all',
        status: 'submitted',
        submittedAt: '2026-11-01T00:00:00.000Z',
      },
    ]

    const notifications = deriveStudentNotifications(assignments, [], fixedNow)

    // asg-done must NOT produce overdue or due_soon
    expect(notifications.some((n) => n.assignmentId === 'asg-done')).toBe(false)

    // asg-overdue has overdue ID
    const overdueNote = notifications.find((n) => n.id === 'overdue:asg-overdue')
    expect(overdueNote).toBeDefined()
    expect(overdueNote?.type).toBe('overdue')

    // asg-due-soon has due_soon ID and assigned ID (created Nov 3)
    const dueSoonNote = notifications.find((n) => n.id === 'due_soon:asg-due-soon')
    expect(dueSoonNote).toBeDefined()
    expect(dueSoonNote?.type).toBe('due_soon')
  })

  it('derives admin notifications for overdue incomplete assignments and recent submissions', () => {
    const assignments: AdminAssignment[] = [
      {
        id: 'asg-admin-1',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Project 1',
        description: '',
        dueDate: '2026-11-01T00:00:00.000Z', // past due
        oneDriveLink: '',
        createdBy: '',
        createdAt: '',
        updatedAt: '',
        assignedTo: ['s1', 's2'],
        totalCount: 2,
        submittedCount: 1, // 1 pending
        submissions: [
          {
            id: 'sub-1',
            assignmentId: 'asg-admin-1',
            studentId: 's1',
            status: 'submitted',
            submittedAt: '2026-11-03T10:00:00.000Z', // recent
            updatedAt: '',
            student: { id: 's1', name: 'Aarav Sharma', email: '', role: 'student' },
          },
          {
            id: 'sub-2',
            assignmentId: 'asg-admin-1',
            studentId: 's2',
            status: 'pending',
            submittedAt: null,
            updatedAt: '',
            student: { id: 's2', name: 'Diya Patel', email: '', role: 'student' },
          },
        ],
      },
    ]

    const notifications = deriveAdminNotifications(assignments, [], fixedNow)

    // Overdue note
    const overdue = notifications.find((n) => n.id === 'overdue:asg-admin-1')
    expect(overdue).toBeDefined()
    expect(overdue?.message).toContain('is overdue, 1 student has not submitted')

    // Submitted note
    const submitted = notifications.find((n) => n.id === 'submitted:asg-admin-1:s1')
    expect(submitted).toBeDefined()
    expect(submitted?.message).toContain('Aarav Sharma submitted "Project 1"')
  })
})
