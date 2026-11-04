import {
  useRef,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import {
  getMonthGrid,
  isSameDay,
  addMonths,
  toDateKey,
  type CalendarDayCell,
} from '@/utils/calendar'
import { cn } from '@/utils/cn'

export interface MonthCalendarProps<T> {
  currentMonth: Date
  onMonthChange: (nextMonth: Date) => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
  itemsByDay: Map<string, T[]>
  renderChip: (item: T) => ReactNode
  renderDot: (item: T) => ReactNode
  className?: string
}

const WEEKDAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
]

export function MonthCalendar<T>({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  itemsByDay,
  renderChip,
  renderDot,
  className,
}: MonthCalendarProps<T>) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const grid = useMemo(() => getMonthGrid(year, month), [year, month])

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(currentMonth),
    [currentMonth],
  )

  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handlePrevMonth = () => {
    onMonthChange(addMonths(currentMonth, -1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    const today = new Date()
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))
    onSelectDate(today)
    setTimeout(() => {
      cellRefs.current.get(toDateKey(today))?.focus()
    }, 50)
  }

  // Keyboard navigation across grid cells
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, cell: CalendarDayCell) => {
      let targetDate: Date | null = null

      switch (e.key) {
        case 'ArrowLeft':
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() - 1,
          )
          break
        case 'ArrowRight':
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() + 1,
          )
          break
        case 'ArrowUp':
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() - 7,
          )
          break
        case 'ArrowDown':
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() + 7,
          )
          break
        case 'Home': {
          // Jump to Monday of the current week
          const dayOfWeek = (cell.date.getDay() + 6) % 7
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() - dayOfWeek,
          )
          break
        }
        case 'End': {
          // Jump to Sunday of the current week
          const dayOfWeek = (cell.date.getDay() + 6) % 7
          targetDate = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate() + (6 - dayOfWeek),
          )
          break
        }
        case 'PageUp':
          targetDate = addMonths(cell.date, -1)
          break
        case 'PageDown':
          targetDate = addMonths(cell.date, 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelectDate(cell.date)
          return
        default:
          return
      }

      if (targetDate) {
        e.preventDefault()
        // If target moves out of current displayed month, switch month
        if (
          targetDate.getMonth() !== month ||
          targetDate.getFullYear() !== year
        ) {
          onMonthChange(
            new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
          )
        }
        onSelectDate(targetDate)
        const targetKey = toDateKey(targetDate)
        setTimeout(() => {
          cellRefs.current.get(targetKey)?.focus()
        }, 50)
      }
    },
    [month, year, onMonthChange, onSelectDate],
  )

  return (
    <div
      className={cn(
        'w-full bg-surface border border-line rounded-lg shadow-card p-4 sm:p-6 space-y-4',
        className,
      )}
    >
      {/* 1. Header with Month title, Today button & Month navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2
          aria-live="polite"
          className="font-display text-xl sm:text-2xl font-bold text-fg tracking-tight"
        >
          {monthTitle}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs font-semibold px-3 h-8"
          >
            Today
          </Button>

          <IconButton
            variant="secondary"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-8 h-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </IconButton>

          <IconButton
            variant="secondary"
            size="sm"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-8 h-8"
          >
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* 2. Calendar Grid */}
      <div
        role="grid"
        aria-label={`Month view for ${monthTitle}`}
        className="w-full select-none"
      >
        {/* Weekday Row */}
        <div role="row" className="grid grid-cols-7 border-b border-line pb-2 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day.short}
              role="columnheader"
              aria-label={day.full}
              className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-1"
            >
              <abbr title={day.full} className="no-underline">
                {day.short}
              </abbr>
            </div>
          ))}
        </div>

        {/* 42-day cells grid */}
        <div className="grid grid-cols-7 gap-px bg-line/40 rounded-md overflow-hidden border border-line">
          {grid.map((cell) => {
            const isSelected = isSameDay(cell.date, selectedDate)
            const dayItems = itemsByDay.get(cell.key) || []
            const hasItems = dayItems.length > 0

            const dateLabel = new Intl.DateTimeFormat('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(cell.date)

            const cellAriaLabel = `${dateLabel}, ${
              hasItems
                ? `${dayItems.length} ${
                    dayItems.length === 1 ? 'assignment' : 'assignments'
                  } due`
                : 'no assignments'
            }`

            return (
              <button
                key={cell.key}
                ref={(el) => {
                  if (el) cellRefs.current.set(cell.key, el)
                  else cellRefs.current.delete(cell.key)
                }}
                type="button"
                role="gridcell"
                tabIndex={isSelected ? 0 : -1}
                aria-label={cellAriaLabel}
                aria-pressed={isSelected}
                aria-current={cell.isToday ? 'date' : undefined}
                onClick={() => onSelectDate(cell.date)}
                onKeyDown={(e) => handleKeyDown(e, cell)}
                className={cn(
                  'relative min-h-[64px] sm:min-h-[88px] md:min-h-[105px] p-1.5 sm:p-2 flex flex-col justify-start text-left',
                  'bg-surface focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                  'motion-safe:transition-colors cursor-pointer',
                  !cell.inCurrentMonth && 'bg-surface-2/40 text-muted/60 opacity-60',
                  isSelected && 'ring-2 ring-accent ring-inset bg-accent/5',
                  'hover:bg-surface-2/60',
                )}
              >
                {/* Day Number and Today Indicator */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={cn(
                      'font-display text-xs sm:text-sm font-semibold rounded-pill w-6 h-6 flex items-center justify-center shrink-0',
                      cell.isToday
                        ? 'bg-primary text-primary-fg font-bold shadow-xs'
                        : isSelected
                        ? 'text-accent font-bold'
                        : cell.inCurrentMonth
                        ? 'text-fg'
                        : 'text-muted',
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                </div>

                {/* Desktop: Title chips (up to 2 + more) */}
                <div className="hidden md:flex flex-col gap-1 mt-1.5 w-full">
                  {dayItems.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="w-full truncate">
                      {renderChip(item)}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <span className="text-[10px] font-semibold text-muted px-1.5 py-0.5 rounded-sm bg-surface-2 self-start">
                      +{dayItems.length - 2} more
                    </span>
                  )}
                </div>

                {/* Mobile: Colored dots (up to 3) */}
                <div className="md:hidden flex items-center justify-center gap-1 mt-auto pt-1 w-full">
                  {dayItems.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="shrink-0">
                      {renderDot(item)}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
