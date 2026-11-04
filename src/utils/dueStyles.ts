import { getDueInfo } from '@/utils/dates'
import type { SubmissionStatus } from '@/types'

export interface UrgencyInfo {
  isUrgent: boolean
  tone: 'danger' | 'warning' | 'neutral'
  badgeLabel?: string
  helperText?: string
  dueRowClasses?: string
  cardBorderClasses?: string
}

/**
 * Computes urgency styling for a student assignment.
 * Only pending/not_submitted assignments receive urgency styling; submitted assignments never do.
 */
export function getStudentUrgency(
  dueDate: string,
  status: SubmissionStatus | 'pending' | 'not_submitted' | 'submitted',
  now: Date = new Date(),
): UrgencyInfo {
  if (status === 'submitted') {
    return {
      isUrgent: false,
      tone: 'neutral',
    }
  }

  const dueInfo = getDueInfo(dueDate, now)

  if (dueInfo.state === 'overdue') {
    return {
      isUrgent: true,
      tone: 'danger',
      badgeLabel: 'Overdue',
      helperText: 'Overdue assignment',
      dueRowClasses:
        'bg-danger-soft/50 border border-danger/30 p-2.5 rounded-none text-danger',
      cardBorderClasses: 'border-danger/40 ring-1 ring-danger/20',
    }
  }

  if (dueInfo.state === 'due_today' || dueInfo.state === 'due_soon') {
    return {
      isUrgent: true,
      tone: 'warning',
      badgeLabel: 'Due soon',
      helperText: 'Deadline approaching',
      dueRowClasses:
        'bg-warning-soft/50 border border-warning/30 p-2.5 rounded-none text-warning',
      cardBorderClasses: 'border-warning/40 ring-1 ring-warning/20',
    }
  }

  return {
    isUrgent: false,
    tone: 'neutral',
  }
}

/**
 * Computes urgency styling for an admin assignment.
 * Highlighted only when overdue/due soon AND not everyone has submitted.
 * Fully submitted assignments are never highlighted.
 */
export function getAdminUrgency(
  dueDate: string,
  submittedCount: number,
  totalCount: number,
  now: Date = new Date(),
): UrgencyInfo {
  if (totalCount > 0 && submittedCount >= totalCount) {
    return {
      isUrgent: false,
      tone: 'neutral',
    }
  }

  const dueInfo = getDueInfo(dueDate, now)
  const pendingCount = Math.max(0, totalCount - submittedCount)

  if (dueInfo.state === 'overdue') {
    return {
      isUrgent: true,
      tone: 'danger',
      badgeLabel: `Overdue, ${pendingCount} pending`,
      helperText: `Overdue, ${pendingCount} pending`,
      dueRowClasses:
        'bg-danger-soft/50 border border-danger/30 p-2 rounded-none text-danger',
      cardBorderClasses: 'border-danger/40 ring-1 ring-danger/20',
    }
  }

  if (dueInfo.state === 'due_today' || dueInfo.state === 'due_soon') {
    return {
      isUrgent: true,
      tone: 'warning',
      badgeLabel: 'Due soon',
      helperText: 'Due soon',
      dueRowClasses:
        'bg-warning-soft/50 border border-warning/30 p-2 rounded-none text-warning',
      cardBorderClasses: 'border-warning/40 ring-1 ring-warning/20',
    }
  }

  return {
    isUrgent: false,
    tone: 'neutral',
  }
}
