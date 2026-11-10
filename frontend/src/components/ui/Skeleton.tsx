import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'pill'
}

export function Skeleton({ rounded = 'md', className, ...props }: SkeletonProps) {
  const radiusMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    pill: 'rounded-pill',
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-surface-2 motion-safe:animate-pulse',
        radiusMap[rounded],
        className,
      )}
      {...props}
    />
  )
}

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4']

  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', widths[index % widths.length])}
          rounded="sm"
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'p-5 rounded-lg border border-line bg-surface space-y-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" rounded="sm" />
        <Skeleton className="h-5 w-16" rounded="pill" />
      </div>

      <SkeletonText lines={2} />

      <div className="pt-2 flex items-center justify-between border-t border-line">
        <Skeleton className="h-3 w-20" rounded="sm" />
        <Skeleton className="h-8 w-24" rounded="pill" />
      </div>
    </div>
  )
}
