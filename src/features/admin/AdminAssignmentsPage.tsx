import { useState, useRef, useMemo } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SkeletonCard,
  useToast,
} from '@/components/ui'
import {
  AdminAssignmentCard,
  AssignmentToolbar,
} from '@/components/assignments'
import { AssignmentFormModal } from '@/features/admin/AssignmentFormModal'
import { useAdminAssignments } from '@/features/admin/useAdminAssignments'
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters'
import {
  applyAdminAssignmentFilters,
  searchMatches,
  matchesDueFilter,
  matchesAdminCompletion,
  type AdminCompletionFilter,
  type SortOption,
} from '@/utils/filters'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'
import { mockApi } from '@/services/mockApi'
import type { AdminAssignment } from '@/types'

const ADMIN_COMPLETION_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Fully submitted', value: 'complete' },
  { label: 'Pending', value: 'incomplete' },
  { label: 'Nobody yet', value: 'nobody' },
]

const ADMIN_SORT_OPTIONS = [
  { label: 'Newest created', value: 'newest' as SortOption },
  { label: 'Soonest due', value: 'due_asc' as SortOption },
  { label: 'Furthest due', value: 'due_desc' as SortOption },
  { label: 'Title (A–Z)', value: 'title_asc' as SortOption },
]

export function AdminAssignmentsPage() {
  const { user } = useAuth()
  const { success } = useToast()
  usePageTitle('Assignments')

  const adminId = user?.id || ''
  const greetingName = getGreetingName(user?.name)
  const newAssignmentBtnRef = useRef<HTMLButtonElement>(null)

  const {
    assignments,
    students,
    status,
    error,
    reload,
    addAssignment,
    replaceAssignment,
    removeAssignment,
  } = useAdminAssignments()

  // Filter & Search URL hook
  const {
    filters,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    setFilter,
    clearFilters,
    hasActiveFilters,
  } = useAssignmentFilters<AdminCompletionFilter>({
    defaultSort: 'newest',
    validStatusValues: ['all', 'complete', 'incomplete', 'nobody'],
  })

  // Compute dynamic status counts based on active search & due filter
  const filteredBySearchAndDue = useMemo(() => {
    return assignments.filter((item) => {
      return searchMatches(item, debouncedQuery) && matchesDueFilter(item.dueDate, filters.due)
    })
  }, [assignments, debouncedQuery, filters.due])

  const statusCounts = useMemo(() => ({
    all: filteredBySearchAndDue.length,
    complete: filteredBySearchAndDue.filter((a) => matchesAdminCompletion(a, 'complete')).length,
    incomplete: filteredBySearchAndDue.filter((a) => matchesAdminCompletion(a, 'incomplete')).length,
    nobody: filteredBySearchAndDue.filter((a) => matchesAdminCompletion(a, 'nobody')).length,
  }), [filteredBySearchAndDue])

  // Filter & sort assignments
  const filteredAssignments = useMemo(
    () =>
      applyAdminAssignmentFilters(assignments, {
        query: debouncedQuery,
        completion: filters.status,
        due: filters.due,
        sort: filters.sort,
      }),
    [assignments, debouncedQuery, filters.due, filters.sort, filters.status],
  )

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] =
    useState<AdminAssignment | null>(null)

  // Delete dialog state
  const [deletingAssignment, setDeletingAssignment] =
    useState<AdminAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingAssignment(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (assignment: AdminAssignment) => {
    setEditingAssignment(assignment)
    setIsFormModalOpen(true)
  }

  const handleOpenDelete = (assignment: AdminAssignment) => {
    setDeletingAssignment(assignment)
    setDeleteError(null)
  }

  const handleCloseDelete = () => {
    if (isDeleting) return
    setDeletingAssignment(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await mockApi.deleteAssignment(adminId, deletingAssignment.id)
      removeAssignment(deletingAssignment.id)
      success('Assignment deleted')
      setDeletingAssignment(null)

      setTimeout(() => {
        newAssignmentBtnRef.current?.focus()
      }, 50)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to delete assignment. Please try again.'
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFormSuccess = (saved: AdminAssignment) => {
    if (editingAssignment) {
      replaceAssignment(saved)
    } else {
      addAssignment(saved)
    }

    setTimeout(() => {
      const cardEl = document.getElementById(`admin-assignment-card-${saved.id}`)
      cardEl?.focus()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Your assignments"
        description={`Signed in as ${greetingName} • ${assignments.length} ${
          assignments.length === 1 ? 'assignment' : 'assignments'
        }`}
        actions={
          <Button
            ref={newAssignmentBtnRef}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
            aria-label="Create new assignment"
          >
            New assignment
          </Button>
        }
      />

      {/* 2. Loading State */}
      {status === 'loading' && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in"
          aria-busy="true"
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* 3. Error State */}
      {status === 'error' && (
        <ErrorState
          title="Could not load assignments"
          message={error || 'An unexpected error occurred while loading assignments.'}
          onRetry={reload}
          retryLabel="Try again"
        />
      )}

      {/* 4. Total Empty State (zero assignments initially) */}
      {status === 'success' && assignments.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6 text-accent" />}
          title="No assignments yet"
          description="You haven't created any assignments yet. Add your first assignment to share deliverables and track student progress."
          action={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Create your first assignment
            </Button>
          }
        />
      )}

      {/* 5. Toolbar & Assignments Grid */}
      {status === 'success' && assignments.length > 0 && (
        <div className="space-y-6">
          <AssignmentToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusValue={filters.status}
            onStatusChange={(val) =>
              setFilter('status', val as AdminCompletionFilter)
            }
            statusOptions={ADMIN_COMPLETION_OPTIONS}
            statusCounts={statusCounts}
            statusLabel="Completion status"
            dueValue={filters.due}
            onDueChange={(due) => setFilter('due', due)}
            sortValue={filters.sort}
            onSortChange={(sort) => setFilter('sort', sort)}
            sortOptions={ADMIN_SORT_OPTIONS}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            resultCount={filteredAssignments.length}
            totalCount={assignments.length}
          />

          {filteredAssignments.length === 0 ? (
            <EmptyState
              title="No matching assignments"
              description="No assignments match your search query and filters. Try adjusting or clearing your filters."
              action={
                <Button variant="secondary" size="md" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <section aria-labelledby="admin-assignments-list-heading">
              <h2 id="admin-assignments-list-heading" className="sr-only">
                Course assignments list
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                  <AdminAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    searchQuery={debouncedQuery}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 6. Create / Edit Assignment Modal */}
      <AssignmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialAssignment={editingAssignment}
        students={students}
        adminId={adminId}
        onSuccess={handleFormSuccess}
      />

      {/* 7. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAssignment)}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete this assignment?"
        tone="danger"
        confirmLabel="Delete assignment"
        cancelLabel="Keep assignment"
        loading={isDeleting}
        errorContent={
          deleteError ? (
            <p className="text-xs text-danger font-medium">{deleteError}</p>
          ) : undefined
        }
        message={
          deletingAssignment ? (
            <span>
              Are you sure you want to permanently delete{' '}
              <strong className="text-fg font-semibold">
                &ldquo;{deletingAssignment.title}&rdquo;
              </strong>
              ? All {deletingAssignment.submittedCount} student submission{' '}
              {deletingAssignment.submittedCount === 1 ? 'record' : 'records'}{' '}
              for this assignment will also be permanently deleted. This action
              cannot be undone.
            </span>
          ) : (
            ''
          )
        }
      />
    </div>
  )
}
