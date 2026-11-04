import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
  useToast,
} from '@/components/ui'
import {
  AssignmentToolbar,
  ProgressSummary,
  StudentAssignmentCard,
} from '@/components/assignments'
import { SubmitConfirmation } from '@/features/student/SubmitConfirmation'
import { useAuth } from '@/context/AuthContext'
import { useStudentAssignments } from '@/features/student/useStudentAssignments'
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters'
import {
  matchesDueFilter,
  searchMatches,
  sortAssignments,
  type StudentStatusFilter,
} from '@/utils/filters'
import { mockApi, ApiError } from '@/services/mockApi'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'
import type { StudentAssignment } from '@/types'

const STUDENT_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'To do', value: 'todo' },
  { label: 'Submitted', value: 'submitted' },
]

export function StudentDashboardPage() {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  usePageTitle('Your Assignments')

  const greetingName = getGreetingName(user?.name)
  const { assignments, status, error, reload, updateAssignment, counts } =
    useStudentAssignments()

  // Filter & Search URL hook
  const {
    filters,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    setFilter,
    clearFilters,
    hasActiveFilters,
  } = useAssignmentFilters<StudentStatusFilter>({
    defaultSort: 'due_asc',
    validStatusValues: ['all', 'todo', 'submitted'],
  })

  // Two-step submission confirmation flow state
  const [pendingAssignment, setPendingAssignment] =
    useState<StudentAssignment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 3. Compute status counts based on current search & due filter
  const filteredBySearchAndDue = useMemo(() => {
    return assignments.filter((item) => {
      return searchMatches(item, debouncedQuery) && matchesDueFilter(item.dueDate, filters.due)
    })
  }, [assignments, debouncedQuery, filters.due])

  const statusCounts = useMemo(() => ({
    all: filteredBySearchAndDue.length,
    todo: filteredBySearchAndDue.filter((a) => a.status !== 'submitted').length,
    submitted: filteredBySearchAndDue.filter((a) => a.status === 'submitted').length,
  }), [filteredBySearchAndDue])

  // Partition, filter, and sort assignments
  const { todoAssignments, submittedAssignments, totalFiltered } = useMemo(() => {
    // 1. Filter "To do"
    let todo: StudentAssignment[] = []
    if (filters.status !== 'submitted') {
      todo = assignments.filter((a) => {
        if (a.status === 'submitted') return false
        if (!searchMatches(a, debouncedQuery)) return false
        if (!matchesDueFilter(a.dueDate, filters.due)) return false
        return true
      })
      // Sorting inside todo
      todo = sortAssignments(todo, filters.sort)
    }

    // 2. Filter "Submitted"
    let submitted: StudentAssignment[] = []
    if (filters.status !== 'todo') {
      submitted = assignments.filter((a) => {
        if (a.status !== 'submitted') return false
        if (!searchMatches(a, debouncedQuery)) return false
        if (!matchesDueFilter(a.dueDate, filters.due)) return false
        return true
      })

      // If user chose non-default sort, apply it; otherwise keep recency order
      if (filters.sort !== 'due_asc') {
        submitted = sortAssignments(submitted, filters.sort)
      } else {
        submitted.sort((a, b) => {
          const timeA = new Date(a.submittedAt || a.updatedAt).getTime()
          const timeB = new Date(b.submittedAt || b.updatedAt).getTime()
          return timeB - timeA // Most recently submitted first
        })
      }
    }

    return {
      todoAssignments: todo,
      submittedAssignments: submitted,
      totalFiltered: todo.length + submitted.length,
    }
  }, [assignments, debouncedQuery, filters.due, filters.sort, filters.status])

  // Open confirmation dialog
  const handleSubmitClick = (
    assignment: StudentAssignment,
    buttonEl: HTMLButtonElement,
  ) => {
    triggerButtonRef.current = buttonEl
    setPendingAssignment(assignment)
    setSubmitError(null)
  }

  // Cancel flow: Close and return focus to trigger button
  const handleCancelSubmit = () => {
    setPendingAssignment(null)
    setSubmitError(null)
    setTimeout(() => {
      triggerButtonRef.current?.focus()
    }, 50)
  }

  // Final confirmation execution
  const handleConfirmSubmit = async () => {
    if (!user || !pendingAssignment || isSubmitting) return

    const assignmentId = pendingAssignment.id
    const assignmentTitle = pendingAssignment.title

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const updated = await mockApi.markSubmitted(user.id, assignmentId)

      if (!isMountedRef.current) return

      // In-place state update
      updateAssignment(updated)
      setPendingAssignment(null)
      success(`Marked as submitted: ${assignmentTitle}`, 'Submission Confirmed')

      // If filter hides the submitted card (e.g. status === 'todo'), move focus to results count
      setTimeout(() => {
        const cardEl = document.getElementById(`assignment-card-${assignmentId}`)
        if (cardEl && document.body.contains(cardEl)) {
          cardEl.focus()
        } else {
          const resultsCountEl = document.getElementById(
            'assignment-results-count',
          )
          resultsCountEl?.focus()
        }
      }, 100)
    } catch (err) {
      if (!isMountedRef.current) return

      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to mark assignment as submitted.'
      setSubmitError(errorMsg)

      if (err instanceof ApiError && err.code !== 'VALIDATION') {
        toastError(errorMsg, 'Submission Failed')
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Your assignments"
        description={`Hello, ${greetingName}! Track your homework, deadlines, and completed deliverables.`}
      />

      {/* 2. Loading State */}
      {status === 'loading' && (
        <div className="space-y-8 animate-fade-in" aria-busy="true">
          <Skeleton className="h-32 w-full" rounded="lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" rounded="pill" />
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {status === 'error' && (
        <ErrorState
          title="Could not load assignments"
          message={
            error || 'An unexpected error occurred while loading your assignments.'
          }
          onRetry={reload}
          retryLabel="Try again"
        />
      )}

      {/* 4. Total Empty State (Zero assignments from seed/api) */}
      {status === 'success' && assignments.length === 0 && (
        <div className="space-y-6">
          <ProgressSummary submitted={0} total={0} />
          <EmptyState
            title="No assignments yet"
            description="You have not been assigned any course deliverables yet. Check back soon for new assignments."
          />
        </div>
      )}

      {/* 5. Success Content */}
      {status === 'success' && assignments.length > 0 && (
        <div className="space-y-8">
          {/* Progress Summary Card: ALWAYS reflects the full set of assignments */}
          <ProgressSummary submitted={counts.submitted} total={counts.total} />

          {/* Shared Toolbar between progress and groups */}
          <AssignmentToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusValue={filters.status}
            onStatusChange={(val) => setFilter('status', val as StudentStatusFilter)}
            statusOptions={STUDENT_STATUS_OPTIONS}
            statusCounts={statusCounts}
            statusLabel="Submission status"
            dueValue={filters.due}
            onDueChange={(due) => setFilter('due', due)}
            sortValue={filters.sort}
            onSortChange={(sort) => setFilter('sort', sort)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            resultCount={totalFiltered}
            totalCount={assignments.length}
          />

          {/* Filter Empty State (no matches after filtering) */}
          {totalFiltered === 0 ? (
            <EmptyState
              title="No matching assignments"
              description="No assignments match your search query and filters. Try clearing some filters to see more assignments."
              action={
                <Button variant="secondary" size="md" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-10">
              {/* Group 1: To do (Not submitted) */}
              {todoAssignments.length > 0 && (
                <section className="space-y-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                      To do
                    </h2>
                    <Badge tone="neutral" size="sm">
                      {todoAssignments.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {todoAssignments.map((assignment) => (
                      <StudentAssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onSubmitClick={handleSubmitClick}
                        searchQuery={debouncedQuery}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group 2: Submitted */}
              {submittedAssignments.length > 0 && (
                <section className="space-y-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                      Submitted
                    </h2>
                    <Badge tone="success" size="sm">
                      {submittedAssignments.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {submittedAssignments.map((assignment) => (
                      <StudentAssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        searchQuery={debouncedQuery}
                        className="motion-safe:animate-fade-in"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission Confirmation Dialog */}
      <SubmitConfirmation
        isOpen={Boolean(pendingAssignment)}
        assignment={pendingAssignment}
        loading={isSubmitting}
        error={submitError}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
    </div>
  )
}
