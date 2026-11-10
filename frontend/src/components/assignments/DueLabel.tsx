import { CalendarClock } from 'lucide-react'
import { formatDueDate, getDueInfo } from '@/utils/dates'
import { cn } from '@/utils/cn'

export interface DueLabelProps {
  dueDate: string
  className?: string
}

export function DueLabel({ dueDate, className }: DueLabelProps) {
  const formatted = formatDueDate(dueDate)
  const dueInfo = getDueInfo(dueDate)

  return (
    <div
      data-due-state={dueInfo.state}
      className={cn('flex items-center gap-2 text-xs text-fg', className)}
    >
      <CalendarClock className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
      <span className="font-medium text-fg">{formatted}</span>
      <span className="text-muted text-[11px]">&bull; {dueInfo.label}</span>
    </div>
  )
}
