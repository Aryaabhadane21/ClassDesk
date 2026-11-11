import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FolderGit2,
  Info,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Eyebrow,
  Skeleton,
  StatCard,
  useToast,
} from '@/components/ui'
import { JoinCodeChip } from '@/components/courses'
import {
  AssignmentToolbar,
  CourseAssignmentFormModal,
  ProfessorAssignmentCard,
  type SelectOptionItem,
} from '@/components/assignments'
import { useAuth } from '@/context/AuthContext'
import { useProfessorCourse } from '@/features/admin/useProfessorCourse'
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError, mockApi } from '@/services/mockApi'
import { matchesDueFilter, searchMatches, type AdminCompletionFilter, type SortOption } from '@/utils/filters'
import { getCourseAssignmentStats } from '@/utils/stats'
import type { ProfessorCourseAssignment } from '@/types'

const PROFESSOR_STATUS_OPTIONS: SelectOptionItem<AdminCompletionFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'complete' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'No submissions', value: 'nobody' },
]

const PROFESSOR_SORT_OPTIONS: SelectOptionItem<SortOption>[] = [
  { label: 'Soonest due', value: 'due_asc' },
  { label: 'Furthest due', value: 'due_desc' },
  { label: 'Newest created', value: 'newest' },
  { label: 'Title (A–Z)', value: 'title_asc' },
]

function matchesCompletionFilter(
  item: ProfessorCourseAssignment,
  completion: AdminCompletionFilter,
): boolean {
  if (completion === 'all') return true
  const total = item.tracking.total
  const submitted = item.tracking.submitted

  if (completion === 'complete') {
    return total > 0 && submitted >= total
  }
  if (completion === 'incomplete') {
    return submitted < total
  }
  if (completion === 'nobody') {
    return submitted === 0
  }
  return true
}

function sortProfessorCourseAssignments(
  items: ProfessorCourseAssignment[],
  sort: SortOption = 'due_asc',
): ProfessorCourseAssignment[] {
  const indexed = items.map((item, index) => ({ item, index }))

  indexed.sort((a, b) => {
    let diff = 0
    switch (sort) {
      case 'due_asc':
        diff =
          new Date(a.item.assignment.dueDate).getTime() -
          new Date(b.item.assignment.dueDate).getTime()
        break
      case 'due_desc':
        diff =
          new Date(b.item.assignment.dueDate).getTime() -
          new Date(a.item.assignment.dueDate).getTime()
        break
      case 'newest':
        diff =
          new Date(b.item.assignment.createdAt).getTime() -
          new Date(a.item.assignment.createdAt).getTime()
        break
      case 'title_asc':
        diff = a.item.assignment.title.localeCompare(b.item.assignment.title)
        break
    }
    return diff !== 0 ? diff : a.index - b.index
  })

  return indexed.map((entry) => entry.item)
}

export function ProfessorCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success } = useToast()

  const {
    course,
    students,
    groups,
    assignments,
    status,
    error,
    reload,
    upsertAssignment,
    removeAssignment,
  } = useProfessorCourse(courseId)

  usePageTitle(course ? `${course.name} · ClassDesk` : 'Course · ClassDesk')

  // Modal & Dialog state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProfessorCourseAssignment | null>(null)
  const [deletingItem, setDeletingItem] = useState<ProfessorCourseAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  // Filters & Search hook
  const {
    filters,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    setFilter,
    clearFilters,
    hasActiveFilters,
  } = useAssignmentFilters<AdminCompletionFilter>({
    defaultSort: 'due_asc',
    validStatusValues: ['all', 'complete', 'incomplete', 'nobody'],
  })

  // Assignment statistics
  const assignmentStats = useMemo(() => getCourseAssignmentStats(assignments), [assignments])

  // Count active group assignments
  const hasGroupAssignments = useMemo(
    () => assignments.some((a) => a.assignment.submissionType === 'group'),
    [assignments],
  )

  // Filtered by search and due filter (for status counters)
  const filteredBySearchAndDue = useMemo(() => {
    return assignments.filter((item) => {
      return (
        searchMatches(item.assignment, debouncedQuery) &&
        matchesDueFilter(item.assignment.dueDate, filters.due)
      )
    })
  }, [assignments, debouncedQuery, filters.due])

  const statusCounts = useMemo(
    () => ({
      all: filteredBySearchAndDue.length,
      complete: filteredBySearchAndDue.filter((a) =>
        matchesCompletionFilter(a, 'complete'),
      ).length,
      incomplete: filteredBySearchAndDue.filter((a) =>
        matchesCompletionFilter(a, 'incomplete'),
      ).length,
      nobody: filteredBySearchAndDue.filter((a) =>
        matchesCompletionFilter(a, 'nobody'),
      ).length,
    }),
    [filteredBySearchAndDue],
  )

  // Filtered & sorted assignments list
  const filteredAssignments = useMemo(() => {
    const filtered = assignments.filter((item) => {
      if (!searchMatches(item.assignment, debouncedQuery)) return false
      if (!matchesDueFilter(item.assignment.dueDate, filters.due)) return false
      if (!matchesCompletionFilter(item, filters.status)) return false
      return true
    })
    return sortProfessorCourseAssignments(filtered, filters.sort)
  }, [assignments, debouncedQuery, filters.due, filters.sort, filters.status])

  // Handlers for creating, editing, and deleting assignments
  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsFormModalOpen(true)
  }

  const handleEdit = (item: ProfessorCourseAssignment, triggerEl: HTMLElement) => {
    lastTriggerRef.current = triggerEl
    setEditingItem(item)
    setIsFormModalOpen(true)
  }

  const handleDeletePrompt = (item: ProfessorCourseAssignment, triggerEl: HTMLElement) => {
    lastTriggerRef.current = triggerEl
    setDeletingItem(item)
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !user) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await mockApi.deleteCourseAssignment(user.id, deletingItem.assignment.id)
      success('Assignment deleted')
      removeAssignment(deletingItem.assignment.id)
      setDeletingItem(null)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
      } else {
        setDeleteError('Failed to delete assignment. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // 1. Loading state
  if (status === 'loading') {
    return (
      <div className="space-y-8" aria-busy="true">
        {/* Back Link Skeleton */}
        <Skeleton className="h-5 w-28 rounded-sm" />

        {/* Header Skeleton */}
        <div className="space-y-3 border-b border-line pb-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-2/3 max-w-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-pill" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        {/* Overview Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 flex items-center gap-3.5 bg-surface border border-line rounded-lg"
              >
                <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-pill shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments Section Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Not found or unauthorized
  if (status === 'not_found' || !course) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-muted" />}
          title="We couldn't find that course"
          description="This course may have been removed or you might not have permission to view it."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin')}
            >
              Back to courses
            </Button>
          }
        />
      </div>
    )
  }

  // 3. Error state
  if (status === 'error') {
    return (
      <div className="py-8">
        <ErrorState
          title="Error loading course"
          message={error || 'An unexpected error occurred.'}
          onRetry={reload}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left">
      {/* Back Link */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to courses</span>
        </Link>
      </div>

      {/* Course Header */}
      <div>
        <Eyebrow>{course.code} · {course.semester}</Eyebrow>
        <PageHeader
          title={course.name}
          description={course.description}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <JoinCodeChip
                code={course.joinCode}
                courseName={course.name}
                size="md"
              />
              <Button
                type="button"
                variant="primary"
                onClick={handleOpenCreate}
              >
                <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                New assignment
              </Button>
            </div>
          }
        />
      </div>

      {/* OVERVIEW SECTION */}
      <section aria-labelledby="overview-heading" className="space-y-3">
        <Eyebrow id="overview-heading">Overview</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Students"
            value={students.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Groups"
            value={groups.length}
            icon={<FolderGit2 className="w-5 h-5" />}
          />
          <StatCard
            label="Assignments"
            value={assignments.length}
            icon={<ClipboardList className="w-5 h-5" />}
          />
          <StatCard
            label="Overdue"
            value={assignmentStats.overdueCount}
            tone={assignmentStats.overdueCount > 0 ? 'danger' : 'default'}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* ASSIGNMENTS SECTION */}
      <section aria-labelledby="assignments-heading" className="space-y-4">
        <Eyebrow id="assignments-heading">Assignments</Eyebrow>

        {/* Assignment Toolbar */}
        <AssignmentToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={filters.status}
          onStatusChange={(v) => setFilter('status', v as AdminCompletionFilter)}
          statusOptions={PROFESSOR_STATUS_OPTIONS}
          statusCounts={statusCounts}
          statusLabel="Submissions"
          dueValue={filters.due}
          onDueChange={(v) => setFilter('due', v)}
          sortValue={filters.sort}
          onSortChange={(v) => setFilter('sort', v)}
          sortOptions={PROFESSOR_SORT_OPTIONS}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          resultCount={filteredAssignments.length}
          totalCount={assignments.length}
        />

        {/* Info notice if course has group assignments but 0 groups */}
        {hasGroupAssignments && groups.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-surface-2/60 border border-line text-xs text-muted">
            <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
            <span>
              Students haven't created any groups yet. Students can form groups on their
              course page.
            </span>
          </div>
        )}

        {/* Assignment Grid or Empty States */}
        {assignments.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<ClipboardList className="w-10 h-10 text-muted" />}
              title="No assignments in this course yet"
              description="Create your first assignment to get students started."
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleOpenCreate}
                >
                  <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Create the first assignment
                </Button>
              }
            />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Search className="w-10 h-10 text-muted" />}
              title="No matching assignments"
              description="Try adjusting your search or filters."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredAssignments.map((item) => (
              <ProfessorAssignmentCard
                key={item.assignment.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDeletePrompt}
                searchQuery={debouncedQuery}
              />
            ))}
          </div>
        )}
      </section>

      {/* Course Assignment Creation / Edit Modal */}
      {user && (
        <CourseAssignmentFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false)
            setEditingItem(null)
          }}
          courseId={course.id}
          professorId={user.id}
          enrolledStudents={students}
          initialItem={editingItem}
          onSuccess={(saved) => {
            upsertAssignment(saved)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingItem(null)
            setDeleteError(null)
          }
        }}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete assignment?"
        message={
          deletingItem ? (
            <span>
              Are you sure you want to delete{' '}
              <strong className="text-fg font-semibold">"{deletingItem.assignment.title}"</strong>?
              All student submission records and acknowledgements for this assignment will
              be permanently removed. This cannot be undone.
            </span>
          ) : null
        }
        confirmLabel="Delete assignment"
        cancelLabel="Cancel"
        tone="danger"
        loading={isDeleting}
        errorContent={
          deleteError ? (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 rounded-md bg-danger-soft text-danger text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{deleteError}</span>
            </div>
          ) : null
        }
      />
    </div>
  )
}
