import type {
  ProfessorCourse,
  StudentCourse,
  ProfessorCourseAssignment,
} from '@/types'
import { getDueInfo } from '@/utils/dates'

export interface ProfessorCourseStats {
  courseCount: number
  studentCount: number
  assignmentCount: number
  groupCount: number
}

/**
 * Computes overview metrics across all courses taught by a professor.
 */
export function getProfessorCourseStats(courses: ProfessorCourse[]): ProfessorCourseStats {
  return {
    courseCount: courses.length,
    studentCount: courses.reduce((acc, c) => acc + (c.studentCount || 0), 0),
    assignmentCount: courses.reduce((acc, c) => acc + (c.assignmentCount || 0), 0),
    groupCount: courses.reduce((acc, c) => acc + (c.groupCount || 0), 0),
  }
}

export interface StudentCourseStats {
  courseCount: number
  assignmentCount: number
  completedCount: number
  overdueCount: number
}

/**
 * Computes overview metrics across all courses enrolled by a student.
 */
export function getStudentCourseStats(courses: StudentCourse[]): StudentCourseStats {
  return {
    courseCount: courses.length,
    assignmentCount: courses.reduce((acc, c) => acc + (c.assignmentCount || 0), 0),
    completedCount: courses.reduce((acc, c) => acc + (c.acknowledgedCount || 0), 0),
    overdueCount: courses.reduce((acc, c) => acc + (c.overdueCount || 0), 0),
  }
}

export interface CourseAssignmentStats {
  assignmentCount: number
  overdueCount: number
  averageCompletion: number
}

/**
 * Computes assignment metrics for a professor's course view:
 * - assignmentCount: total assignments in the course
 * - overdueCount: assignments with past deadline and pending submissions or unacknowledged groups
 * - averageCompletion: average percentage of submissions/acknowledgements across assignments (0-100)
 */
export function getCourseAssignmentStats(
  assignments: ProfessorCourseAssignment[],
  now: Date = new Date(),
): CourseAssignmentStats {
  const assignmentCount = assignments.length
  if (assignmentCount === 0) {
    return {
      assignmentCount: 0,
      overdueCount: 0,
      averageCompletion: 0,
    }
  }

  let totalPercent = 0
  let overdueCount = 0

  for (const item of assignments) {
    const { submitted, total } = item.tracking
    const remaining = Math.max(0, total - submitted)
    const percent = total > 0 ? (submitted / total) * 100 : 0
    totalPercent += percent

    const dueInfo = getDueInfo(item.assignment.dueDate, now)
    if (dueInfo.state === 'overdue' && remaining > 0) {
      overdueCount += 1
    }
  }

  const averageCompletion = Math.round(totalPercent / assignmentCount)

  return {
    assignmentCount,
    overdueCount,
    averageCompletion,
  }
}
