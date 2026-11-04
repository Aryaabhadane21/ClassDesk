import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui'
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

const DEFAULT_DUE_OPTIONS: SelectOptionItem<DueFilter>[] = [
  { label: 'All deadlines', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due today', value: 'today' },
  { label: 'Due this week', value: 'week' },
  { label: 'Due later', value: 'later' },
]

const DEFAULT_SORT_OPTIONS: SelectOptionItem<SortOption>[] = [
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
  return (
    <div className={cn('space-y-3', className)}>
      {/* 1. Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search input with live clear & Esc key */}
        <div className="relative flex-1 min-w-0">
          <label htmlFor="assignment-search" className="sr-only">
            Search assignments
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3 text-muted pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              <Search className="w-4 h-4" />
            </span>
            <input
              id="assignment-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onSearchChange('')
                }
              }}
              placeholder="Search by title or description..."
              aria-label="Search assignments"
              className={cn(
                'w-full pl-9 pr-9 py-2 rounded-pill bg-surface border border-line text-fg text-xs font-body',
                'placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                'motion-safe:transition-all',
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 p-1 rounded-pill text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer motion-safe:transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns & Reset controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2">
          {/* Status / Completion Select */}
          <div className="w-full lg:w-auto">
            <label htmlFor="filter-status" className="sr-only">
              {statusLabel}
            </label>
            <select
              id="filter-status"
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label={statusLabel}
              className={cn(
                'w-full lg:w-auto px-3 py-2 rounded-pill bg-surface border border-line text-fg text-xs font-medium cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                'motion-safe:transition-all',
              )}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due date Select */}
          <div className="w-full lg:w-auto">
            <label htmlFor="filter-due" className="sr-only">
              Due date
            </label>
            <select
              id="filter-due"
              value={dueValue}
              onChange={(e) => onDueChange(e.target.value as DueFilter)}
              aria-label="Filter by due date"
              className={cn(
                'w-full lg:w-auto px-3 py-2 rounded-pill bg-surface border border-line text-fg text-xs font-medium cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                'motion-safe:transition-all',
              )}
            >
              {DEFAULT_DUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="w-full lg:w-auto col-span-2 sm:col-span-1">
            <label htmlFor="filter-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="filter-sort"
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort assignments by"
              className={cn(
                'w-full lg:w-auto px-3 py-2 rounded-pill bg-surface border border-line text-fg text-xs font-medium cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                'motion-safe:transition-all',
              )}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters ghost button */}
          {hasActiveFilters && (
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex justify-start lg:justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-muted hover:text-fg hover:bg-surface-2 h-[34px]"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Results count summary with live announcement */}
      <div
        id="assignment-results-count"
        tabIndex={-1}
        aria-live="polite"
        className="text-xs text-muted font-medium outline-none"
      >
        Showing {resultCount} of {totalCount}{' '}
        {totalCount === 1 ? 'assignment' : 'assignments'}
        {hasActiveFilters && resultCount < totalCount && ' (filtered)'}
      </div>
    </div>
  )
}
