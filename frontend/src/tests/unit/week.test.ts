import { describe, it, expect } from 'vitest'
import { getWeekDays } from '@/utils/week'
import type { StudentAssignment } from '@/types'

describe('Unit: Week Strip Helper (getWeekDays)', () => {
  const baseDate = new Date(2026, 10, 5) // Nov 5, 2026 local time

  it('generates exactly 7 days starting with today', () => {
    const days = getWeekDays([], baseDate)
    expect(days).toHaveLength(7)
    expect(days[0].isToday).toBe(true)
    expect(days[0].dayNumber).toBe(5)
    expect(days[1].isToday).toBe(false)
    expect(days[1].dayNumber).toBe(6)
    expect(days[6].dayNumber).toBe(11)
  })

  it('correctly maps assignment counts and tones across the week', () => {
    // Nov 5 (today), Nov 6, Nov 7
    const mockItems: StudentAssignment[] = [
      {
        id: '1',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Today Pending',
        description: '',
        dueDate: '2026-11-05T18:00:00', // Today
        oneDriveLink: '',
        status: 'not_submitted',
        createdAt: '',
      },
      {
        id: '2',
        courseId: 'course-web101',
        submissionType: 'individual',
        title: 'Tomorrow Complete',
        description: '',
        dueDate: '2026-11-06T18:00:00', // Tomorrow
        oneDriveLink: '',
        status: 'submitted',
        createdAt: '',
      },
    ]

    const days = getWeekDays(mockItems, baseDate)

    // Day 0: Nov 5
    expect(days[0].totalCount).toBe(1)
    expect(days[0].pendingCount).toBe(1)
    expect(days[0].tone).toBe('warning')
    expect(days[0].ariaLabel).toContain('1 assignment due')

    // Day 1: Nov 6
    expect(days[1].totalCount).toBe(1)
    expect(days[1].pendingCount).toBe(0)
    expect(days[1].tone).toBe('success')

    // Day 2: Nov 7 (None)
    expect(days[2].totalCount).toBe(0)
    expect(days[2].tone).toBe('neutral')
    expect(days[2].ariaLabel).toContain('no assignments due')
  })
})
