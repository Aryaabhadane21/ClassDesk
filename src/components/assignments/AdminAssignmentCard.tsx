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
import { Badge, Button, Card, GradientBlob, Highlight, IconButton, ProgressBar } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { getCompletion } from '@/utils/selectors'
import { getAdminUrgency } from '@/utils/dueStyles'
import type { AdminAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface AdminAssignmentCardProps {
  assignment: AdminAssignment
  onEdit?: (assignment: AdminAssignment, buttonEl: HTMLButtonElement) => void
  onDelete?: (assignment: AdminAssignment, buttonEl: HTMLButtonElement) => void
  searchQuery?: string
  className?: string
}

export function AdminAssignmentCard({
  assignment,
  onEdit,
  onDelete,
  searchQuery,
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
        '@container flex flex-col justify-between overflow-hidden text-left bg-surface border border-line shadow-card rounded-lg',
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
        className="flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {/* 1. Cover with GradientBlob and floating Audience / Urgency Tag */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface/90 backdrop-blur-xs border border-line text-fg text-xs font-medium shadow-xs">
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

            {/* 3. Full-width Open Drive link row */}
            <a
              href={assignment.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <button
                type="button"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between gap-2 border border-line bg-surface-2 text-fg text-xs font-medium hover:bg-surface hover:border-line active:bg-surface-2 motion-safe:transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                aria-label={`Open Drive link for ${assignment.title} (opens in a new tab)`}
              >
                <span className="truncate whitespace-nowrap">Open Drive link</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </button>
            </a>

            {/* 4. Class Completion Progress Bar */}
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

            {/* 5. Footer Row: Actions (mt-auto) */}
            <div className="mt-auto pt-3 border-t border-line flex flex-col @sm:flex-row items-stretch @sm:items-center gap-2">
              <Link to={`/admin/assignments/${assignment.id}`} className="flex-1 min-w-0">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ListChecks className="w-4 h-4 shrink-0" />}
                  aria-label={`View submissions for ${assignment.title}`}
                  className="w-full min-h-[44px] whitespace-nowrap justify-center"
                >
                  View submissions
                </Button>
              </Link>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <IconButton
                  variant="secondary"
                  size="md"
                  aria-label={`Edit ${assignment.title}`}
                  onClick={(e) => onEdit?.(assignment, e.currentTarget)}
                  className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] shrink-0"
                >
                  <Pencil className="w-4 h-4 text-fg" />
                </IconButton>

                <IconButton
                  variant="secondary"
                  size="md"
                  aria-label={`Delete ${assignment.title}`}
                  onClick={(e) => onDelete?.(assignment, e.currentTarget)}
                  className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] shrink-0 hover:text-danger hover:border-danger/30 hover:bg-danger-soft/40"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
