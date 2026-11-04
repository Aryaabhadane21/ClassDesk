import type { ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface ErrorStateProps {
  icon?: ReactNode
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-danger/30 bg-danger-soft/30 max-w-md mx-auto',
        className,
      )}
    >
      <div
        className="w-12 h-12 rounded-pill bg-danger-soft text-danger flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        {icon || <AlertCircle className="w-6 h-6" />}
      </div>

      <h3 className="font-display text-lg font-semibold text-fg tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted leading-relaxed max-w-xs mb-5">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
