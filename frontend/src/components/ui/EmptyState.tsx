import type { ReactNode } from 'react'
import { AssignmentCover } from '@/components/assignments/AssignmentCover'
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
  seed = 'classdesk-empty-state',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-line bg-surface/50 max-w-md mx-auto',
        className,
      )}
    >
      <div className="relative mb-4" aria-hidden="true">
        {icon ? (
          <div className="w-12 h-12 rounded-pill bg-surface-2 border border-line flex items-center justify-center text-muted">
            {icon}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-line shadow-xs overflow-hidden bg-surface-2">
            <AssignmentCover
              seed={seed}
              variant="thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <h3 className="font-display text-lg font-semibold text-fg tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted leading-relaxed max-w-xs mb-5">
        {description}
      </p>

      {action && <div className="inline-flex items-center justify-center">{action}</div>}
    </div>
  )
}
