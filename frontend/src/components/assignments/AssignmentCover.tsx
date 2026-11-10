import { useState } from 'react'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { getCoverIndex } from '@/utils/cover'
import { cn } from '@/utils/cn'

const coverModules = import.meta.glob<string | { default: string }>(
  '/src/assets/covers/*.jpg',
  { eager: true, import: 'default' },
)

const sortedPaths = Object.keys(coverModules).sort()
const coverUrls: string[] = sortedPaths.map((p) => {
  const mod = coverModules[p]
  return typeof mod === 'string' ? mod : (mod as { default: string }).default
})

export interface AssignmentCoverProps {
  seed: string
  className?: string
  variant?: 'cover' | 'thumbnail' | 'hero'
}

export function AssignmentCover({
  seed,
  className,
  variant = 'cover',
}: AssignmentCoverProps) {
  const [hasError, setHasError] = useState(false)
  const coverIndex = getCoverIndex(seed, coverUrls.length)

  if (coverIndex === null || hasError || !coverUrls[coverIndex]) {
    return (
      <GradientBlob
        seed={seed}
        variant={variant === 'hero' ? 'hero' : 'cover'}
        className={className}
      />
    )
  }

  const src = coverUrls[coverIndex]

  return (
    <div className={cn('relative overflow-hidden select-none bg-surface-2', className)}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-left-top scale-112 origin-top-left"
      />
    </div>
  )
}
