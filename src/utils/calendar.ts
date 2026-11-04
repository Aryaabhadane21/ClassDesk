export interface CalendarDayCell {
  date: Date
  key: string
  inCurrentMonth: boolean
  isToday: boolean
}

/**
 * Formats a Date to 'YYYY-MM-DD' in LOCAL time (never using toISOString).
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Checks if two Date objects fall on the exact same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Returns a new Date offset by the specified number of months.
 */
export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

/**
 * Returns the first day of the given date's month at midnight.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Generates a 6-week x 7-day grid (42 cells) for the given month, Monday-first.
 * @param year Full year (e.g. 2026)
 * @param month 0-indexed month (0 = January, 10 = November)
 * @param now Current date for isToday check (default: new Date())
 */
export function getMonthGrid(
  year: number,
  month: number,
  now: Date = new Date(),
): CalendarDayCell[] {
  const firstOfMonth = new Date(year, month, 1)

  // Monday-first offset: Mon=0, Tue=1, ..., Sun=6
  // JS getDay(): Sun=0, Mon=1, ..., Sat=6
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7

  // The first date in the 42-day grid
  const startDate = new Date(year, month, 1 - startDayOfWeek)

  const cells: CalendarDayCell[] = []
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + i,
    )
    const key = toDateKey(cellDate)
    const inCurrentMonth =
      cellDate.getMonth() === month && cellDate.getFullYear() === year
    const isTodayCell = isSameDay(cellDate, now)

    cells.push({
      date: cellDate,
      key,
      inCurrentMonth,
      isToday: isTodayCell,
    })
  }

  return cells
}

/**
 * Groups assignments by their local due date key ('YYYY-MM-DD').
 */
export function groupByDueDate<T extends { dueDate: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const d = new Date(item.dueDate)
    if (isNaN(d.getTime())) continue
    const key = toDateKey(d)
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}
