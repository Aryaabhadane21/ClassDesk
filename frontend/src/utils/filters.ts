import { getDueInfo } from '@/utils/dates'
import type { AdminAssignment, StudentAssignment } from '@/types'

export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'later'
export type StudentStatusFilter = 'all' | 'todo' | 'submitted'
export type AdminCompletionFilter = 'all' | 'complete' | 'incomplete' | 'nobody'
export type SortOption = 'due_asc' | 'due_desc' | 'newest' | 'title_asc'

export interface BaseAssignment {
  id: string
  title: string
  description: string
  dueDate: string
  createdAt: string
}

/**
 * Case-insensitive search on title and description.
 */
export function searchMatches(
  item: { title: string; description: string },
  query?: string,
): boolean {
  if (!query) return true
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true
  return (
    item.title.toLowerCase().includes(trimmed) ||
    item.description.toLowerCase().includes(trimmed)
  )
}

/**
 * Checks if a due date matches the specified due filter.
 * Reuses getDueInfo from src/utils/dates.ts.
 */
export function matchesDueFilter(
  dueDate: string,
  filter: DueFilter = 'all',
  now: Date = new Date(),
): boolean {
  if (filter === 'all') return true

  const dueInfo = getDueInfo(dueDate, now)
  const dueTime = new Date(dueDate).getTime()
  const nowTime = now.getTime()
  const diffMs = dueTime - nowTime
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  switch (filter) {
    case 'overdue':
      return dueInfo.state === 'overdue'
    case 'today':
      return dueInfo.state === 'due_today'
    case 'week':
      // Within the next 7 days, not overdue
      return diffMs >= 0 && diffDays <= 7
    case 'later':
      // More than 7 days in future
      return diffDays > 7
    default:
      return true
  }
}

/**
 * Checks student assignment status filter.
 */
export function matchesStudentStatus(
  item: StudentAssignment,
  status: StudentStatusFilter = 'all',
): boolean {
  if (status === 'all') return true
  if (status === 'todo') return item.status !== 'submitted'
  if (status === 'submitted') return item.status === 'submitted'
  return true
}

/**
 * Checks admin assignment completion filter.
 */
export function matchesAdminCompletion(
  item: AdminAssignment,
  completion: AdminCompletionFilter = 'all',
): boolean {
  if (completion === 'all') return true
  if (completion === 'complete') {
    return item.totalCount > 0 && item.submittedCount >= item.totalCount
  }
  if (completion === 'incomplete') {
    return item.submittedCount < item.totalCount
  }
  if (completion === 'nobody') {
    return item.submittedCount === 0
  }
  return true
}

/**
 * Stable sort comparator for assignments.
 */
export function sortAssignments<T extends BaseAssignment>(
  items: T[],
  sort: SortOption = 'due_asc',
): T[] {
  const indexed = items.map((item, index) => ({ item, index }))

  indexed.sort((a, b) => {
    let diff = 0
    switch (sort) {
      case 'due_asc':
        diff =
          new Date(a.item.dueDate).getTime() - new Date(b.item.dueDate).getTime()
        break
      case 'due_desc':
        diff =
          new Date(b.item.dueDate).getTime() - new Date(a.item.dueDate).getTime()
        break
      case 'newest':
        diff =
          new Date(b.item.createdAt).getTime() -
          new Date(a.item.createdAt).getTime()
        break
      case 'title_asc':
        diff = a.item.title.localeCompare(b.item.title)
        break
    }
    // Stable tie-breaker by original array index
    return diff !== 0 ? diff : a.index - b.index
  })

  return indexed.map((entry) => entry.item)
}

/**
 * Generic filter and sort application for StudentAssignments.
 */
export function applyStudentAssignmentFilters(
  items: StudentAssignment[],
  filters: {
    query?: string
    status?: StudentStatusFilter
    due?: DueFilter
    sort?: SortOption
  },
  now: Date = new Date(),
): StudentAssignment[] {
  const filtered = items.filter((item) => {
    if (!searchMatches(item, filters.query)) return false
    if (!matchesDueFilter(item.dueDate, filters.due, now)) return false
    if (!matchesStudentStatus(item, filters.status)) return false
    return true
  })

  return sortAssignments(filtered, filters.sort ?? 'due_asc')
}

/**
 * Generic filter and sort application for AdminAssignments.
 */
export function applyAdminAssignmentFilters(
  items: AdminAssignment[],
  filters: {
    query?: string
    completion?: AdminCompletionFilter
    due?: DueFilter
    sort?: SortOption
  },
  now: Date = new Date(),
): AdminAssignment[] {
  const filtered = items.filter((item) => {
    if (!searchMatches(item, filters.query)) return false
    if (!matchesDueFilter(item.dueDate, filters.due, now)) return false
    if (!matchesAdminCompletion(item, filters.completion)) return false
    return true
  })

  return sortAssignments(filtered, filters.sort ?? 'newest')
}
