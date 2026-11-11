import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  User,
  Users,
} from 'lucide-react'
import { Badge, Button, Card, Highlight, SuccessBurst } from '@/components/ui'
import { AssignmentCover } from '@/components/assignments/AssignmentCover'
import { DueLabel } from '@/components/assignments/DueLabel'
import { formatSubmissionDate } from '@/utils/dates'
import { getStudentUrgency } from '@/utils/dueStyles'
import type { AckInfo, Assignment, StudentAssignment, StudentCourseAssignment } from '@/types'
import { cn } from '@/utils/cn'

export type AnyStudentAssignment = StudentAssignment | StudentCourseAssignment

export interface StudentAssignmentCardProps {
  assignment?: AnyStudentAssignment
  item?: StudentCourseAssignment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmitClick?: (assignment: any, buttonEl: HTMLButtonElement) => void
  searchQuery?: string
  className?: string
  isJustSubmitted?: boolean
  onBurstComplete?: () => void
}

export function StudentAssignmentCard({
  assignment,
  item,
  onSubmitClick,
  searchQuery,
  className,
  isJustSubmitted = false,
  onBurstComplete,
}: StudentAssignmentCardProps) {
  const target = item || assignment
  if (!target) return null

  const isCourseAssignment = 'assignment' in target
  const actualAssignment: Assignment = isCourseAssignment ? target.assignment : target
  const ack: AckInfo = isCourseAssignment
    ? target.ack
    : {
        acknowledged: (target as StudentAssignment).status === 'submitted',
        acknowledgedAt: (target as StudentAssignment).submittedAt,
        acknowledgedBy: null,
      }
  const group = isCourseAssignment ? target.group : undefined

  const titleId = `asg-title-${actualAssignment.id}`
  const cardId = `assignment-card-${actualAssignment.id}`

  const isSubmitted = ack.acknowledged
  const isLate = Boolean(
    isSubmitted &&
      ack.acknowledgedAt &&
      new Date(ack.acknowledgedAt).getTime() > new Date(actualAssignment.dueDate).getTime(),
  )

  const urgency = getStudentUrgency(
    actualAssignment.dueDate,
    isSubmitted ? 'submitted' : 'not_submitted',
  )
  const isGroup = actualAssignment.submissionType === 'group'

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
        {/* 1. Cover with AssignmentCover and floating Status + Type Badges */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <AssignmentCover seed={actualAssignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {/* Submission Type Badge */}
            <Badge
              tone={isGroup ? 'accent' : 'neutral'}
              size="sm"
              icon={
                isGroup ? (
                  <Users className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <User className="w-3 h-3" aria-hidden="true" />
                )
              }
              className="shadow-xs backdrop-blur-xs"
            >
              {isGroup ? 'Group' : 'Individual'}
            </Badge>

            {/* Acknowledgement Status Badge with icon + text */}
            {isSubmitted ? (
              <Badge
                tone="success"
                size="sm"
                icon={<CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                className="shadow-xs backdrop-blur-xs"
              >
                {isGroup ? 'Acknowledged' : 'Submitted'}
              </Badge>
            ) : urgency.isUrgent ? (
              <Badge
                tone={urgency.tone}
                size="sm"
                icon={
                  urgency.tone === 'danger' ? (
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <Clock className="w-3 h-3" aria-hidden="true" />
                  )
                }
                className="shadow-xs backdrop-blur-xs"
              >
                {urgency.badgeLabel}
              </Badge>
            ) : (
              <Badge
                tone="neutral"
                size="sm"
                icon={<Clock className="w-3 h-3" aria-hidden="true" />}
                className="shadow-xs backdrop-blur-xs"
              >
                Pending
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
              title={actualAssignment.title}
            >
              <Highlight text={actualAssignment.title} query={searchQuery} />
            </h3>
            <p className="font-body text-xs text-muted leading-relaxed line-clamp-3">
              <Highlight text={actualAssignment.description} query={searchQuery} />
            </p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-end">
            {/* Divider & Due Date Info with urgency styling (never color alone: icon + text) */}
            <div
              className={cn(
                'pt-3 border-t border-line flex items-center justify-between gap-2',
                urgency.isUrgent && urgency.dueRowClasses,
              )}
            >
              <div className="flex items-center gap-2">
                {urgency.tone === 'danger' && !isSubmitted && (
                  <AlertTriangle
                    className="w-4 h-4 text-danger shrink-0"
                    aria-hidden="true"
                  />
                )}
                {urgency.tone === 'warning' && !isSubmitted && (
                  <Clock
                    className="w-4 h-4 text-warning shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isSubmitted && (
                  <CheckCircle2
                    className="w-4 h-4 text-success shrink-0"
                    aria-hidden="true"
                  />
                )}
                <DueLabel dueDate={actualAssignment.dueDate} />
              </div>
              {urgency.isUrgent && !isSubmitted && (
                <span className="text-[11px] font-semibold tracking-wide uppercase shrink-0">
                  {urgency.badgeLabel}
                </span>
              )}
              {isSubmitted && (
                <span className="text-[11px] font-semibold tracking-wide uppercase text-success shrink-0">
                  {isGroup ? 'Acknowledged' : 'Done'}
                </span>
              )}
            </div>

            {/* 3. Full-width Open OneDrive link row (opens in new tab with rel noopener noreferrer) */}
            <a
              href={actualAssignment.oneDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <button
                type="button"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between gap-2 border border-line bg-surface-2 text-fg text-xs font-medium hover:bg-surface hover:border-line active:bg-surface-2 motion-safe:transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                aria-label={`Open OneDrive link for ${actualAssignment.title} (opens in a new tab)`}
              >
                <span className="truncate whitespace-nowrap">Open OneDrive link</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </button>
            </a>

            {/* 4. Submission Footer Block (mt-auto) */}
            <div className="mt-auto pt-3 border-t border-line">
              {/* Individual assignment branch */}
              {!isGroup && (
                !isSubmitted ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted">Did you submit this on OneDrive?</p>
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                      onClick={(e) => onSubmitClick?.(actualAssignment, e.currentTarget)}
                      aria-label={`Submit assignment ${actualAssignment.title}`}
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
                        Submitted on{' '}
                        {formatSubmissionDate(
                          ack.acknowledgedAt || actualAssignment.updatedAt || actualAssignment.createdAt,
                        )}
                      </span>
                    </div>

                    {isLate && (
                      <Badge tone="warning" size="sm">
                        Submitted late
                      </Badge>
                    )}
                  </div>
                )
              )}

              {/* Group assignment branch */}
              {isGroup && (
                group?.state === 'no_group' ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-muted leading-relaxed">
                      You are not part of any group. Create or join one to submit this assignment.
                    </p>
                    <a href="#groups" className="block w-full">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Users className="w-4 h-4 shrink-0 text-muted" />}
                        className="w-full min-h-[40px] justify-center"
                      >
                        Create or join a group
                      </Button>
                    </a>
                  </div>
                ) : isSubmitted ? (
                  <div className="min-h-[44px] flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-success">
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="tabular-nums">
                        Acknowledged by{' '}
                        {ack.acknowledgedBy?.name || group?.detail?.leader.name || 'Leader'} on{' '}
                        {formatSubmissionDate(
                          ack.acknowledgedAt || actualAssignment.updatedAt || actualAssignment.createdAt,
                        )}
                      </span>
                    </div>

                    {isLate && (
                      <Badge tone="warning" size="sm">
                        Submitted late
                      </Badge>
                    )}
                  </div>
                ) : group?.state === 'leader' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted">Did your team submit this on OneDrive?</p>
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                      onClick={(e) => onSubmitClick?.(actualAssignment, e.currentTarget)}
                      aria-label={`Acknowledge group submission for ${actualAssignment.title}`}
                      className="w-full min-h-[44px] whitespace-nowrap justify-center"
                    >
                      Yes, I have submitted
                    </Button>
                  </div>
                ) : (
                  <div className="min-h-[44px] flex items-center p-3 rounded-md bg-surface-2/60 border border-line text-xs text-muted italic">
                    <Info className="w-4 h-4 text-muted shrink-0 mr-2 not-italic" aria-hidden="true" />
                    <span>Only your group leader can acknowledge this.</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
