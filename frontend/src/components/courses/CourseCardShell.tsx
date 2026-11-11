import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { cn } from '@/utils/cn'

export interface CourseCardShellProps {
  course: Course
  href: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

const TINTS = [
  'bg-teal-900/10 dark:bg-teal-400/10 text-teal-800 dark:text-teal-200 border-b border-teal-900/10 dark:border-teal-400/10',
  'bg-amber-900/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 border-b border-amber-900/10 dark:border-amber-400/10',
  'bg-slate-900/10 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300 border-b border-slate-700/10 dark:border-slate-400/10',
  'bg-emerald-900/10 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-200 border-b border-emerald-900/10 dark:border-emerald-400/10',
  'bg-sky-900/10 dark:bg-sky-400/10 text-sky-800 dark:text-sky-200 border-b border-sky-900/10 dark:border-sky-400/10',
]

function getTint(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TINTS[hash % TINTS.length]
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
  const tint = getTint(course.id || course.code)

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative rounded-lg border border-line bg-surface overflow-hidden flex flex-col justify-between',
        'transition-colors duration-150 hover:border-fg/30',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2',
        className,
      )}
    >
      {/* Top Header: Flat Tinted Color with Course Code Typography */}
      <div
        className={cn(
          'relative h-28 w-full p-4 flex flex-col justify-between select-none',
          tint,
        )}
      >
        <div className="flex items-center justify-end text-xs font-medium opacity-80 pointer-events-none">
          <span>{course.semester}</span>
        </div>
        <div className="font-display font-bold text-3xl tracking-tight opacity-90 truncate pointer-events-none">
          {course.code}
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
              className="focus:outline-none after:absolute after:inset-0 after:z-0 hover:underline transition-colors"
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
