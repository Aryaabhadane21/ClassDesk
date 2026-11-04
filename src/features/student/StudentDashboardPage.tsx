import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
} from '@/components/ui'
import {
  ProgressSummary,
  StudentAssignmentCard,
} from '@/components/assignments'
import { useAuth } from '@/context/AuthContext'
import { useStudentAssignments } from '@/features/student/useStudentAssignments'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'

export function StudentDashboardPage() {
  const { user } = useAuth()
  usePageTitle('Your Assignments')

  const greetingName = getGreetingName(user?.name)
  const { assignments, status, error, reload, counts } = useStudentAssignments()

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
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
