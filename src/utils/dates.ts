export type DueState = 'overdue' | 'due_today' | 'due_soon' | 'upcoming'

export interface DueInfo {
  state: DueState
  label: string
}

/**
 * Formats an ISO due date string into a friendly localized string,
 * e.g. "Fri, 6 Nov, 11:59 PM".
 */
export function formatDueDate(isoString: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'Invalid date'

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Formats an ISO submission timestamp into a friendly localized string,
 * e.g. "6 Nov, 11:30 PM".
 */
export function formatSubmissionDate(isoString: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'recently'

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Computes due status and relative human-readable label relative to now.
 * Pure function: takes an optional now parameter for deterministic testing.
 */
export function getDueInfo(isoString: string, now: Date = new Date()): DueInfo {
  const dueDate = new Date(isoString)
  if (isNaN(dueDate.getTime())) {
    return { state: 'upcoming', label: 'No due date' }
  }

  const diffMs = dueDate.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  // 1. Overdue
  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs)
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24))
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60))

    if (overdueDays >= 1) {
      const dayStr = overdueDays === 1 ? '1 day' : `${overdueDays} days`
      return { state: 'overdue', label: `Overdue by ${dayStr}` }
    }

    const hourStr = overdueHours <= 1 ? '1 hour' : `${overdueHours} hours`
    return { state: 'overdue', label: `Overdue by ${hourStr}` }
  }

  // 2. Due today (calendar day match or < 24 hours on same date)
  const isSameDay =
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate()

  if (isSameDay) {
    if (diffHours <= 1) {
      return { state: 'due_today', label: 'Due in less than an hour' }
    }
    return { state: 'due_today', label: 'Due today' }
  }

  // 3. Due tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow =
    dueDate.getFullYear() === tomorrow.getFullYear() &&
    dueDate.getMonth() === tomorrow.getMonth() &&
    dueDate.getDate() === tomorrow.getDate()

  if (isTomorrow) {
    return { state: 'due_soon', label: 'Due tomorrow' }
  }

  // 4. Due soon (within next 3 days)
  if (diffDays <= 3) {
    return { state: 'due_soon', label: `Due in ${diffDays} days` }
  }

  // 5. Upcoming (> 3 days out)
  return { state: 'upcoming', label: `Due in ${diffDays} days` }
}

/**
 * Converts a Date object to a YYYY-MM-DDTHH:mm string in local time
 * for <input type="datetime-local">.
 */
export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const YYYY = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const DD = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
}

/**
 * Default due date for new assignments: 7 days from now at 23:59 local time.
 */
export function getDefaultDueDateTimeLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 0, 0)
  return toDateTimeLocalString(d)
}

/**
 * Converts an ISO string into YYYY-MM-DDTHH:mm format in local time.
 */
export function isoToDateTimeLocal(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  return toDateTimeLocalString(d)
}

/**
 * Converts a local datetime-local string (YYYY-MM-DDTHH:mm) into an ISO string.
 */
export function dateTimeLocalToIso(localString: string): string {
  const d = new Date(localString)
  if (isNaN(d.getTime())) return ''
  return d.toISOString()
}

