import type { StudentAssignment } from '@/types'
import { toDateKey } from '@/utils/calendar'

export type WeekDayTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface WeekDayInfo {
  date: Date
  dateKey: string
  weekdayShort: string
  dayNumber: number
  isToday: boolean
  totalCount: number
  pendingCount: number
  submittedCount: number
  tone: WeekDayTone
  ariaLabel: string
}

export function getWeekDays(
  assignments: StudentAssignment[],
  today: Date = new Date(),
): WeekDayInfo[] {
  // Map assignments by local dueDate key
  const byKey = new Map<string, StudentAssignment[]>()
  for (const a of assignments) {
    const key = toDateKey(new Date(a.dueDate))
    const list = byKey.get(key) || []
    list.push(a)
    byKey.set(key, list)
  }

  const days: WeekDayInfo[] = []
  const todayKey = toDateKey(today)

  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const key = toDateKey(d)
    const items = byKey.get(key) || []
    const totalCount = items.length
    const pendingCount = items.filter((it) => it.status !== 'submitted').length
    const submittedCount = totalCount - pendingCount

    let tone: WeekDayTone = 'neutral'
    if (totalCount === 0) {
      tone = 'neutral'
    } else if (pendingCount === 0) {
      tone = 'success'
    } else if (key < todayKey) {
      // Overdue and pending
      tone = 'danger'
    } else {
      // Due soon and pending (within the 7-day strip)
      tone = 'warning'
    }

    const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d)
    const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d)
    const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d)
    const dayNum = d.getDate()

    const ariaLabel = `${weekdayLong} ${dayNum} ${monthLong}, ${
      totalCount === 0
        ? 'no assignments due'
        : `${totalCount} ${totalCount === 1 ? 'assignment' : 'assignments'} due`
    }`

    days.push({
      date: d,
      dateKey: key,
      weekdayShort,
      dayNumber: dayNum,
      isToday: i === 0,
      totalCount,
      pendingCount,
      submittedCount,
      tone,
      ariaLabel,
    })
  }

  return days
}
