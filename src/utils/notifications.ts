import type {
  AdminAssignment,
  AppNotification,
  NotificationType,
  StudentAssignment,
} from '@/types'

/**
 * Returns a human-friendly relative time string (e.g. "2 hours ago", "in 2 days").
 */
export function formatRelativeTime(
  isoString: string,
  now: Date = new Date(),
): string {
  const target = new Date(isoString)
  if (isNaN(target.getTime())) return ''

  const diffMs = target.getTime() - now.getTime()
  const absDiff = Math.abs(diffMs)

  const diffMins = Math.round(absDiff / (1000 * 60))
  const diffHours = Math.round(absDiff / (1000 * 60 * 60))
  const diffDays = Math.round(absDiff / (1000 * 60 * 60 * 24))

  // Future dates (e.g. due soon)
  if (diffMs > 0) {
    if (diffMins < 60) {
      return diffMins <= 1 ? 'in a minute' : `in ${diffMins} minutes`
    }
    if (diffHours < 24) {
      return diffHours === 1 ? 'in 1 hour' : `in ${diffHours} hours`
    }
    if (diffDays === 1) return 'tomorrow'
    return `in ${diffDays} days`
  }

  // Past dates
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(target)
}

/**
 * Derives notifications for a student.
 */
export function deriveStudentNotifications(
  assignments: StudentAssignment[],
  readIds: string[],
  now: Date = new Date(),
): AppNotification[] {
  const notifications: AppNotification[] = []
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

  for (const asg of assignments) {
    const dueTime = new Date(asg.dueDate).getTime()
    const createdTime = new Date(asg.createdAt).getTime()
    const isSubmitted = asg.status === 'submitted'

    // 1. Overdue (only for unsubmitted assignments)
    if (!isSubmitted && dueTime < now.getTime()) {
      const id = `overdue:${asg.id}`
      notifications.push({
        id,
        type: 'overdue',
        assignmentId: asg.id,
        message: `"${asg.title}" is overdue`,
        createdAt: asg.dueDate,
        read: readIds.includes(id),
        targetPath: `/student?q=${encodeURIComponent(asg.title)}`,
      })
    }

    // 2. Due soon (only for unsubmitted assignments within next 3 days)
    if (
      !isSubmitted &&
      dueTime >= now.getTime() &&
      dueTime - now.getTime() <= THREE_DAYS_MS
    ) {
      const id = `due_soon:${asg.id}`
      notifications.push({
        id,
        type: 'due_soon',
        assignmentId: asg.id,
        message: `"${asg.title}" is due soon`,
        createdAt: asg.dueDate,
        read: readIds.includes(id),
        targetPath: `/student?q=${encodeURIComponent(asg.title)}`,
      })
    }

    // 3. Assigned (created within last 7 days)
    if (
      now.getTime() - createdTime <= SEVEN_DAYS_MS &&
      createdTime <= now.getTime()
    ) {
      const id = `assigned:${asg.id}`
      notifications.push({
        id,
        type: 'assigned',
        assignmentId: asg.id,
        message: `New assignment: "${asg.title}"`,
        createdAt: asg.createdAt,
        read: readIds.includes(id),
        targetPath: `/student?q=${encodeURIComponent(asg.title)}`,
      })
    }
  }

  return sortNotifications(notifications)
}

/**
 * Derives notifications for an admin.
 */
export function deriveAdminNotifications(
  assignments: AdminAssignment[],
  readIds: string[],
  now: Date = new Date(),
): AppNotification[] {
  const notifications: AppNotification[] = []
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  for (const asg of assignments) {
    const dueTime = new Date(asg.dueDate).getTime()

    // 1. Overdue with pending students
    if (dueTime < now.getTime() && asg.submittedCount < asg.totalCount) {
      const pendingCount = asg.totalCount - asg.submittedCount
      const id = `overdue:${asg.id}`
      notifications.push({
        id,
        type: 'overdue',
        assignmentId: asg.id,
        message: `"${asg.title}" is overdue, ${pendingCount} ${
          pendingCount === 1 ? 'student has' : 'students have'
        } not submitted`,
        createdAt: asg.dueDate,
        read: readIds.includes(id),
        targetPath: `/admin/assignments/${asg.id}`,
      })
    }

    // 2. Submissions received within the last 7 days
    for (const sub of asg.submissions) {
      if (sub.status === 'submitted' && sub.submittedAt) {
        const subTime = new Date(sub.submittedAt).getTime()
        if (
          now.getTime() - subTime <= SEVEN_DAYS_MS &&
          subTime <= now.getTime()
        ) {
          const id = `submitted:${asg.id}:${sub.studentId}`
          notifications.push({
            id,
            type: 'submitted',
            assignmentId: asg.id,
            message: `${sub.student.name} submitted "${asg.title}"`,
            createdAt: sub.submittedAt,
            read: readIds.includes(id),
            targetPath: `/admin/assignments/${asg.id}`,
          })
        }
      }
    }
  }

  return sortNotifications(notifications)
}

/**
 * Sorts notifications: newest/most urgent first.
 */
function sortNotifications(items: AppNotification[]): AppNotification[] {
  const urgencyRank: Record<NotificationType, number> = {
    overdue: 1,
    due_soon: 2,
    submitted: 3,
    assigned: 4,
  }

  return [...items].sort((a, b) => {
    // 1. Unread before read
    if (!a.read && b.read) return -1
    if (a.read && !b.read) return 1

    // 2. Urgency rank
    if (urgencyRank[a.type] !== urgencyRank[b.type]) {
      return urgencyRank[a.type] - urgencyRank[b.type]
    }

    // 3. Newest timestamp
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
