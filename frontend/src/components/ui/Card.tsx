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
        'bg-surface border border-line rounded-lg text-fg overflow-hidden',
        interactive &&
          'cursor-pointer transition-colors duration-150 hover:border-fg/30 hover:bg-surface-2/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
