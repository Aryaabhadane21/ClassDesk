import { ExternalLink, Pencil, Trash2, Users } from 'lucide-react'
import { Button, Card, GradientBlob, IconButton } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
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

  const isAllStudents = assignment.assignedTo.length >= 5
  const assignedText = isAllStudents
    ? 'Assigned to all students'
    : `Assigned to ${assignment.assignedTo.length} students`

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
        {/* 1. Cover with GradientBlob and floating Audience Tag */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface/90 backdrop-blur-xs border border-line text-fg text-xs font-medium shadow-sm">
              <Users className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
              <span>{assignedText}</span>
            </span>
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
            {/* Divider, Due Date & Submission Count */}
            <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <DueLabel dueDate={assignment.dueDate} />
              <span className="text-xs font-semibold text-fg">
                {assignment.submittedCount} of {assignment.totalCount} submitted
              </span>
            </div>

            {/* STEP 11 SLOT: Per-student submission table and completion progress bar */}

            {/* 3. Footer Row: Drive link and Admin Actions */}
            <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
              {/* Drive Link */}
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

              {/* Action Buttons: Edit and Delete */}
              <div className="flex items-center gap-1.5">
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
