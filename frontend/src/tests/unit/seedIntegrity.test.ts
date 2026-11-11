import { describe, it, expect } from 'vitest'
import { generateSeedData } from '@/data/seed'

describe('Unit: Seed Data Integrity', () => {
  const seed = generateSeedData()

  it('every course references a valid professor account', () => {
    expect(seed.courses.length).toBeGreaterThanOrEqual(4)
    for (const course of seed.courses) {
      const prof = seed.users.find((u) => u.id === course.professorId)
      expect(prof).toBeDefined()
      expect(prof?.role).toBe('admin')
    }
  })

  it('every enrollment references a real course and a real student', () => {
    expect(seed.enrollments.length).toBeGreaterThan(0)
    for (const enrollment of seed.enrollments) {
      const course = seed.courses.find((c) => c.id === enrollment.courseId)
      const student = seed.users.find((u) => u.id === enrollment.studentId)
      expect(course).toBeDefined()
      expect(student).toBeDefined()
      expect(student?.role).toBe('student')
    }
  })

  it('every group has its leader included in memberIds', () => {
    expect(seed.groups.length).toBeGreaterThan(0)
    for (const group of seed.groups) {
      expect(group.memberIds).toContain(group.leaderId)
    }
  })

  it('all members of a group are enrolled in that group’s course', () => {
    for (const group of seed.groups) {
      const courseEnrollments = seed.enrollments.filter(
        (e) => e.courseId === group.courseId,
      )
      const enrolledStudentIds = courseEnrollments.map((e) => e.studentId)

      for (const memberId of group.memberIds) {
        expect(enrolledStudentIds).toContain(memberId)
      }
    }
  })

  it('no student is in two groups for the same course', () => {
    for (const course of seed.courses) {
      const courseGroups = seed.groups.filter((g) => g.courseId === course.id)
      const seenStudents = new Set<string>()

      for (const group of courseGroups) {
        for (const memberId of group.memberIds) {
          expect(seenStudents.has(memberId)).toBe(false)
          seenStudents.add(memberId)
        }
      }
    }
  })

  it('every assignment has a valid courseId and createdBy matches the course professor', () => {
    expect(seed.assignments.length).toBe(12)
    for (const assignment of seed.assignments) {
      const course = seed.courses.find((c) => c.id === assignment.courseId)
      expect(course).toBeDefined()
      expect(assignment.createdBy).toBe(course?.professorId)
    }
  })

  it('individual assignments have a Submission for every enrolled student, group assignments have none', () => {
    const individualAsgs = seed.assignments.filter((a) => a.submissionType === 'individual')
    const groupAsgs = seed.assignments.filter((a) => a.submissionType === 'group')

    expect(individualAsgs.length).toBeGreaterThan(0)
    expect(groupAsgs.length).toBeGreaterThanOrEqual(5)

    // Individual assignments check
    for (const asg of individualAsgs) {
      const asgSubmissions = seed.submissions.filter((s) => s.assignmentId === asg.id)
      expect(asgSubmissions.length).toBe(asg.assignedTo.length)

      for (const studentId of asg.assignedTo) {
        const sub = asgSubmissions.find((s) => s.studentId === studentId)
        expect(sub).toBeDefined()
      }
    }

    // Group assignments check: MUST have 0 per-student submissions
    for (const asg of groupAsgs) {
      const asgSubmissions = seed.submissions.filter((s) => s.assignmentId === asg.id)
      expect(asgSubmissions.length).toBe(0)
    }
  })

  it('every GroupAcknowledgement references a real group and assignment, and leaderId matches', () => {
    expect(seed.groupAcks.length).toBeGreaterThanOrEqual(1)
    for (const ack of seed.groupAcks) {
      const group = seed.groups.find((g) => g.id === ack.groupId)
      const asg = seed.assignments.find((a) => a.id === ack.assignmentId)

      expect(group).toBeDefined()
      expect(asg).toBeDefined()
      expect(asg?.submissionType).toBe('group')
      expect(ack.leaderId).toBe(group?.leaderId)
    }
  })

  it('course joinCodes are unique and uppercase', () => {
    const codes = seed.courses.map((c) => c.joinCode)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)

    for (const code of codes) {
      expect(code).toBe(code.toUpperCase())
    }
  })

  it('the seed contains at least 3 overdue and at least 3 due-soon assignments', () => {
    const now = Date.now()
    let overdueCount = 0
    let dueSoonCount = 0

    for (const asg of seed.assignments) {
      const dueTime = new Date(asg.dueDate).getTime()
      const diffDays = (dueTime - now) / 86400000

      if (diffDays < 0) {
        overdueCount++
      } else if (diffDays <= 3.5) {
        dueSoonCount++
      }
    }

    expect(overdueCount).toBeGreaterThanOrEqual(3)
    expect(dueSoonCount).toBeGreaterThanOrEqual(3)
  })
})
