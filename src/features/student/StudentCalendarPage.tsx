import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  ErrorState,
  Skeleton,
} from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import { DayAgenda, MonthCalendar } from '@/components/calendar'
import { useStudentAssignments } from '@/features/student/useStudentAssignments'
import { usePageTitle } from '@/hooks/usePageTitle'
import { groupByDueDate, toDateKey } from '@/utils/calendar'
import { getStudentUrgency } from '@/utils/dueStyles'
import type { StudentAssignment } from '@/types'
import { cn } from '@/utils/cn'

export function StudentCalendarPage() {
  usePageTitle('Calendar · ClassDesk')

  const { assignments, status, error, reload } = useStudentAssignments()

  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(() => today)

  // Group items by due date key
  const itemsByDay = useMemo(
    () => groupByDueDate(assignments),
    [assignments],
  )

  // Selected day items
  const selectedDayItems = useMemo(
    () => itemsByDay.get(toDateKey(selectedDate)) || [],
    [itemsByDay, selectedDate],
  )

  // Check how many assignments are due in the currently viewed month
  const monthDueCount = useMemo(() => {
    return assignments.filter((a) => {
      const d = new Date(a.dueDate)
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      )
    }).length
  }, [assignments, currentMonth])

  // Helper for item tone styling
  const getItemTone = (item: StudentAssignment) => {
    if (item.status === 'submitted') {
      return {
        chip: 'bg-success-soft text-success border border-success/30',
        dot: 'bg-success',
      }
    }
    const urgency = getStudentUrgency(item.dueDate, item.status)
    if (urgency.tone === 'danger') {
      return {
        chip: 'bg-danger-soft text-danger border border-danger/30 font-semibold',
        dot: 'bg-danger',
      }
    }
    if (urgency.tone === 'warning') {
      return {
        chip: 'bg-warning-soft text-warning border border-warning/30',
        dot: 'bg-warning',
      }
    }
    return {
      chip: 'bg-surface-2 text-fg border border-line hover:border-accent',
      dot: 'bg-accent',
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="View upcoming deadlines, scheduled assignments, and submission timelines across the month."
      />

      {/* Quiet empty month indicator */}
      {status === 'success' && monthDueCount === 0 && (
        <p className="text-xs text-muted font-medium italic -mt-2">
          No assignments due this month.
        </p>
      )}

      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div className="space-y-6 animate-fade-in" aria-busy="true">
          <Skeleton className="h-[480px] w-full" rounded="lg" />
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <ErrorState
          title="Could not load calendar"
          message={error || 'An unexpected error occurred while loading assignments.'}
          onRetry={reload}
          retryLabel="Try again"
        />
      )}

      {/* Success Calendar & Agenda Layout */}
      {status === 'success' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Main Month Grid (xl: 2 cols) */}
          <div className="xl:col-span-2">
            <MonthCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              itemsByDay={itemsByDay}
              renderChip={(item) => {
                const tone = getItemTone(item)
                return (
                  <span
                    className={cn(
                      'text-[11px] leading-tight px-1.5 py-0.5 rounded-sm truncate block shadow-2xs',
                      tone.chip,
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                )
              }}
              renderDot={(item) => {
                const tone = getItemTone(item)
                return (
                  <span
                    className={cn('w-1.5 h-1.5 rounded-pill block', tone.dot)}
                    aria-hidden="true"
                  />
                )
              }}
            />
          </div>

          {/* Day Agenda Panel (xl: 1 col, below on smaller screens) */}
          <div className="xl:col-span-1">
            <DayAgenda
              selectedDate={selectedDate}
              items={selectedDayItems}
              renderItem={(item) => (
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-fg leading-snug">
                      {item.title}
                    </h4>
                    <StatusBadge status={item.status} className="shrink-0" />
                  </div>

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <DueLabel dueDate={item.dueDate} />
                    <Link
                      to={`/student?q=${encodeURIComponent(item.title)}`}
                      className="inline-block"
                    >
                      <Button variant="secondary" size="sm" className="text-xs h-7">
                        View on dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
