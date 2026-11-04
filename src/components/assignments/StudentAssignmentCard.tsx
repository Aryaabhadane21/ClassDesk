import { AlertTriangle, Check, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { Badge, Button, Card, GradientBlob } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import { formatSubmissionDate } from '@/utils/dates'
import { getStudentUrgency } from '@/utils/dueStyles'
import type { StudentAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface StudentAssignmentCardProps {
  assignment: StudentAssignment
  onSubmitClick?: (assignment: StudentAssignment, buttonEl: HTMLButtonElement) => void
  className?: string
}

export function StudentAssignmentCard({
  assignment,
  onSubmitClick,
  className,
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
        'flex flex-col justify-between overflow-hidden text-left bg-surface border border-line shadow-card',
        'motion-safe:transition-all motion-safe:duration-200',
        urgency.isUrgent && urgency.cardBorderClasses,
        className,
      )}
    >
      <article
        id={cardId}
        tabIndex={-1}
        data-due-state={urgency.tone}
        aria-labelledby={titleId}
        className="flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
      >
        {/* 1. Cover with GradientBlob and floating StatusBadge */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <StatusBadge status={assignment.status} className="shadow-sm backdrop-blur-xs" />
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
                className="shadow-sm backdrop-blur-xs"
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
              {assignment.title}
            </h3>
            <p className="font-body text-xs text-muted leading-relaxed line-clamp-3">
              {assignment.description}
            </p>
          </div>

          <div className="space-y-4">
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

            {/* 3. Footer Row */}
            <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Drive Resource Link */}
              <a
                href={assignment.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block shrink-0"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />}
                  aria-label={`Open Drive link for ${assignment.title} (opens in a new tab)`}
                >
                  Open Drive link
                  <span className="sr-only"> (opens in a new tab)</span>
                </Button>
              </a>

              {/* Submission Action State */}
              <div>
                {!isSubmitted ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs text-muted">
                      Did you submit this on Drive?
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={(e) => onSubmitClick?.(assignment, e.currentTarget)}
                      aria-label={`Submit assignment ${assignment.title}`}
                    >
                      Yes, I have submitted
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                      <Check className="w-4 h-4" />
                      <span>
                        Submitted{' '}
                        {assignment.submittedAt
                          ? formatSubmissionDate(assignment.submittedAt)
                          : ''}
                      </span>
                    </span>

                    {/* Late badge if submitted after due date */}
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
        </div>
      </article>
    </Card>
  )
}
