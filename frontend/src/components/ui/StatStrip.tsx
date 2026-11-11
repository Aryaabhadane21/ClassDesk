import { cn } from '@/utils/cn'

export interface StatStripItem {
  label: string
  value: number | string
  isOverdue?: boolean
}

export interface StatStripProps {
  items: StatStripItem[]
  className?: string
  ariaLabel?: string
}

export function StatStrip({ items, className, ariaLabel }: StatStripProps) {
  return (
    <div
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      className={cn(
        'rounded-md border border-line bg-surface grid grid-cols-2 sm:flex sm:items-stretch overflow-hidden divide-y divide-line sm:divide-y-0 sm:divide-x select-none',
        className,
      )}
    >
      {items.map((item, idx) => {
        const numVal = typeof item.value === 'number' ? item.value : Number(item.value)
        const isOverdueItem = Boolean(
          item.isOverdue || item.label.toLowerCase().includes('overdue'),
        )
        const isDanger = isOverdueItem && !Number.isNaN(numVal) ? numVal > 0 : false

        return (
          <div
            key={idx}
            className="flex-1 px-4 py-3 sm:py-3.5 flex flex-col justify-center min-w-0"
          >
            <span className="text-xs text-muted font-medium truncate mb-1">
              {item.label}
            </span>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-bold tracking-tight tabular-nums',
                  isDanger ? 'text-danger' : 'text-fg',
                )}
              >
                {item.value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StatStripSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-[72px] rounded-md border border-line bg-surface/60 animate-pulse',
        className,
      )}
      aria-hidden="true"
    />
  )
}
