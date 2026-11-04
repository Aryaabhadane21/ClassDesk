import { ExternalLink } from 'lucide-react'
import { Button, Card, GradientBlob } from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { StatusBadge } from '@/components/assignments/StatusBadge'
import type { StudentAssignment } from '@/types'
import { cn } from '@/utils/cn'

export interface StudentAssignmentCardProps {
  assignment: StudentAssignment
  className?: string
}

export function StudentAssignmentCard({
  assignment,
  className,
}: StudentAssignmentCardProps) {
  const titleId = `asg-title-${assignment.id}`

  return (
    <Card
      className={cn(
        'flex flex-col justify-between overflow-hidden text-left bg-surface border border-line shadow-card',
        className,
      )}
    >
      <article aria-labelledby={titleId} className="flex flex-col h-full">
        {/* 1. Cover with GradientBlob and floating StatusBadge */}
        <div className="relative h-[120px] w-full overflow-hidden shrink-0 border-b border-line">
          <GradientBlob seed={assignment.id} variant="cover" className="h-full w-full" />
          <div className="absolute top-3 right-3 z-10">
            <StatusBadge status={assignment.status} className="shadow-sm backdrop-blur-xs" />
          </div>
        </div>

        {/* 2. Title and Description */}
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
            {/* 3. Divider & Due Date Info */}
            <div className="pt-3 border-t border-line">
              <DueLabel dueDate={assignment.dueDate} />
            </div>

            {/* 4. Footer Row */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href={assignment.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
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

              {/* SUBMIT ACTION SLOT: Marked as submitted action added in Step 9 */}
              <div className="empty:hidden" />
            </div>
          </div>
        </div>
      </article>
    </Card>
  )
}
