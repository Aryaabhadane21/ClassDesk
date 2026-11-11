import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Crown,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StudentAssignmentCard } from '@/components/assignments/StudentAssignmentCard'
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Eyebrow,
  ProgressBar,
  SearchInput,
  Skeleton,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useStudentCourseAssignments } from '@/features/student/useStudentCourseAssignments'
import { searchMatches } from '@/utils/filters'
import type { Assignment } from '@/types'
import { cn } from '@/utils/cn'

type StatusFilter = 'all' | 'pending' | 'done' | 'overdue'
type SortOrder = 'due_asc' | 'due_desc'

export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { success: toastSuccess, error: toastError } = useToast()

  const {
    course,
    assignments,
    status,
    errorMessage,
    reload,
    submitIndividual,
    submitGroup,
  } = useStudentCourseAssignments(courseId)

  usePageTitle(course ? `${course.name} · ClassDesk` : 'Course · ClassDesk')

  // URL state synchronization
  const searchQuery = searchParams.get('search') || ''
  const statusFilter = (searchParams.get('filter') as StatusFilter) || 'all'
  const sortOrder = (searchParams.get('sort') as SortOrder) || 'due_asc'

  // Submission dialog state
  const [pendingAssignment, setPendingAssignment] = useState<Assignment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)

  const updateUrlParams = (updates: { search?: string; filter?: string; sort?: string }) => {
    const nextParams = new URLSearchParams(searchParams)

    if (updates.search !== undefined) {
      if (updates.search.trim()) {
        nextParams.set('search', updates.search)
      } else {
        nextParams.delete('search')
      }
    }

    if (updates.filter !== undefined) {
      if (updates.filter && updates.filter !== 'all') {
        nextParams.set('filter', updates.filter)
      } else {
        nextParams.delete('filter')
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== 'due_asc') {
        nextParams.set('sort', updates.sort)
      } else {
        nextParams.delete('sort')
      }
    }

    setSearchParams(nextParams, { replace: true })
  }

  // Filter & sort assignments
  const {
    filteredAssignments,
    totalCount,
    doneCount,
    pendingCount,
    overdueCount,
  } = useMemo(() => {
    const now = Date.now()
    const total = assignments.length
    let done = 0
    let pending = 0
    let overdue = 0

    for (const item of assignments) {
      const isDone = item.ack.acknowledged
      const isPastDue = new Date(item.assignment.dueDate).getTime() < now

      if (isDone) {
        done += 1
      } else if (isPastDue) {
        overdue += 1
      } else {
        pending += 1
      }
    }

    const filtered = assignments.filter((item) => {
      const isDone = item.ack.acknowledged
      const isPastDue = new Date(item.assignment.dueDate).getTime() < now

      // 1. Status Filter
      if (statusFilter === 'done' && !isDone) return false
      if (statusFilter === 'overdue' && (isDone || !isPastDue)) return false
      if (statusFilter === 'pending' && (isDone || isPastDue)) return false

      // 2. Search query filter
      if (searchQuery.trim()) {
        const matches = searchMatches(
          {
            title: item.assignment.title,
            description: item.assignment.description,
          },
          searchQuery,
        )
        if (!matches) return false
      }

      return true
    })

    // Sort by deadline
    filtered.sort((a, b) => {
      const timeA = new Date(a.assignment.dueDate).getTime()
      const timeB = new Date(b.assignment.dueDate).getTime()
      return sortOrder === 'due_desc' ? timeB - timeA : timeA - timeB
    })

    return {
      filteredAssignments: filtered,
      totalCount: total,
      doneCount: done,
      pendingCount: pending,
      overdueCount: overdue,
    }
  }, [assignments, statusFilter, searchQuery, sortOrder])

  const percentComplete =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const isAllComplete = totalCount > 0 && doneCount >= totalCount
  const hasActiveFilters = statusFilter !== 'all' || Boolean(searchQuery.trim())

  const handleClearFilters = () => {
    updateUrlParams({ search: '', filter: 'all' })
  }

  // Submission confirmation flow
  const handleOpenConfirm = (assignment: Assignment, triggerButton: HTMLButtonElement) => {
    lastTriggerRef.current = triggerButton
    setPendingAssignment(assignment)
    setSubmitError(null)
  }

  const handleCancelConfirm = () => {
    setPendingAssignment(null)
    setSubmitError(null)
    setTimeout(() => {
      lastTriggerRef.current?.focus()
    }, 50)
  }

  const handleExecuteSubmission = async () => {
    if (!pendingAssignment || !user || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    const assignmentId = pendingAssignment.id
    const assignmentTitle = pendingAssignment.title
    const isGroup = pendingAssignment.submissionType === 'group'

    try {
      if (isGroup) {
        await submitGroup(assignmentId)
        toastSuccess(`Acknowledged: ${assignmentTitle}`, 'Group Submission Confirmed')
      } else {
        await submitIndividual(assignmentId)
        toastSuccess(`Marked as submitted: ${assignmentTitle}`, 'Submission Confirmed')
      }

      setJustSubmittedId(assignmentId)
      setPendingAssignment(null)

      // Focus management: refocus card or results count
      setTimeout(() => {
        const cardEl = document.getElementById(`assignment-card-${assignmentId}`)
        if (cardEl && document.body.contains(cardEl)) {
          cardEl.focus()
        } else {
          document.getElementById('assignments-result-count')?.focus()
        }
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm submission.'
      setSubmitError(msg)
      toastError(msg, 'Submission Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1. Loading State
  if (status === 'loading') {
    return (
      <div className="space-y-6 text-left" aria-busy="true">
        <Skeleton className="h-5 w-28 rounded-sm" />
        <div className="space-y-3 border-b border-line pb-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Not found or unauthorized State
  if (status === 'not_found' || !course) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-muted" />}
          title="We couldn't find that course"
          description="This course may have been removed or you might not be enrolled in it."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/student')}
            >
              Back to courses
            </Button>
          }
        />
      </div>
    )
  }

  // 3. Error State
  if (status === 'error') {
    return (
      <div className="py-8">
        <ErrorState
          title="Error loading course"
          message={errorMessage || 'An unexpected error occurred.'}
          onRetry={() => void reload(false)}
        />
      </div>
    )
  }

  const isLeader = Boolean(course.myGroup && user && course.myGroup.leaderId === user.id)
  const isMember = Boolean(course.myGroup && !isLeader)

  return (
    <div className="space-y-6 text-left">
      {/* 1. Back Link */}
      <div>
        <Link
          to="/student"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to courses</span>
        </Link>
      </div>

      {/* 2. Course Header */}
      <div className="space-y-2 border-b border-line pb-6">
        <Eyebrow>{course.code} · {course.semester}</Eyebrow>
        <PageHeader
          title={course.name}
          description={course.description}
          className="border-b-0 pb-0 mb-0"
        />
      </div>

      {/* 3. Professor Profile, Group Status, and Course ProgressBar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Professor & Group Status */}
        <Card className="lg:col-span-2 p-5 bg-surface border border-line rounded-lg shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={course.professor.name} size="md" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted">Instructor</p>
              <p className="text-sm font-semibold text-fg">{course.professor.name}</p>
            </div>
          </div>

          {/* Group status chip */}
          <div className="select-none self-start sm:self-center">
            {isLeader && course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent-soft text-accent text-xs font-medium border border-accent/20">
                <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{course.myGroup.name} · Leader</span>
              </span>
            )}
            {isMember && course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-2 text-fg text-xs font-medium border border-line">
                <Users className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                <span>Member of {course.myGroup.name}</span>
              </span>
            )}
            {!course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-2 text-muted text-xs font-medium border border-line">
                <UserPlus className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                <span>No group yet</span>
              </span>
            )}
          </div>
        </Card>

        {/* Course ProgressBar ("2 of 3 done") */}
        <Card className="p-5 bg-surface border border-line rounded-lg shadow-card flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between text-xs font-medium tabular-nums">
            <span className="text-muted">
              {doneCount} of {totalCount} done
            </span>
            <span className="font-semibold text-fg">{percentComplete}%</span>
          </div>
          <ProgressBar
            value={doneCount}
            max={totalCount || 1}
            tone={isAllComplete ? 'success' : 'accent'}
            aria-label={`Course completion progress: ${doneCount} of ${totalCount} done`}
          />
        </Card>
      </div>

      {/* Anchor target for Step 11 group section */}
      <div id="groups" className="sr-only" aria-hidden="true" />

      {/* 4. Assignments Section */}
      <section aria-labelledby="assignments-heading" className="space-y-4 pt-2">
        <div className="space-y-1">
          <Eyebrow id="assignments-heading">Assignments</Eyebrow>
          <h2 className="font-display text-lg font-semibold text-fg tracking-tight">
            Course Deliverables{' '}
            <span className="text-muted text-sm font-normal tabular-nums">
              ({totalCount})
            </span>
          </h2>
        </div>

        {/* Zero assignments empty state */}
        {totalCount === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-muted" />}
              title="No assignments yet"
              description="Your professor hasn't posted any assignments for this course yet."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Toolbar: status tabs, search, and sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs: all / pending / done / overdue */}
              <div
                role="radiogroup"
                aria-label="Filter assignments by status"
                className="inline-flex rounded-pill border border-line bg-surface-2 p-0.5 min-h-[44px] items-center self-start overflow-x-auto max-w-full"
              >
                {[
                  { label: 'All', value: 'all' as const, count: totalCount },
                  { label: 'Pending', value: 'pending' as const, count: pendingCount },
                  { label: 'Done', value: 'done' as const, count: doneCount },
                  { label: 'Overdue', value: 'overdue' as const, count: overdueCount },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    role="radio"
                    aria-checked={statusFilter === tab.value}
                    aria-label={`${tab.label} (${tab.count})`}
                    onClick={() => updateUrlParams({ filter: tab.value })}
                    className={cn(
                      'h-[38px] px-3.5 rounded-pill flex items-center gap-2 text-xs font-medium cursor-pointer select-none whitespace-nowrap motion-safe:transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:z-10',
                      statusFilter === tab.value
                        ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                        : 'text-muted hover:text-fg hover:bg-surface/60',
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-pill font-mono',
                        statusFilter === tab.value
                          ? 'bg-primary-fg/20 text-primary-fg'
                          : 'bg-surface text-muted border border-line',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right controls: Search + Sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="w-full sm:w-64">
                  <SearchInput
                    value={searchQuery}
                    onChange={(val) => updateUrlParams({ search: val })}
                    placeholder="Search assignments..."
                    ariaLabel="Search assignments by title or description"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ArrowDownUp className="w-4 h-4 text-muted shrink-0 hidden sm:block" aria-hidden="true" />
                  <select
                    value={sortOrder}
                    onChange={(e) => updateUrlParams({ sort: e.target.value })}
                    className="h-10 px-3 rounded-md bg-surface border border-line text-xs font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer min-w-[170px]"
                    aria-label="Sort assignments by due date"
                  >
                    <option value="due_asc">Due date: earliest first</option>
                    <option value="due_desc">Due date: latest first</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live result count announcer */}
            <div
              id="assignments-result-count"
              tabIndex={-1}
              aria-live="polite"
              className="text-xs text-muted font-medium outline-none"
            >
              Showing {filteredAssignments.length} of {totalCount} assignments
              {hasActiveFilters && filteredAssignments.length < totalCount && ' (filtered)'}
            </div>

            {/* Zero results empty state */}
            {filteredAssignments.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<Search className="w-10 h-10 text-muted" />}
                  title="No matching assignments"
                  description="Try adjusting your search query or filter tab."
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearFilters}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              /* Grid of StudentAssignmentCards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((item) => (
                  <StudentAssignmentCard
                    key={item.assignment.id}
                    item={item}
                    onSubmitClick={handleOpenConfirm}
                    searchQuery={searchQuery}
                    isJustSubmitted={justSubmittedId === item.assignment.id}
                    onBurstComplete={() => setJustSubmittedId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Two-step Submission Confirmation Dialog */}
      {pendingAssignment && (
        <ConfirmDialog
          isOpen={Boolean(pendingAssignment)}
          tone="default"
          title={
            pendingAssignment.submissionType === 'group'
              ? 'Confirm group acknowledgement'
              : 'Confirm your submission'
          }
          message={
            pendingAssignment.submissionType === 'group'
              ? `You're about to acknowledge "${pendingAssignment.title}" on behalf of your group. Your professor and teammates will see it as acknowledged right away. Please make sure your team's work is uploaded to the OneDrive folder first.`
              : `You're about to mark "${pendingAssignment.title}" as submitted. Your professor will see it as submitted right away. Please make sure your work is uploaded to the OneDrive link first.`
          }
          confirmLabel={
            pendingAssignment.submissionType === 'group'
              ? 'Yes, confirm acknowledgement'
              : 'Yes, confirm submission'
          }
          cancelLabel="Not yet"
          loading={isSubmitting}
          onConfirm={handleExecuteSubmission}
          onCancel={handleCancelConfirm}
          errorContent={
            submitError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-md bg-danger-soft/70 border border-danger/30 text-danger text-xs font-medium text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{submitError}</span>
              </div>
            ) : null
          }
        />
      )}
    </div>
  )
}
