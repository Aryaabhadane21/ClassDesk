import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Eyebrow,
  ProgressBar,
  Skeleton,
  useToast,
} from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import { AssignmentFormModal } from '@/features/admin/AssignmentFormModal'
import { useAdminAssignments } from '@/features/admin/useAdminAssignments'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatSubmissionDate } from '@/utils/dates'
import { getCompletion, sortSubmissionsForReview } from '@/utils/selectors'
import { getAdminUrgency } from '@/utils/dueStyles'
import { mockApi } from '@/services/mockApi'
import { cn } from '@/utils/cn'
import type { AdminAssignment } from '@/types'

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success } = useToast()
  const adminId = user?.id || ''

  const {
    assignments,
    students,
    status,
    error,
    reload,
    replaceAssignment,
    removeAssignment,
  } = useAdminAssignments()

  // Find the requested assignment
  const assignment = useMemo(
    () => assignments.find((a) => a.id === assignmentId),
    [assignments, assignmentId],
  )

  // Page title
  usePageTitle(assignment ? `${assignment.title} · ClassDesk` : 'Assignment · ClassDesk')

  // Edit and Delete dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Sorted submissions for review
  const sortedSubmissions = useMemo(
    () => (assignment ? sortSubmissionsForReview(assignment.submissions) : []),
    [assignment],
  )

  const completion = useMemo(
    () => (assignment ? getCompletion(assignment) : null),
    [assignment],
  )

  const urgency = useMemo(
    () =>
      assignment
        ? getAdminUrgency(
            assignment.dueDate,
            assignment.submittedCount,
            assignment.totalCount,
          )
        : null,
    [assignment],
  )

  const handleEditSuccess = (saved: AdminAssignment) => {
    replaceAssignment(saved)
  }

  const handleDeleteConfirm = async () => {
    if (!assignment) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await mockApi.deleteAssignment(adminId, assignment.id)
      removeAssignment(assignment.id)
      success('Assignment deleted')
      setIsDeleteDialogOpen(false)
      navigate('/admin', { replace: true })
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

  // 1. Loading State
  if (status === 'loading') {
    return (
      <div className="space-y-6 animate-fade-in" aria-busy="true">
        <Skeleton className="h-5 w-40" rounded="sm" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-3/4 max-w-lg" rounded="md" />
          <Skeleton className="h-4 w-48" rounded="sm" />
        </div>
        <Skeleton className="h-20 w-full" rounded="lg" />
        <Skeleton className="h-44 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
    )
  }

  // 2. Error State
  if (status === 'error') {
    return (
      <div className="space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-fg motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to assignments</span>
        </Link>
        <ErrorState
          title="Could not load assignment"
          message={error || 'An unexpected error occurred.'}
          onRetry={reload}
          retryLabel="Try again"
        />
      </div>
    )
  }

  // 3. Not Found State (unknown ID or belonging to another professor)
  if (!assignment || !completion) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-fg motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to assignments</span>
        </Link>
        <EmptyState
          title="We couldn't find that assignment"
          description="The assignment you are looking for may have been deleted, or you do not have permission to view it."
          action={
            <Link to="/admin">
              <Button variant="primary" size="md">
                Back to assignments
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isAllStudents = assignment.assignedTo.length >= students.length

  return (
    <div className="space-y-8">
      {/* 1. Back link */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-fg motion-safe:transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-pill"
        >
          <ArrowLeft className="w-4 h-4 motion-safe:group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to assignments</span>
        </Link>
      </div>

      {/* 2. Page Header & Actions */}
      <div className="space-y-3 pb-6 border-b border-line">
        <PageHeader
          title={assignment.title}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={assignment.oneDriveLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  size="md"
                  rightIcon={<ExternalLink className="w-4 h-4" aria-hidden="true" />}
                  aria-label={`Open OneDrive folder for ${assignment.title} (opens in a new tab)`}
                >
                  Open OneDrive link
                  <span className="sr-only"> (opens in a new tab)</span>
                </Button>
              </a>

              <Button
                variant="secondary"
                size="md"
                leftIcon={<Pencil className="w-4 h-4" />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit
              </Button>

              <Button
                variant="secondary"
                size="md"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setIsDeleteDialogOpen(true)}
                className="hover:text-danger hover:border-danger/30 hover:bg-danger-soft/40"
              >
                Delete
              </Button>
            </div>
          }
        />

        <div className="flex items-center gap-4 flex-wrap pt-1">
          <div
            className={cn(
              'flex items-center gap-2',
              urgency?.isUrgent && urgency.dueRowClasses,
            )}
          >
            {urgency?.tone === 'danger' && (
              <AlertTriangle
                className="w-4 h-4 text-danger shrink-0"
                aria-hidden="true"
              />
            )}
            {urgency?.tone === 'warning' && (
              <Clock
                className="w-4 h-4 text-warning shrink-0"
                aria-hidden="true"
              />
            )}
            <DueLabel dueDate={assignment.dueDate} />
          </div>

          {urgency?.isUrgent && (
            <Badge
              tone={urgency.tone}
              size="sm"
              icon={
                urgency.tone === 'danger' ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )
              }
            >
              {urgency.badgeLabel}
            </Badge>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface-2 border border-line text-xs font-medium text-fg">
            <Users className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
            <span>
              {isAllStudents
                ? 'Assigned to all students'
                : `Assigned to ${assignment.assignedTo.length} students`}
            </span>
          </span>
        </div>

        {/* Full description */}
        <p className="text-sm text-muted leading-relaxed whitespace-pre-line pt-2 max-w-3xl">
          {assignment.description}
        </p>
      </div>

      {/* 3. Summary Card */}
      <Card className="p-6 bg-surface border border-line rounded-lg shadow-card space-y-4">
        <div
          className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
          aria-live="polite"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg tracking-tight">
            {completion.submitted} of {completion.total}{' '}
            {completion.total === 1 ? 'student' : 'students'} submitted
          </h2>
          <span className="text-xl sm:text-2xl font-bold text-fg">
            {completion.percent}%
          </span>
        </div>

        <ProgressBar
          value={completion.submitted}
          max={completion.total}
          tone={completion.percent === 100 ? 'success' : 'accent'}
          aria-label={`Overall submission progress: ${completion.percent}%`}
        />

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-line">
          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-line">
            <p className="text-xs text-muted font-medium">Submitted</p>
            <p className="text-2xl font-bold text-fg mt-1 tabular-nums">
              {completion.submitted}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-line">
            <p className="text-xs text-muted font-medium">Not submitted</p>
            <p className="text-2xl font-bold text-fg mt-1 tabular-nums">
              {completion.remaining}
            </p>
          </div>

          {completion.late > 0 && (
            <div className="p-3.5 rounded-lg bg-warning-soft/60 border border-warning/30">
              <p className="text-xs text-warning font-medium">Submitted late</p>
              <p className="text-2xl font-bold text-warning mt-1 tabular-nums">
                {completion.late}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 4. Student Status Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Eyebrow>STUDENT STATUS</Eyebrow>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg tracking-tight">
              Student status{' '}
              <span className="text-muted text-sm font-normal tabular-nums">
                ({sortedSubmissions.length})
              </span>
            </h2>
          </div>
        </div>

        {sortedSubmissions.length === 0 ? (
          <EmptyState
            title="No students assigned"
            description="This assignment has not been assigned to any students."
          />
        ) : (
          <>
            {/* Desktop Table (md and up) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-line bg-surface shadow-xs">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">
                  Student submission status for {assignment.title}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface-2/50 text-xs font-semibold uppercase tracking-wider text-muted">
                    <th scope="col" className="py-3.5 px-5">
                      Student
                    </th>
                    <th scope="col" className="py-3.5 px-5">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 px-5">
                      Submitted on
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {sortedSubmissions.map((sub) => {
                    const isLate =
                      sub.status === 'submitted' &&
                      sub.submittedAt &&
                      new Date(sub.submittedAt).getTime() >
                        new Date(assignment.dueDate).getTime()

                    return (
                      <tr
                        key={sub.studentId}
                        className="hover:bg-surface-2/40 motion-safe:transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={sub.student.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-fg truncate">
                                {sub.student.name}
                              </p>
                              <p className="text-xs text-muted truncate">
                                {sub.student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">
                              {sub.submittedAt
                                ? formatSubmissionDate(sub.submittedAt)
                                : '—'}
                            </span>
                            {isLate && (
                              <Badge tone="warning" size="sm">
                                Late
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked List (below md) */}
            <div className="md:hidden space-y-3">
              {sortedSubmissions.map((sub) => {
                const isLate =
                  sub.status === 'submitted' &&
                  sub.submittedAt &&
                  new Date(sub.submittedAt).getTime() >
                    new Date(assignment.dueDate).getTime()

                return (
                  <Card
                    key={sub.studentId}
                    className="p-4 bg-surface border border-line rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={sub.student.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-fg truncate">
                            {sub.student.name}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {sub.student.email}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                      <span className="text-muted">Submitted on</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-fg font-medium">
                          {sub.submittedAt
                            ? formatSubmissionDate(sub.submittedAt)
                            : '—'}
                        </span>
                        {isLate && (
                          <Badge tone="warning" size="sm">
                            Late
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* 5. Edit Modal */}
      <AssignmentFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialAssignment={assignment}
        students={students}
        adminId={adminId}
        onSuccess={handleEditSuccess}
      />

      {/* 6. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => {
          if (!isDeleting) setIsDeleteDialogOpen(false)
        }}
        onConfirm={handleDeleteConfirm}
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
          <span>
            Are you sure you want to permanently delete{' '}
            <strong className="text-fg font-semibold">
              &ldquo;{assignment.title}&rdquo;
            </strong>
            ? All {assignment.submittedCount} student submission{' '}
            {assignment.submittedCount === 1 ? 'record' : 'records'} for this
            assignment will also be permanently deleted. This action cannot be
            undone.
          </span>
        }
      />
    </div>
  )
}
