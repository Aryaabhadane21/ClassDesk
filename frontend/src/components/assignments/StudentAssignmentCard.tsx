import { AlertTriangle, Check, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { Badge, Button, Card, Highlight, SuccessBurst } from '@/components/ui'
import { AssignmentCover } from '@/components/assignments/AssignmentCover'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import { formatSubmissionDate } from '@/utils/dates'
import { getStudentUrgency } from '@/utils/dueStyles'
import type { StudentAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface StudentAssignmentCardProps {
  assignment: StudentAssignment
  onSubmitClick?: (assignment: StudentAssignment, buttonEl: HTMLButtonElement) => void
  searchQuery?: string
  className?: string
  isJustSubmitted?: boolean
  onBurstComplete?: () => void
}

export function StudentAssignmentCard({
  assignment,
  onSubmitClick,
  searchQuery,
  className,
  isJustSubmitted = false,
  onBurstComplete,
}: StudentAssignmentCardProps) {
  const titleId = `asg-title-${assignment.id}`
  const cardId = `assignment-card-${assignment.id}`

  const isSubmitted = assignment.status === 'submitted'
  const isLate = Boolean(
    isSubmitted &&
      assignment.submittedAt &&
      new Date(assignment.submittedAt).getTime() >
        new Date(assignment.dueDate).getTime(),
  )

  const urgency = getStudentUrgency(assignment.dueDate, assignment.status)

  return (
    <Card
      className={cn(
        'relative @container flex flex-col justify-between overflow-hidden text-left bg-surface border border-line shadow-card rounded-lg',
        'motion-safe:transition-all motion-safe:duration-200',
        urgency.isUrgent && urgency.cardBorderClasses,
        className,
      )}
    >
      <SuccessBurst active={isJustSubmitted} onComplete={onBurstComplete} />

      <article
        id={cardId}
        tabIndex={-1}
        data-due-state={urgency.tone}
        aria-labelledby={titleId}
        className="flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {/* 1. Cover with AssignmentCover and floating StatusBadge */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <AssignmentCover seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <StatusBadge status={assignment.status} className="shadow-xs backdrop-blur-xs" />
            {urgency.isUrgent && (
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
                className="shadow-xs backdrop-blur-xs"
              >
                {urgency.badgeLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* 2. Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <h3
              id={titleId}
              className="font-display text-lg font-semibold text-fg tracking-tight line-clamp-2 leading-snug"
              title={assignment.title}
            >
              <Highlight text={assignment.title} query={searchQuery} />
            </h3>
            <p className="font-body text-xs text-muted leading-relaxed line-clamp-3">
              <Highlight text={assignment.description} query={searchQuery} />
            </p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-end">
            {/* Divider & Due Date Info with urgency styling */}
            <div
              className={cn(
                'pt-3 border-t border-line flex items-center justify-between gap-2',
                urgency.isUrgent && urgency.dueRowClasses,
              )}
            >
              <div className="flex items-center gap-2">
                {urgency.tone === 'danger' && (
                  <AlertTriangle
                    className="w-4 h-4 text-danger shrink-0"
                    aria-hidden="true"
                  />
                )}
                {urgency.tone === 'warning' && (
                  <Clock
                    className="w-4 h-4 text-warning shrink-0"
                    aria-hidden="true"
                  />
                )}
                <DueLabel dueDate={assignment.dueDate} />
              </div>
              {urgency.isUrgent && (
                <span className="text-[11px] font-semibold tracking-wide uppercase shrink-0">
                  {urgency.badgeLabel}
                </span>
              )}
            </div>

            {/* 3. Full-width Open OneDrive link row */}
            <a
              href={assignment.oneDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <button
                type="button"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between gap-2 border border-line bg-surface-2 text-fg text-xs font-medium hover:bg-surface hover:border-line active:bg-surface-2 motion-safe:transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                aria-label={`Open OneDrive link for ${assignment.title} (opens in a new tab)`}
              >
                <span className="truncate whitespace-nowrap">Open OneDrive link</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </button>
            </a>

            {/* 4. Submission Footer Block (mt-auto) */}
            <div className="mt-auto pt-3 border-t border-line">
              {!isSubmitted ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted">Did you submit this on OneDrive?</p>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                    onClick={(e) => onSubmitClick?.(assignment, e.currentTarget)}
                    aria-label={`Submit assignment ${assignment.title}`}
                    className="w-full min-h-[44px] whitespace-nowrap justify-center"
                  >
                    Yes, I have submitted
                  </Button>
                </div>
              ) : (
                <div className="min-h-[44px] flex items-center justify-between gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-success">
                    <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">
                      Submitted{' '}
                      {assignment.submittedAt
                        ? formatSubmissionDate(assignment.submittedAt)
                        : ''}
                    </span>
                  </div>

                  {isLate && (
                    <Badge tone="warning" size="sm">
                      Submitted late
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
