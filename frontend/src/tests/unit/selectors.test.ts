import { describe, it, expect } from 'vitest'
import { getCompletion, sortSubmissionsForReview } from '@/utils/selectors'
import type { AdminAssignment, SubmissionWithStudent } from '@/types'

describe('utils/selectors', () => {
  it('calculates completion metrics including late counting', () => {
    const asg: AdminAssignment = {
      id: 'asg-1',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'Metrics Test',
      description: '',
      dueDate: '2026-11-05T12:00:00.000Z',
      oneDriveLink: '',
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      assignedTo: ['s1', 's2', 's3', 's4'],
      totalCount: 4,
      submittedCount: 2,
      submissions: [
        {
          id: 'sub-1',
          assignmentId: 'asg-1',
          studentId: 's1',
          status: 'submitted',
          submittedAt: '2026-11-04T10:00:00.000Z', // on time
          updatedAt: '',
          student: { id: 's1', name: 'Aarav', email: '', role: 'student' },
        },
        {
          id: 'sub-2',
          assignmentId: 'asg-1',
          studentId: 's2',
          status: 'submitted',
          submittedAt: '2026-11-05T16:00:00.000Z', // late
          updatedAt: '',
          student: { id: 's2', name: 'Diya', email: '', role: 'student' },
        },
        {
          id: 'sub-3',
          assignmentId: 'asg-1',
          studentId: 's3',
          status: 'pending',
          submittedAt: null,
          updatedAt: '',
          student: { id: 's3', name: 'Rohan', email: '', role: 'student' },
        },
        {
          id: 'sub-4',
          assignmentId: 'asg-1',
          studentId: 's4',
          status: 'pending',
          submittedAt: null,
          updatedAt: '',
          student: { id: 's4', name: 'Ishita', email: '', role: 'student' },
        },
      ],
    }

    const res = getCompletion(asg)
    expect(res.submitted).toBe(2)
    expect(res.total).toBe(4)
    expect(res.remaining).toBe(2)
    expect(res.percent).toBe(50)
    expect(res.late).toBe(1)
  })

  it('handles total = 0 gracefully', () => {
    const emptyAsg: AdminAssignment = {
      id: 'asg-empty',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'Empty',
      description: '',
      dueDate: '2026-11-05T12:00:00.000Z',
      oneDriveLink: '',
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      assignedTo: [],
      totalCount: 0,
      submittedCount: 0,
      submissions: [],
    }

    const res = getCompletion(emptyAsg)
    expect(res.submitted).toBe(0)
    expect(res.total).toBe(0)
    expect(res.remaining).toBe(0)
    expect(res.percent).toBe(0)
    expect(res.late).toBe(0)
  })

  it('sorts submissions for review: pending first (alphabetical), then submitted (recency)', () => {
    const submissions: SubmissionWithStudent[] = [
      {
        id: '1',
        assignmentId: 'a',
        studentId: 's1',
        status: 'submitted',
        submittedAt: '2026-11-02T10:00:00Z',
        updatedAt: '',
        student: { id: 's1', name: 'Zack', email: '', role: 'student' },
      },
      {
        id: '2',
        assignmentId: 'a',
        studentId: 's2',
        status: 'pending',
        submittedAt: null,
        updatedAt: '',
        student: { id: 's2', name: 'Bob', email: '', role: 'student' },
      },
      {
        id: '3',
        assignmentId: 'a',
        studentId: 's3',
        status: 'submitted',
        submittedAt: '2026-11-04T10:00:00Z',
        updatedAt: '',
        student: { id: 's3', name: 'Alice', email: '', role: 'student' },
      },
      {
        id: '4',
        assignmentId: 'a',
        studentId: 's4',
        status: 'pending',
        submittedAt: null,
        updatedAt: '',
        student: { id: 's4', name: 'Adam', email: '', role: 'student' },
      },
    ]

    const sorted = sortSubmissionsForReview(submissions)
    // Pending first alphabetically: Adam, Bob
    expect(sorted[0].student.name).toBe('Adam')
    expect(sorted[1].student.name).toBe('Bob')
    // Submitted most recent first: Alice (Nov 4), Zack (Nov 2)
    expect(sorted[2].student.name).toBe('Alice')
    expect(sorted[3].student.name).toBe('Zack')
  })
})
