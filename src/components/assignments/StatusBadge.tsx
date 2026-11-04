import { Check } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { SubmissionStatus } from '@/types'

export interface StatusBadgeProps {
  status: SubmissionStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'submitted') {
    return (
      <Badge
        tone="success"
        size="sm"
        icon={<Check className="w-3 h-3 stroke-[2.5] animate-check-pop" aria-hidden="true" />}
        className={className}
      >
        Submitted
      </Badge>
    )
  }

  return (
    <Badge tone="neutral" size="sm" dot className={className}>
      Not submitted
    </Badge>
  )
}
