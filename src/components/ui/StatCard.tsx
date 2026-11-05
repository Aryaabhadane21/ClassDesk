import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  tone?: 'default' | 'danger' | 'accent' | 'success' | 'warning'
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  className,
}: StatCardProps) {
  const isDanger = tone === 'danger'

  return (
    <Card
      className={cn(
        'p-4 sm:p-5 flex items-center gap-3.5 bg-surface border border-line shadow-card text-left',
        isDanger && 'border-danger/40 bg-danger-soft/30',
        className,
      )}
    >
      <div
        className={cn(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-pill flex items-center justify-center shrink-0 motion-safe:transition-colors',
          isDanger
            ? 'bg-danger-soft text-danger border border-danger/40'
            : 'bg-accent-soft text-accent border border-accent/20',
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="space-y-0.5 min-w-0">
        <p
          className={cn(
            'text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums truncate',
            isDanger ? 'text-danger' : 'text-fg',
          )}
        >
          {value}
        </p>
        <p className="text-xs font-medium text-muted truncate">{label}</p>
      </div>
    </Card>
  )
}
