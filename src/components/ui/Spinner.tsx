import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { VisuallyHidden } from '@/components/ui/VisuallyHidden'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerTone = 'current' | 'white' | 'accent'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize
  tone?: SpinnerTone
  label?: string
}

export function Spinner({
  size = 'md',
  tone = 'current',
  label = 'Loading...',
  className,
  ...props
}: SpinnerProps) {
  const sizeMap: Record<SpinnerSize, string> = {
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-4.5 h-4.5 border-2',
    lg: 'w-6 h-6 border-[2.5px]',
  }

  const toneMap: Record<SpinnerTone, string> = {
    current: 'border-current border-t-transparent',
    white: 'border-white border-t-transparent',
    accent: 'border-accent border-t-transparent',
  }

  return (
    <span
      role="status"
      className={cn('inline-flex items-center justify-center shrink-0', className)}
      {...props}
    >
      <span
        className={cn(
          'motion-safe:animate-spin rounded-full shrink-0',
          sizeMap[size],
          toneMap[tone],
        )}
        aria-hidden="true"
      />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  )
}
