import {
  useRef,
  type KeyboardEvent,
} from 'react'
import { X } from 'lucide-react'
import { Button, Dropdown, SearchInput, type DropdownOption } from '@/components/ui'
import type { DueFilter, SortOption } from '@/utils/filters'
import { cn } from '@/utils/cn'

export interface SelectOptionItem<T extends string = string> {
  label: string
  value: T
}

export interface AssignmentToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusValue: string
  onStatusChange: (status: string) => void
  statusOptions: SelectOptionItem[]
  statusCounts?: Record<string, number>
  statusLabel?: string
  dueValue: DueFilter
  onDueChange: (due: DueFilter) => void
  sortValue: SortOption
  onSortChange: (sort: SortOption) => void
  sortOptions?: SelectOptionItem<SortOption>[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  resultCount: number
  totalCount: number
  className?: string
}

const DEFAULT_DUE_OPTIONS: DropdownOption<DueFilter>[] = [
  { label: 'All deadlines', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due today', value: 'today' },
  { label: 'Due this week', value: 'week' },
  { label: 'Due later', value: 'later' },
]

const DEFAULT_SORT_OPTIONS: DropdownOption<SortOption>[] = [
  { label: 'Soonest due', value: 'due_asc' },
  { label: 'Furthest due', value: 'due_desc' },
  { label: 'Newest created', value: 'newest' },
  { label: 'Title (A–Z)', value: 'title_asc' },
]

export function AssignmentToolbar({
  searchQuery,
  onSearchChange,
  statusValue,
  onStatusChange,
  statusOptions,
  statusCounts = {},
  statusLabel = 'Status',
  dueValue,
  onDueChange,
  sortValue,
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  hasActiveFilters,
  onClearFilters,
  resultCount,
  totalCount,
  className,
}: AssignmentToolbarProps) {
  const segmentRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Keyboard navigation for segmented control (ArrowLeft / ArrowRight / Home / End)
  const handleSegmentKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % statusOptions.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + statusOptions.length) % statusOptions.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = statusOptions.length - 1
    }

    if (nextIndex !== currentIndex) {
      const nextOpt = statusOptions[nextIndex]
      onStatusChange(nextOpt.value)
      const btn = segmentRefs.current.get(nextOpt.value)
      btn?.focus()
    }
  }

  // Active filter info for removable chips
  const activeStatusOption =
    statusValue !== 'all'
      ? statusOptions.find((opt) => opt.value === statusValue)
      : null

  const activeDueOption =
    dueValue !== 'all'
      ? DEFAULT_DUE_OPTIONS.find((opt) => opt.value === dueValue)
      : null

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: Full-width 44px Search Box                             */}
      {/* ------------------------------------------------------------- */}
      <SearchInput
        id="assignment-search"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by title or description"
        ariaLabel="Search by title or description"
      />

      {/* ------------------------------------------------------------- */}
      {/* ROW 2: Segmented Control (Left) & Custom Dropdowns (Right)    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Segmented Control */}
        <div className="w-full lg:w-auto overflow-x-auto pb-0.5 lg:pb-0">
          <div
            role="radiogroup"
            aria-label={statusLabel}
            className="inline-flex rounded-md border border-line bg-surface-2 p-0.5 min-h-[40px] items-center"
          >
            {statusOptions.map((opt, idx) => {
              const isSelected = opt.value === statusValue
              const count = statusCounts[opt.value]

              return (
                <button
                  key={opt.value}
                  ref={(el) => {
                    if (el) segmentRefs.current.set(opt.value, el)
                    else segmentRefs.current.delete(opt.value)
                  }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${opt.label}${typeof count === 'number' ? ` ${count}` : ''}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => onStatusChange(opt.value)}
                  onKeyDown={(e) => handleSegmentKeyDown(e, idx)}
                  className={cn(
                    'h-[34px] px-3.5 rounded-md flex items-center text-xs font-medium cursor-pointer select-none whitespace-nowrap transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:z-10',
                    isSelected
                      ? 'bg-primary text-primary-fg font-semibold'
                      : 'text-muted hover:text-fg hover:bg-surface/60',
                  )}
                >
                  <span>
                    {opt.label}
                    {typeof count === 'number' ? ` (${count})` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Due Date & Sort Controls */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
          <Dropdown
            label="Due date"
            prefix="Due:"
            value={dueValue}
            options={DEFAULT_DUE_OPTIONS}
            onChange={(val) => onDueChange(val as DueFilter)}
            className="w-full lg:w-44"
          />

          <Dropdown
            label="Sort by"
            prefix="Sort:"
            value={sortValue}
            options={sortOptions}
            onChange={(val) => onSortChange(val as SortOption)}
            align="right"
            className="w-full lg:w-44"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 3: Active Filter Chips & Results Count Summary            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
        {/* Active Removable Chips */}
        {hasActiveFilters ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Search query chip */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-fg text-xs font-medium">
                <span>
                  Search: <span className="font-semibold">&ldquo;{searchQuery.trim()}&rdquo;</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Remove filter: Search query"
                  className="rounded-md text-muted hover:text-fg cursor-pointer p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            )}

            {/* Status filter chip */}
            {activeStatusOption && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-fg text-xs font-medium">
                <span>
                  Status: <span className="font-semibold">{activeStatusOption.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onStatusChange('all')}
                  aria-label="Remove filter: Status"
                  className="rounded-md text-muted hover:text-fg cursor-pointer p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            )}

            {/* Due date filter chip */}
            {activeDueOption && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-fg text-xs font-medium">
                <span>
                  Due: <span className="font-semibold">{activeDueOption.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onDueChange('all')}
                  aria-label="Remove filter: Due date"
                  className="rounded-md text-muted hover:text-fg cursor-pointer p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            )}

            {/* Clear all ghost button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-muted hover:text-fg h-[28px] px-2.5 rounded-md"
            >
              Clear all
            </Button>
          </div>
        ) : (
          <div />
        )}

        {/* Results count with live announcement */}
        <div
          id="assignment-results-count"
          tabIndex={-1}
          aria-live="polite"
          className="text-xs text-muted font-medium outline-none sm:ml-auto whitespace-nowrap"
        >
          Showing {resultCount} of {totalCount}{' '}
          {totalCount === 1 ? 'assignment' : 'assignments'}
          {hasActiveFilters && resultCount < totalCount && ' (filtered)'}
        </div>
      </div>
    </div>
  )
}
