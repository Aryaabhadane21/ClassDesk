import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
  useToast,
} from '@/components/ui'
import {
  ProgressSummary,
  StudentAssignmentCard,
} from '@/components/assignments'
import { SubmitConfirmation } from '@/features/student/SubmitConfirmation'
import { useAuth } from '@/context/AuthContext'
import { useStudentAssignments } from '@/features/student/useStudentAssignments'
import { mockApi, ApiError } from '@/services/mockApi'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'
import type { StudentAssignment } from '@/types'

export function StudentDashboardPage() {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  usePageTitle('Your Assignments')

  const greetingName = getGreetingName(user?.name)
  const { assignments, status, error, reload, updateAssignment, counts } =
    useStudentAssignments()

  // Two-step submission confirmation flow state
  const [pendingAssignment, setPendingAssignment] = useState<StudentAssignment | null>(null)
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

  // Partition and sort assignments
  const { todoAssignments, submittedAssignments } = useMemo(() => {
    const todo = assignments
      .filter((a) => a.status !== 'submitted')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    const submitted = assignments
      .filter((a) => a.status === 'submitted')
      .sort((a, b) => {
        const timeA = new Date(a.submittedAt || a.updatedAt).getTime()
        const timeB = new Date(b.submittedAt || b.updatedAt).getTime()
        return timeB - timeA // Most recently submitted first
      })

    return { todoAssignments: todo, submittedAssignments: submitted }
  }, [assignments])

  // Step 1: Open confirmation dialog
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
    // Restore focus to the "Yes, I have submitted" button
    setTimeout(() => {
      triggerButtonRef.current?.focus()
    }, 50)
  }

  // Step 2: Final confirmation execution
  const handleConfirmSubmit = async () => {
    if (!user || !pendingAssignment || isSubmitting) return

    const assignmentId = pendingAssignment.id
    const assignmentTitle = pendingAssignment.title

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const updated = await mockApi.markSubmitted(user.id, assignmentId)

      if (!isMountedRef.current) return

      // In-place state update: automatically recalculates counts & moves card
      updateAssignment(updated)
      setPendingAssignment(null)
      success(`Marked as submitted: ${assignmentTitle}`, 'Submission Confirmed')

      // Move focus to the newly moved card in the "Submitted" section
      setTimeout(() => {
        const cardEl = document.getElementById(`assignment-card-${assignmentId}`)
        cardEl?.focus()
      }, 100)
    } catch (err) {
      if (!isMountedRef.current) return

      const errorMsg =
        err instanceof Error ? err.message : 'Failed to mark assignment as submitted.'
      setSubmitError(errorMsg)

      // Only show error toast if not a validation message
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
      {/* 1. Page Header (Single <h1>) */}
      <PageHeader
        title="Your assignments"
        description={`Hello, ${greetingName}! Track your homework, deadlines, and completed deliverables.`}
      />

      {/* 2. Loading State (Skeleton Progress + 4 Skeleton Cards) */}
      {status === 'loading' && (
        <div className="space-y-8 animate-fade-in" aria-busy="true">
          <Skeleton className="h-32 w-full" rounded="lg" />

          <div className="space-y-4">
            <Skeleton className="h-6 w-32" rounded="sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      )}

      {/* 3. Error State with Retry Button */}
      {status === 'error' && (
        <ErrorState
          title="Could not load assignments"
          message={error || 'An unexpected error occurred while loading your assignments.'}
          onRetry={reload}
          retryLabel="Try again"
        />
      )}

      {/* 4. Empty State (Zero assignments) */}
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
        <div className="space-y-10">
          {/* Progress Summary Card */}
          <ProgressSummary submitted={counts.submitted} total={counts.total} />

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
                    className="motion-safe:animate-fade-in"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Shared Confirmation Dialog for Step 2 */}
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
