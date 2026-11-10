import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  ariaLabel?: string
}

export function ProgressRing({
  value,
  max = 100,
  tone,
  ariaLabel,
  className,
  ...props
}: ProgressRingProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0
  const isComplete = percentage === 100
  const effectiveTone = tone || (isComplete ? 'success' : 'accent')

  // Normalized coordinate space 100x100
  const size = 100
  const strokeWidth = 9
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const strokeColors = {
    accent: 'stroke-accent',
    success: 'stroke-success',
    warning: 'stroke-warning',
    danger: 'stroke-danger',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel || `${value} of ${max} assignments submitted`}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none w-24 h-24 md:w-[120px] md:h-[120px]',
        className,
      )}
      {...props}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full transform -rotate-90"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-2"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            strokeColors[effectiveTone],
            'motion-safe:transition-all motion-safe:duration-500 ease-out',
          )}
        />
      </svg>

      {/* Percentage in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display font-bold text-xl sm:text-2xl text-fg tabular-nums leading-none">
          {percentage}%
        </span>
      </div>
    </div>
  )
}
