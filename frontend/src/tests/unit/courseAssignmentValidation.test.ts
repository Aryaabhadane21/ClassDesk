import { describe, it, expect } from 'vitest'
import { validateCourseAssignment } from '@/utils/validation'
import type { CourseAssignmentInput } from '@/types'

describe('Unit: validateCourseAssignment', () => {
  const defaultOptions = {
    enrolledStudentIds: ['s1', 's2', 's3'],
  }

  const validIndividualInput: CourseAssignmentInput = {
    title: 'Valid Assignment Title',
    description: 'A valid description of the assignment tasks and goals.',
    dueDate: '2026-11-20T23:59:00.000Z',
    oneDriveLink: 'https://1drv.ms/f/s!sample',
    submissionType: 'individual',
    assignedTo: 'all',
  }

  it('passes for valid individual assignment with assignedTo all', () => {
    const errors = validateCourseAssignment(validIndividualInput, defaultOptions)
    expect(errors).toEqual({})
  })

  it('passes for valid individual assignment with assignedTo all even if zero students enrolled', () => {
    const errors = validateCourseAssignment(validIndividualInput, { enrolledStudentIds: [] })
    expect(errors).toEqual({})
  })

  it('passes for valid individual assignment with valid selected students', () => {
    const errors = validateCourseAssignment(
      { ...validIndividualInput, assignedTo: ['s1', 's2'] },
      defaultOptions,
    )
    expect(errors).toEqual({})
  })

  it('passes for valid group assignment with assignedTo all', () => {
    const errors = validateCourseAssignment(
      {
        ...validIndividualInput,
        submissionType: 'group',
        assignedTo: 'all',
      },
      defaultOptions,
    )
    expect(errors).toEqual({})
  })

  it('rejects title shorter than 3 or longer than 80 chars, or empty', () => {
    expect(
      validateCourseAssignment({ ...validIndividualInput, title: '' }, defaultOptions).title,
    ).toBe('Title is required')

    expect(
      validateCourseAssignment({ ...validIndividualInput, title: 'ab' }, defaultOptions).title,
    ).toBe('Title must be between 3 and 80 characters')

    expect(
      validateCourseAssignment({ ...validIndividualInput, title: 'a'.repeat(81) }, defaultOptions).title,
    ).toBe('Title must be between 3 and 80 characters')
  })

  it('rejects description if empty or exceeding 500 characters', () => {
    expect(
      validateCourseAssignment({ ...validIndividualInput, description: '' }, defaultOptions).description,
    ).toBe('Description is required')

    expect(
      validateCourseAssignment({ ...validIndividualInput, description: 'a'.repeat(501) }, defaultOptions).description,
    ).toBe('Description must not exceed 500 characters')
  })

  it('rejects invalid or missing dueDate', () => {
    expect(
      validateCourseAssignment({ ...validIndividualInput, dueDate: '' }, defaultOptions).dueDate,
    ).toBe('Due date is required')

    expect(
      validateCourseAssignment({ ...validIndividualInput, dueDate: 'invalid-date' }, defaultOptions).dueDate,
    ).toBe('Due date must be a valid date and time')
  })

  it('rejects invalid or missing oneDriveLink', () => {
    expect(
      validateCourseAssignment({ ...validIndividualInput, oneDriveLink: '' }, defaultOptions).oneDriveLink,
    ).toBe('OneDrive link is required')

    expect(
      validateCourseAssignment({ ...validIndividualInput, oneDriveLink: 'not-a-url' }, defaultOptions).oneDriveLink,
    ).toBe('OneDrive link must be a valid http or https URL')

    expect(
      validateCourseAssignment({ ...validIndividualInput, oneDriveLink: 'ftp://server.com' }, defaultOptions).oneDriveLink,
    ).toBe('OneDrive link must be a valid http or https URL')
  })

  it('rejects invalid submissionType', () => {
    expect(
      validateCourseAssignment(
        { ...validIndividualInput, submissionType: 'something-else' as any },
        defaultOptions,
      ).submissionType,
    ).toBe('Submission type must be individual or group')
  })

  it('rejects group assignment if a list of student IDs is provided', () => {
    const errors = validateCourseAssignment(
      {
        ...validIndividualInput,
        submissionType: 'group',
        assignedTo: ['s1'],
      },
      defaultOptions,
    )
    expect(errors.assignedTo).toBe('Group assignments go to every group in the course')
  })

  it('rejects individual assignment if selected list is empty or contains unenrolled students', () => {
    expect(
      validateCourseAssignment(
        { ...validIndividualInput, submissionType: 'individual', assignedTo: [] },
        defaultOptions,
      ).assignedTo,
    ).toBe('Select at least one student')

    expect(
      validateCourseAssignment(
        { ...validIndividualInput, submissionType: 'individual', assignedTo: ['s1', 's999'] },
        defaultOptions,
      ).assignedTo,
    ).toBe('Some selected students are not enrolled in this course')
  })
})
