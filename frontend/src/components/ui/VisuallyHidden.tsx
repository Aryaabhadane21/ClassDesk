import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

/**
 * Hides content visually while preserving availability to assistive screen readers
 */
export function VisuallyHidden({ children, className, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </span>
  )
}
