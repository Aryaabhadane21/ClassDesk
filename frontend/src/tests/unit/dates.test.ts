import { describe, it, expect } from 'vitest'
import { getDueInfo, formatDueDate, formatSubmissionDate } from '@/utils/dates'

describe('utils/dates', () => {
  const fixedNow = new Date('2026-11-04T12:00:00.000Z')

  it('computes overdue status and label accurately', () => {
    // 1 day overdue
    const yesterday = new Date('2026-11-03T12:00:00.000Z').toISOString()
    const info1 = getDueInfo(yesterday, fixedNow)
    expect(info1.state).toBe('overdue')
    expect(info1.label).toBe('Overdue by 1 day')

    // Multiple days overdue
    const fiveDaysAgo = new Date('2026-10-30T12:00:00.000Z').toISOString()
    const info5 = getDueInfo(fiveDaysAgo, fixedNow)
    expect(info5.state).toBe('overdue')
    expect(info5.label).toBe('Overdue by 5 days')
  })

  it('computes due today accurately', () => {
    const todayEvening = new Date('2026-11-04T15:00:00.000Z').toISOString()
    const info = getDueInfo(todayEvening, fixedNow)
    expect(info.state).toBe('due_today')
    expect(info.label).toBe('Due today')
  })

  it('computes due tomorrow accurately', () => {
    const tomorrow = new Date('2026-11-05T12:00:00.000Z').toISOString()
    const info = getDueInfo(tomorrow, fixedNow)
    expect(info.state).toBe('due_soon')
    expect(info.label).toBe('Due tomorrow')
  })

  it('computes due soon (within 3 days) accurately', () => {
    const inThreeDays = new Date('2026-11-07T12:00:00.000Z').toISOString()
    const info = getDueInfo(inThreeDays, fixedNow)
    expect(info.state).toBe('due_soon')
    expect(info.label).toBe('Due in 3 days')
  })

  it('computes upcoming (> 3 days) accurately', () => {
    const inTenDays = new Date('2026-11-14T12:00:00.000Z').toISOString()
    const info = getDueInfo(inTenDays, fixedNow)
    expect(info.state).toBe('upcoming')
    expect(info.label).toBe('Due in 10 days')
  })

  it('formats dates consistently', () => {
    const dateStr = '2026-11-06T23:59:00.000Z'
    const formatted = formatDueDate(dateStr)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')

    const subFormatted = formatSubmissionDate(dateStr)
    expect(subFormatted).toBeTruthy()
  })
})
