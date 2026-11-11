import { describe, it, expect } from 'vitest'
import { validateCourse } from '@/utils/validation'

describe('Unit: validateCourse', () => {
  it('passes for complete valid course input with default semester', () => {
    const errors = validateCourse({
      code: 'WEB101',
      name: 'Web Development',
      description: 'Foundations of HTML, CSS, JavaScript and React.',
    })

    expect(errors).toEqual({})
  })

  it('passes for valid custom semester and dashed code', () => {
    const errors = validateCourse({
      code: 'CS-50',
      name: 'Intro to Computer Science',
      description: 'An introduction to computer science and programming.',
      semester: 'Spring 2027',
    })

    expect(errors).toEqual({})
  })

  describe('Course Code validation', () => {
    it('requires course code', () => {
      const errors = validateCourse({
        code: '',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errors.code).toBe('Course code is required')
    })

    it('rejects codes shorter than 3 characters', () => {
      const errors = validateCourse({
        code: 'CS',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errors.code).toBe('Course code must be 3-12 letters, digits or dashes')
    })

    it('rejects codes longer than 12 characters', () => {
      const errors = validateCourse({
        code: 'COMPUTER-SCI-101',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errors.code).toBe('Course code must be 3-12 letters, digits or dashes')
    })

    it('rejects codes with invalid characters (spaces, underscores, symbols)', () => {
      const errorSpaces = validateCourse({
        code: 'WEB 101',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errorSpaces.code).toBe('Course code must be 3-12 letters, digits or dashes')

      const errorUnderscore = validateCourse({
        code: 'WEB_101',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errorUnderscore.code).toBe('Course code must be 3-12 letters, digits or dashes')

      const errorSymbols = validateCourse({
        code: 'WEB@101',
        name: 'Web Development',
        description: 'Valid description',
      })
      expect(errorSymbols.code).toBe('Course code must be 3-12 letters, digits or dashes')
    })
  })

  describe('Course Name validation', () => {
    it('requires course name', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: '  ',
        description: 'Valid description',
      })
      expect(errors.name).toBe('Course name is required')
    })

    it('rejects names shorter than 3 characters', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'AB',
        description: 'Valid description',
      })
      expect(errors.name).toBe('Course name must be between 3 and 80 characters')
    })

    it('rejects names longer than 80 characters', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'A'.repeat(81),
        description: 'Valid description',
      })
      expect(errors.name).toBe('Course name must be between 3 and 80 characters')
    })
  })

  describe('Description validation', () => {
    it('requires course description', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'Web Development',
        description: '',
      })
      expect(errors.description).toBe('Description is required')
    })

    it('rejects descriptions exceeding 300 characters', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'Web Development',
        description: 'x'.repeat(301),
      })
      expect(errors.description).toBe('Description must not exceed 300 characters')
    })

    it('accepts descriptions up to 300 characters', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'Web Development',
        description: 'x'.repeat(300),
      })
      expect(errors.description).toBeUndefined()
    })
  })

  describe('Semester validation', () => {
    it('rejects empty semester when provided', () => {
      const errors = validateCourse({
        code: 'WEB101',
        name: 'Web Development',
        description: 'Valid description',
        semester: '   ',
      })
      expect(errors.semester).toBe('Semester is required')
    })
  })
})
