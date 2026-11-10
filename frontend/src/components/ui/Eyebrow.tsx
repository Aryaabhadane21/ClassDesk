import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-bold uppercase tracking-wider text-muted select-none',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}
