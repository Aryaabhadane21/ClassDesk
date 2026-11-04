import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  children: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface border border-line rounded-lg shadow-card text-fg overflow-hidden',
        interactive &&
          'cursor-pointer motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:shadow-pop hover:border-accent/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
