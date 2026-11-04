import { Card, ProgressBar } from '@/components/ui'
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
        'p-6 sm:p-7 bg-surface border border-line shadow-card text-left space-y-4',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div aria-live="polite" className="space-y-1">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              {submitted} of {total} submitted
            </h2>
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5 rounded-pill',
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
      </div>

      <ProgressBar
        value={submitted}
        max={total || 1}
        tone={isComplete ? 'success' : 'accent'}
        aria-label="Submission progress"
      />
    </Card>
  )
}
