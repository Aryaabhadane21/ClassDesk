import { describe, it, expect } from 'vitest'
import {
  getMonthGrid,
  toDateKey,
  groupByDueDate,
  isSameDay,
  addMonths,
  startOfMonth,
} from '@/utils/calendar'

describe('utils/calendar', () => {
  it('formats toDateKey in local time', () => {
    const d = new Date(2026, 10, 5, 23, 59, 0)
    expect(toDateKey(d)).toBe('2026-11-05')
  })

  it('checks isSameDay accurately', () => {
    const d1 = new Date(2026, 10, 5, 10, 0, 0)
    const d2 = new Date(2026, 10, 5, 18, 0, 0)
    const d3 = new Date(2026, 10, 6, 10, 0, 0)
    expect(isSameDay(d1, d2)).toBe(true)
    expect(isSameDay(d1, d3)).toBe(false)
  })

  it('adds months and gets startOfMonth', () => {
    const d = new Date(2026, 10, 15)
    const next = addMonths(d, 1)
    expect(next.getMonth()).toBe(11)

    const start = startOfMonth(d)
    expect(start.getDate()).toBe(1)
  })

  it('builds a 6x7 grid (42 cells) with Monday-first for a month starting on a Sunday', () => {
    // November 2026 starts on Sunday Nov 1
    const grid = getMonthGrid(2026, 10)
    expect(grid.length).toBe(42)

    // First cell must be Monday (Oct 26, 2026)
    const firstCell = grid[0]
    expect((firstCell.date.getDay() + 6) % 7).toBe(0) // Monday
    expect(firstCell.inCurrentMonth).toBe(false)
    expect(firstCell.key).toBe('2026-10-26')

    // Cell at index 6 must be Sunday Nov 1
    expect(grid[6].key).toBe('2026-11-01')
    expect(grid[6].inCurrentMonth).toBe(true)

    // Last cell must be Sunday (Dec 6, 2026)
    const lastCell = grid[41]
    expect((lastCell.date.getDay() + 6) % 7).toBe(6) // Sunday
    expect(lastCell.inCurrentMonth).toBe(false)
  })

  it('builds a 6x7 grid with Monday-first for a month starting on a Monday', () => {
    // February 2021 started on a Monday
    const grid = getMonthGrid(2021, 1) // Feb 2021
    expect(grid.length).toBe(42)
    // First cell is Feb 1, 2021
    expect(grid[0].key).toBe('2021-02-01')
    expect(grid[0].inCurrentMonth).toBe(true)
    expect((grid[0].date.getDay() + 6) % 7).toBe(0) // Monday
  })

  it('groups items by local due date key', () => {
    const items = [
      { id: '1', dueDate: '2026-11-05T10:00:00.000Z' },
      { id: '2', dueDate: '2026-11-05T18:00:00.000Z' },
      { id: '3', dueDate: '2026-11-06T12:00:00.000Z' },
    ]
    const grouped = groupByDueDate(items)
    const key1 = toDateKey(new Date('2026-11-05T10:00:00.000Z'))
    const key2 = toDateKey(new Date('2026-11-06T12:00:00.000Z'))

    expect(grouped.get(key1)?.length).toBe(2)
    expect(grouped.get(key2)?.length).toBe(1)
  })
})
