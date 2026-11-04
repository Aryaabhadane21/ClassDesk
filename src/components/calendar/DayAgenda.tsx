import { type ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

export interface DayAgendaProps<T> {
  selectedDate: Date
  items: T[]
  renderItem: (item: T) => ReactNode
  className?: string
}

export function DayAgenda<T>({
  selectedDate,
  items,
  renderItem,
  className,
}: DayAgendaProps<T>) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(selectedDate)

  return (
    <Card
      className={cn(
        'p-5 sm:p-6 bg-surface border border-line rounded-none shadow-card text-left space-y-4 h-fit',
        className,
      )}
    >
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <div>
          <h3 className="font-display text-lg font-bold text-fg">
            {formattedDate}
          </h3>
          <p className="text-xs text-muted">
            {items.length === 0
              ? 'No assignments due'
              : `${items.length} ${
                  items.length === 1 ? 'assignment' : 'assignments'
                } due`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted">
          Nothing due on this day.
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-line/50">
          {items.map((item, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-3' : ''}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
