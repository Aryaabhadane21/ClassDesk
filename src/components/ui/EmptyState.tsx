import type { ReactNode } from 'react'
import { FolderOpen } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: ReactNode
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
        'flex flex-col items-center justify-center p-8 text-center rounded-none border border-dashed border-line bg-surface/50 max-w-md mx-auto',
        className,
      )}
    >
      <div
        className="w-12 h-12 rounded-none bg-surface-2 border border-line flex items-center justify-center text-muted mb-4"
        aria-hidden="true"
      >
        {icon || <FolderOpen className="w-6 h-6" />}
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
