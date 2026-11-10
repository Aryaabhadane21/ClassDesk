import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { getWeekDays } from '@/utils/week'
import type { StudentAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface WeekStripProps {
  assignments: StudentAssignment[]
  today?: Date
  className?: string
}

export function WeekStrip({ assignments, today, className }: WeekStripProps) {
  const effectiveToday = useMemo(() => today || new Date(), [today])
  const days = useMemo(
    () => getWeekDays(assignments, effectiveToday),
    [assignments, effectiveToday],
  )

  const toneBadge = {
    neutral: 'bg-surface-2 text-muted border border-line',
    success: 'bg-success-soft text-success border border-success/30 font-semibold',
    warning: 'bg-warning-soft text-warning border border-warning/30 font-semibold',
    danger: 'bg-danger-soft text-danger border border-danger/30 font-semibold',
  }

  return (
    <section className={cn('space-y-2.5 text-left', className)} aria-label="Upcoming week overview">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>THIS WEEK</Eyebrow>
        <Link
          to="/student/calendar"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 focus:outline-none focus-visible:underline motion-safe:transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Open calendar</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>

      {/* 7-day strip: scrollable on mobile with scroll-snap, 7 cols on desktop */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <ul
          role="list"
          className="grid grid-flow-col auto-cols-[minmax(96px,1fr)] sm:grid-flow-row sm:grid-cols-7 gap-2.5 min-w-[680px] sm:min-w-0 snap-x"
        >
          {days.map((day) => (
            <li
              key={day.dateKey}
              aria-label={day.ariaLabel}
              tabIndex={0}
              className={cn(
                'snap-start p-3 rounded-lg border bg-surface flex flex-col items-center justify-between gap-2 min-h-[96px] text-center select-none shadow-xs',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                day.isToday
                  ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/20'
                  : 'border-line hover:border-line/80',
              )}
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                  {day.weekdayShort}
                </span>
                <span
                  className={cn(
                    'font-display text-lg font-bold tabular-nums block',
                    day.isToday ? 'text-accent' : 'text-fg',
                  )}
                >
                  {day.dayNumber}
                </span>
              </div>

              <div>
                {day.totalCount === 0 ? (
                  <span className="text-[10px] text-muted font-medium px-2 py-0.5 rounded-pill bg-surface-2 block">
                    None
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-pill tabular-nums block truncate max-w-[84px]',
                      toneBadge[day.tone],
                    )}
                  >
                    {day.totalCount} {day.totalCount === 1 ? 'due' : 'due'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
