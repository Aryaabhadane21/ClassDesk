import type { AdminAssignment, SubmissionWithStudent } from '@/types'

export interface AssignmentCompletion {
  submitted: number
  total: number
  remaining: number
  percent: number
  late: number
}

/**
 * Computes progress and submission statistics for an admin assignment.
 */
export function getCompletion(assignment: AdminAssignment): AssignmentCompletion {
  const total = assignment.totalCount ?? assignment.submissions.length
  const submitted =
    assignment.submittedCount ??
    assignment.submissions.filter((s) => s.status === 'submitted').length
  const remaining = Math.max(0, total - submitted)
  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0

  const dueTimestamp = new Date(assignment.dueDate).getTime()
  const late = assignment.submissions.filter((s) => {
    if (s.status !== 'submitted' || !s.submittedAt) return false
    const submittedTimestamp = new Date(s.submittedAt).getTime()
    return (
      !isNaN(dueTimestamp) &&
      !isNaN(submittedTimestamp) &&
      submittedTimestamp > dueTimestamp
    )
  }).length

  return {
    submitted,
    total,
    remaining,
    percent,
    late,
  }
}

/**
 * Sorts submissions for review:
 * 1. Not-submitted students first (alphabetically by name)
 * 2. Submitted students (most recently submitted first)
 */
export function sortSubmissionsForReview(
  submissions: SubmissionWithStudent[],
): SubmissionWithStudent[] {
  return [...submissions].sort((a, b) => {
    const aSubmitted = a.status === 'submitted'
    const bSubmitted = b.status === 'submitted'

    // Not-submitted students first
    if (!aSubmitted && bSubmitted) return -1
    if (aSubmitted && !bSubmitted) return 1

    // If both not submitted: sort by student name
    if (!aSubmitted && !bSubmitted) {
      return a.student.name.localeCompare(b.student.name)
    }

    // If both submitted: most recent first (descending submittedAt)
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
    if (timeB !== timeA) {
      return timeB - timeA
    }

    return a.student.name.localeCompare(b.student.name)
  })
}
