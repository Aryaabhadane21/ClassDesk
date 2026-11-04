import { Check, CheckCircle2, ExternalLink } from 'lucide-react'
import { Badge, Button, Card, GradientBlob } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import { formatSubmissionDate } from '@/utils/dates'
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
  const isLate =
    Boolean(isSubmitted &&
    assignment.submittedAt &&
    new Date(assignment.submittedAt).getTime() > new Date(assignment.dueDate).getTime())

  return (
    <Card
      className={cn(
        'flex flex-col justify-between overflow-hidden text-left bg-surface border border-line shadow-card',
        'motion-safe:transition-all motion-safe:duration-200',
        className,
      )}
    >
      <article
        id={cardId}
        tabIndex={-1}
        aria-labelledby={titleId}
        className="flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
      >
        {/* 1. Cover with GradientBlob and floating StatusBadge */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10">
            <StatusBadge status={assignment.status} className="shadow-sm backdrop-blur-xs" />
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
            {/* Divider & Due Date Info */}
            <div className="pt-3 border-t border-line">
              <DueLabel dueDate={assignment.dueDate} />
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
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  aria-label={`Open Drive link for ${assignment.title}`}
                >
                  Open Drive link
                </Button>
              </a>

              {/* Submission Action / Status Info */}
              {!isSubmitted ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-muted font-normal">
                    Did you submit this on Drive?
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-primary-fg" />}
                    aria-label={`Mark ${assignment.title} as submitted`}
                    onClick={(e) => onSubmitClick?.(assignment, e.currentTarget)}
                  >
                    Yes, I have submitted
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-success flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    <span>
                      Submitted on{' '}
                      {assignment.submittedAt
                        ? formatSubmissionDate(assignment.submittedAt)
                        : 'recently'}
                    </span>
                  </span>

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
