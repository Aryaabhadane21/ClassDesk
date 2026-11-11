import {
  ExternalLink,
  Pencil,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { Badge, Card, Highlight, IconButton } from '@/components/ui'
import { AssignmentCover } from '@/components/assignments/AssignmentCover'
import { DueLabel } from '@/components/assignments/DueLabel'
import { getAdminUrgency } from '@/utils/dueStyles'
import { cn } from '@/utils/cn'
import type { ProfessorCourseAssignment } from '@/types'

export interface ProfessorAssignmentCardProps {
  item: ProfessorCourseAssignment
  onEdit?: (item: ProfessorCourseAssignment, triggerEl: HTMLElement) => void
  onDelete?: (item: ProfessorCourseAssignment, triggerEl: HTMLElement) => void
  searchQuery?: string
  className?: string
}

export function ProfessorAssignmentCard({
  item,
  onEdit,
  onDelete,
  searchQuery = '',
  className,
}: ProfessorAssignmentCardProps) {
  const { assignment, tracking } = item
  const titleId = `prof-asg-title-${assignment.id}`
  const cardId = `prof-asg-card-${assignment.id}`

  const isGroup = assignment.submissionType === 'group'

  // Audience line: "All 5 students", "3 selected students" or "All groups"
  let audienceText = 'All groups'
  if (!isGroup) {
    if (assignment.audience === 'selected') {
      audienceText = `${assignment.assignedTo.length} selected students`
    } else {
      audienceText = `All ${assignment.assignedTo.length} students`
    }
  }

  // Tracking line: "{submitted} of {total} students submitted" or "{submitted} of {total} groups acknowledged"
  let trackingText = ''
  if (tracking.kind === 'individual') {
    if (tracking.total === 0) {
      trackingText = 'No students enrolled yet'
    } else {
      trackingText = `${tracking.submitted} of ${tracking.total} students submitted`
    }
  } else {
    trackingText = `${tracking.submitted} of ${tracking.total} groups acknowledged`
  }

  const urgency = getAdminUrgency(
    assignment.dueDate,
    tracking.submitted,
    tracking.total,
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
        aria-labelledby={titleId}
        className="flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
      >
        {/* 1. Cover with AssignmentCover and type badge */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <AssignmentCover seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            <Badge
              tone="neutral"
              size="sm"
              className="bg-surface/90 backdrop-blur-xs border border-line text-fg font-medium shadow-xs"
              icon={
                isGroup ? (
                  <Users className="w-3 h-3 text-muted" aria-hidden="true" />
                ) : (
                  <User className="w-3 h-3 text-muted" aria-hidden="true" />
                )
              }
            >
              {isGroup ? 'Group' : 'Individual'}
            </Badge>
          </div>
        </div>

        {/* 2. Main Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Title */}
            <h3
              id={titleId}
              className="font-display font-semibold text-base sm:text-lg text-fg leading-snug line-clamp-2"
            >
              <Highlight text={assignment.title} query={searchQuery} />
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
              <Highlight text={assignment.description} query={searchQuery} />
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Due Label with Urgency styling */}
            <div
              className={cn(
                'rounded-md',
                urgency.isUrgent ? urgency.dueRowClasses : 'text-xs text-fg',
              )}
            >
              <DueLabel dueDate={assignment.dueDate} />
            </div>

            {/* Full-width "Open OneDrive link" row */}
            <a
              href={assignment.oneDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open OneDrive link for ${assignment.title} (opens in a new tab)`}
              className="group flex items-center justify-between w-full px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-2/80 border border-line text-xs font-medium text-fg motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="truncate pr-2 text-muted group-hover:text-fg motion-safe:transition-colors">
                Open OneDrive link
              </span>
              <ExternalLink
                className="w-3.5 h-3.5 text-muted shrink-0 group-hover:text-fg motion-safe:transition-colors"
                aria-hidden="true"
              />
            </a>

            {/* Audience row with Users icon */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="font-medium text-fg">{audienceText}</span>
            </div>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          {/* 
            SLOT: Reserved for Step 9 Progress Bar and "View Submissions" action button.
            In Step 9, the submission review drawer trigger and visual progress bar will be inserted here.
          */}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
            <p className="text-xs font-medium text-muted tabular-nums">
              {trackingText}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Edit ${assignment.title}`}
                onClick={(e) => onEdit?.(item, e.currentTarget)}
              >
                <Pencil className="w-4 h-4 text-muted hover:text-fg" aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Delete ${assignment.title}`}
                onClick={(e) => onDelete?.(item, e.currentTarget)}
                className="text-danger hover:bg-danger-soft focus-visible:ring-danger"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
