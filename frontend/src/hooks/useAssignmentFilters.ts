import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import type { DueFilter, SortOption } from '@/utils/filters'

export interface FilterState<S = string> {
  q: string
  status: S
  due: DueFilter
  sort: SortOption
}

const VALID_DUES: DueFilter[] = ['all', 'overdue', 'today', 'week', 'later']
const VALID_SORTS: SortOption[] = ['due_asc', 'due_desc', 'newest', 'title_asc']

export interface UseAssignmentFiltersOptions<S extends string> {
  defaultSort?: SortOption
  validStatusValues?: S[]
}

export function useAssignmentFilters<S extends string = string>({
  defaultSort = 'due_asc',
  validStatusValues,
}: UseAssignmentFiltersOptions<S> = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Parse & validate params from URL
  const urlQ = searchParams.get('q') || ''

  const rawStatus = (searchParams.get('status') || 'all') as S
  const status: S =
    validStatusValues && !validStatusValues.includes(rawStatus)
      ? ('all' as S)
      : rawStatus

  const rawDue = searchParams.get('due') as DueFilter
  const due: DueFilter = VALID_DUES.includes(rawDue) ? rawDue : 'all'

  const rawSort = searchParams.get('sort') as SortOption
  const sort: SortOption = VALID_SORTS.includes(rawSort) ? rawSort : defaultSort

  // 2. Local search query for immediate input responsiveness
  const [searchQuery, setSearchQuery] = useState(urlQ)
  const debouncedQuery = useDebounce(searchQuery, 250)

  // Keep local query in sync if URL q changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setSearchQuery(urlQ)
  }, [urlQ])

  // Sync debounced search to URL
  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    const trimmed = debouncedQuery.trim()

    if (trimmed !== currentQ) {
      const next = new URLSearchParams(searchParams)
      if (trimmed) {
        next.set('q', trimmed)
      } else {
        next.delete('q')
      }
      setSearchParams(next, { replace: true })
    }
  }, [debouncedQuery, searchParams, setSearchParams])

  // Update a single filter in the URL
  const setFilter = useCallback(
    <K extends keyof FilterState<S>>(key: K, value: FilterState<S>[K]) => {
      if (key === 'q') {
        setSearchQuery(value as string)
        return
      }

      const next = new URLSearchParams(searchParams)

      if (key === 'status') {
        if (value === 'all') next.delete('status')
        else next.set('status', value as string)
      } else if (key === 'due') {
        if (value === 'all') next.delete('due')
        else next.set('due', value as string)
      } else if (key === 'sort') {
        if (value === defaultSort) next.delete('sort')
        else next.set('sort', value as string)
      }

      setSearchParams(next, { replace: true })
    },
    [defaultSort, searchParams, setSearchParams],
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    next.delete('status')
    next.delete('due')
    next.delete('sort')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const hasActiveFilters = useMemo(() => {
    const hasQuery = Boolean(searchQuery.trim())
    const hasStatus = status !== 'all'
    const hasDue = due !== 'all'
    const hasSort = sort !== defaultSort
    return hasQuery || hasStatus || hasDue || hasSort
  }, [searchQuery, status, due, sort, defaultSort])

  const filters: FilterState<S> = useMemo(
    () => ({
      q: searchQuery,
      status,
      due,
      sort,
    }),
    [searchQuery, status, due, sort],
  )

  return {
    filters,
    searchQuery,
    setSearchQuery,
    debouncedQuery: debouncedQuery.trim(),
    setFilter,
    clearFilters,
    hasActiveFilters,
  }
}
