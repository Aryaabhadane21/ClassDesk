import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: ReactNode
  seed?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-lg border border-line bg-surface max-w-md mx-auto',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 text-muted" aria-hidden="true">
          {icon}
        </div>
      )}

      <h3 className="font-display text-base sm:text-lg font-semibold text-fg tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted leading-relaxed max-w-xs mb-5">
        {description}
      </p>

      {action && <div className="inline-flex items-center justify-center">{action}</div>}
    </div>
  )
}
