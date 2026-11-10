import { useMemo } from 'react'
import { cn } from '@/utils/cn'

export interface GradientBlobProps {
  seed: string
  variant?: 'cover' | 'hero'
  className?: string
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function GradientBlob({
  seed,
  variant = 'cover',
  className,
}: GradientBlobProps) {
  const blobs = useMemo(() => {
    const hash = hashString(seed || 'default-seed')

    // Deterministic parameters derived from hash
    const p1 = (hash % 60) - 20
    const p2 = ((hash >> 3) % 60) - 10
    const p3 = ((hash >> 6) % 50) + 20
    const p4 = ((hash >> 9) % 50) + 10
    const rot = (hash % 90) - 45

    return {
      blob1: { top: `${p1}%`, left: `${p2}%`, size: 'w-48 h-48 sm:w-56 sm:h-56' },
      blob2: { bottom: `${p2}%`, right: `${p1}%`, size: 'w-44 h-44 sm:w-52 sm:h-52' },
      blob3: { top: `${p3}%`, right: `${p4}%`, size: 'w-40 h-40 sm:w-48 sm:h-48' },
      blob4: { bottom: `${p4}%`, left: `${p3}%`, size: 'w-36 h-36 sm:w-44 sm:h-44' },
      rotation: `rotate(${rot}deg)`,
    }
  }, [seed])

  const heightClass = variant === 'hero' ? 'h-48 sm:h-64' : 'h-28 sm:h-32'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative w-full overflow-hidden bg-surface-2 select-none pointer-events-none',
        heightClass,
        className,
      )}
    >
      {/* Decorative overlapping blurred shapes */}
      <div
        className="absolute inset-0 filter blur-2xl opacity-75 motion-safe:transition-all motion-safe:duration-300"
        style={{ transform: blobs.rotation }}
      >
        {/* Blob 1: Accent brand tint */}
        <div
          className={cn(
            'absolute rounded-full bg-accent/60 dark:bg-accent/40',
            blobs.blob1.size,
          )}
          style={{ top: blobs.blob1.top, left: blobs.blob1.left }}
        />

        {/* Blob 2: Warm Peach tint */}
        <div
          className={cn(
            'absolute rounded-full bg-tint-peach/80 dark:bg-tint-peach/50',
            blobs.blob2.size,
          )}
          style={{ bottom: blobs.blob2.bottom, right: blobs.blob2.right }}
        />

        {/* Blob 3: Amber tint */}
        <div
          className={cn(
            'absolute rounded-full bg-tint-amber/80 dark:bg-tint-amber/50',
            blobs.blob3.size,
          )}
          style={{ top: blobs.blob3.top, right: blobs.blob3.right }}
        />

        {/* Blob 4: Soft Lilac tint */}
        <div
          className={cn(
            'absolute rounded-full bg-tint-lilac/80 dark:bg-tint-lilac/50',
            blobs.blob4.size,
          )}
          style={{ bottom: blobs.blob4.bottom, left: blobs.blob4.left }}
        />
      </div>

      {/* Surface wash overlay for contrast & readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
    </div>
  )
}
