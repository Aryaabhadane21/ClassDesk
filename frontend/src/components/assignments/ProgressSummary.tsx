import { Card, ProgressRing } from '@/components/ui'
import { cn } from '@/utils/cn'

export interface ProgressSummaryProps {
  submitted: number
  total: number
  className?: string
}

export function ProgressSummary({
  submitted,
  total,
  className,
}: ProgressSummaryProps) {
  const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0
  const isComplete = total > 0 && submitted >= total
  const remaining = Math.max(0, total - submitted)

  const supportingText = isComplete
    ? 'All caught up, nice work!'
    : total === 0
      ? 'No active course assignments'
      : `${remaining} ${remaining === 1 ? 'assignment' : 'assignments'} remaining`

  return (
    <Card
      className={cn(
        'p-5 sm:p-6 md:p-7 bg-surface border border-line shadow-card text-left flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6',
        className,
      )}
    >
      <div aria-live="polite" className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg tabular-nums">
            {submitted} of {total} submitted
          </h2>
          <span
            className={cn(
              'text-xs font-semibold px-2.5 py-0.5 rounded-pill tabular-nums',
              isComplete
                ? 'bg-success-soft text-success'
                : 'bg-surface-2 text-muted border border-line',
            )}
          >
            {percentage}%
          </span>
        </div>

        <p className="font-body text-xs sm:text-sm text-muted">
          {supportingText}
        </p>
      </div>

      <ProgressRing
        value={submitted}
        max={total || 1}
        tone={isComplete ? 'success' : 'accent'}
        ariaLabel={`${submitted} of ${total} assignments submitted`}
      />
    </Card>
  )
}
