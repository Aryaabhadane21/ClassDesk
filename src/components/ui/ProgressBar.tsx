import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type ProgressBarTone = 'accent' | 'success' | 'warning' | 'danger'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showCount?: boolean
  tone?: ProgressBarTone
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showCount = false,
  tone = 'accent',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)))

  const toneFill: Record<ProgressBarTone, string> = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(label || showCount) && (
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          {label && <span>{label}</span>}
          {showCount ? (
            <span>
              {value} of {max} ({percentage}%)
            </span>
          ) : (
            <span>{percentage}%</span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className="w-full h-2 rounded-none bg-surface-2 border border-line overflow-hidden"
      >
        <div
          className={cn(
            'h-full rounded-none motion-safe:transition-all motion-safe:duration-300',
            toneFill[tone],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
