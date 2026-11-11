import { cn } from '@/utils/cn'

export interface AssignmentCoverProps {
  seed: string
  className?: string
  variant?: 'cover' | 'thumbnail' | 'hero'
}

const TINTS = [
  'bg-teal-900/10 dark:bg-teal-400/10 text-teal-800 dark:text-teal-200',
  'bg-amber-900/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200',
  'bg-slate-900/10 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300',
  'bg-emerald-900/10 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-200',
  'bg-sky-900/10 dark:bg-sky-400/10 text-sky-800 dark:text-sky-200',
]

function getTint(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TINTS[hash % TINTS.length]
}

export function AssignmentCover({
  seed,
  className,
}: AssignmentCoverProps) {
  const tint = getTint(seed)

  return (
    <div
      className={cn(
        'relative overflow-hidden select-none border-b border-line flex items-center justify-center',
        tint,
        className,
      )}
      aria-hidden="true"
    />
  )
}
