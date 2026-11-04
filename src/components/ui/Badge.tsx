import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  const toneStyles: Record<BadgeTone, { bg: string; dot: string }> = {
    neutral: {
      bg: 'bg-surface-2 text-muted border border-line',
      dot: 'bg-muted',
    },
    accent: {
      bg: 'bg-accent-soft text-accent border border-transparent',
      dot: 'bg-accent',
    },
    success: {
      bg: 'bg-success-soft text-success border border-transparent',
      dot: 'bg-success',
    },
    warning: {
      bg: 'bg-warning-soft text-warning border border-transparent',
      dot: 'bg-warning',
    },
    danger: {
      bg: 'bg-danger-soft text-danger border border-transparent',
      dot: 'bg-danger',
    },
    info: {
      bg: 'bg-info-soft text-info border border-transparent',
      dot: 'bg-info',
    },
  }

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-none select-none shrink-0',
        toneStyles[tone].bg,
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 shrink-0', toneStyles[tone].dot)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0 items-center justify-center text-current">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
