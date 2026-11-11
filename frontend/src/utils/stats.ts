import type { StudentAssignment, AdminAssignment, ProfessorCourse, StudentCourse } from '@/types'
import { getDueInfo } from '@/utils/dates'
import { getCompletion } from '@/utils/selectors'

export interface StudentStats {
  dueToday: number
  overdue: number
  submitted: number
  completionPercent: number
  total: number
}

export function getStudentStats(
  assignments: StudentAssignment[],
  now: Date = new Date(),
): StudentStats {
  const total = assignments.length
  let dueToday = 0
  let overdue = 0
  let submitted = 0

  for (const a of assignments) {
    if (a.status === 'submitted') {
      submitted++
    } else {
      const dueInfo = getDueInfo(a.dueDate, now)
      if (dueInfo.state === 'overdue') {
        overdue++
      } else if (dueInfo.state === 'due_today') {
        dueToday++
      }
    }
  }

  const completionPercent = total > 0 ? Math.round((submitted / total) * 100) : 0

  return {
    dueToday,
    overdue,
    submitted,
    completionPercent,
    total,
  }
}

export interface AdminStats {
  totalAssignments: number
  averageCompletion: number
  pendingSubmissions: number
  overdueAssignments: number
}

export function getAdminStats(
  assignments: AdminAssignment[],
  now: Date = new Date(),
): AdminStats {
  const totalAssignments = assignments.length
  if (totalAssignments === 0) {
    return {
      totalAssignments: 0,
      averageCompletion: 0,
      pendingSubmissions: 0,
      overdueAssignments: 0,
    }
  }

  let totalPercent = 0
  let pendingSubmissions = 0
  let overdueAssignments = 0

  for (const a of assignments) {
    const comp = getCompletion(a)
    totalPercent += comp.percent
    pendingSubmissions += comp.remaining

    const dueInfo = getDueInfo(a.dueDate, now)
    if (dueInfo.state === 'overdue' && comp.remaining > 0) {
      overdueAssignments++
    }
  }

  const averageCompletion = Math.round(totalPercent / totalAssignments)

  return {
    totalAssignments,
    averageCompletion,
    pendingSubmissions,
    overdueAssignments,
  }
}

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
