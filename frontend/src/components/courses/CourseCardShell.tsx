import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AssignmentCover } from '@/components/assignments/AssignmentCover'
import { Badge } from '@/components/ui'
import type { Course } from '@/types'
import { cn } from '@/utils/cn'

export interface CourseCardShellProps {
  course: Course
  href: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function CourseCardShell({
  course,
  href,
  children,
  footer,
  className,
}: CourseCardShellProps) {
  const generatedId = useId()
  const titleId = `course-title-${course.id || generatedId}`

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative rounded-lg border border-line bg-surface overflow-hidden flex flex-col justify-between',
        'motion-safe:transition-all motion-safe:duration-150',
        'hover:border-fg/20 hover:shadow-card motion-safe:hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2',
        className,
      )}
    >
      {/* Top Cover Art with Overlaid Badges */}
      <div className="relative h-36 w-full overflow-hidden shrink-0 bg-surface-2">
        <AssignmentCover seed={course.id} className="w-full h-full" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
          <Badge
            tone="neutral"
            size="sm"
            className="bg-surface/90 backdrop-blur-sm shadow-xs font-mono font-semibold"
          >
            {course.code}
          </Badge>
          <Badge
            tone="neutral"
            size="sm"
            className="bg-surface/90 backdrop-blur-sm shadow-xs"
          >
            {course.semester}
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            id={titleId}
            className="text-base sm:text-lg font-display font-semibold text-fg line-clamp-2 leading-snug"
          >
            <Link
              to={href}
              className="focus:outline-none after:absolute after:inset-0 after:z-0 hover:text-accent motion-safe:transition-colors"
            >
              {course.name}
            </Link>
          </h3>
          <p className="text-xs sm:text-sm text-muted line-clamp-2 mt-1.5 leading-relaxed">
            {course.description}
          </p>

          {children && <div className="mt-4">{children}</div>}
        </div>

        {footer && (
          <div className="mt-5 pt-3.5 border-t border-line flex items-center justify-between gap-3 text-xs">
            {footer}
          </div>
        )}
      </div>
    </article>
  )
}
