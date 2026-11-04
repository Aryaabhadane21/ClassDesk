import {
  AlertTriangle,
  Clock,
  ExternalLink,
  ListChecks,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, GradientBlob, IconButton, ProgressBar } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { getCompletion } from '@/utils/selectors'
import { getAdminUrgency } from '@/utils/dueStyles'
import type { AdminAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface AdminAssignmentCardProps {
  assignment: AdminAssignment
  onEdit?: (assignment: AdminAssignment, buttonEl: HTMLButtonElement) => void
  onDelete?: (assignment: AdminAssignment, buttonEl: HTMLButtonElement) => void
  className?: string
}

export function AdminAssignmentCard({
  assignment,
  onEdit,
  onDelete,
  className,
}: AdminAssignmentCardProps) {
  const titleId = `admin-asg-title-${assignment.id}`
  const cardId = `admin-assignment-card-${assignment.id}`

  const completion = getCompletion(assignment)
  const isAllStudents = assignment.assignedTo.length >= 5
  const assignedText = isAllStudents
    ? 'Assigned to all students'
    : `Assigned to ${assignment.assignedTo.length} students`

  const urgency = getAdminUrgency(
    assignment.dueDate,
    assignment.submittedCount,
    assignment.totalCount,
  )

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
        {/* 1. Cover with GradientBlob and floating Audience / Urgency Tag */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface/90 backdrop-blur-xs border border-line text-fg text-xs font-medium shadow-sm">
              <Users className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
              <span>{assignedText}</span>
            </span>

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
            {/* Divider & Due Date with urgency styling */}
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
                  {urgency.helperText}
                </span>
              )}
            </div>

            {/* Class Completion Progress Bar */}
            <div className="space-y-1.5">
              {completion.total === 0 ? (
                <p className="text-xs text-muted">No students assigned</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted">
                      {completion.submitted} of {completion.total} submitted
                    </span>
                    <span className="font-semibold text-fg">
                      {completion.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    value={completion.submitted}
                    max={completion.total}
                    tone={completion.percent === 100 ? 'success' : 'accent'}
                    aria-label={`Submission progress for ${assignment.title}`}
                  />
                </>
              )}
            </div>

            {/* 3. Footer Row: Actions */}
            <div className="pt-3 border-t border-line flex items-center justify-between gap-2 flex-wrap">
              <Link to={`/admin/assignments/${assignment.id}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ListChecks className="w-3.5 h-3.5" />}
                  aria-label={`View submissions for ${assignment.title}`}
                >
                  View submissions
                </Button>
              </Link>

              <div className="flex items-center gap-1.5 ml-auto">
                <a
                  href={assignment.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Drive link"
                >
                  <IconButton
                    variant="secondary"
                    size="sm"
                    aria-label={`Open Drive link for ${assignment.title}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-fg" />
                  </IconButton>
                </a>

                <IconButton
                  variant="secondary"
                  size="sm"
                  aria-label={`Edit ${assignment.title}`}
                  onClick={(e) => onEdit?.(assignment, e.currentTarget)}
                >
                  <Pencil className="w-3.5 h-3.5 text-fg" />
                </IconButton>

                <IconButton
                  variant="secondary"
                  size="sm"
                  aria-label={`Delete ${assignment.title}`}
                  onClick={(e) => onDelete?.(assignment, e.currentTarget)}
                  className="hover:text-danger hover:border-danger/30 hover:bg-danger-soft/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
