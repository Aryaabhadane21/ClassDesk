import { useState, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: AvatarSize
}

function getInitials(name: string): string {
  if (!name) return '?'
  // Remove common academic prefixes for cleaner initials
  const cleanName = name.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim()
  const parts = cleanName.split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Deterministically pick a token-based soft tint based on string hash
 */
function getDeterministicTint(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const palettes = [
    'bg-accent-soft text-accent border-accent/20',
    'bg-success-soft text-success border-success/20',
    'bg-info-soft text-info border-info/20',
    'bg-warning-soft text-warning border-warning/20',
  ]

  const index = Math.abs(hash) % palettes.length
  return palettes[index]
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const sizeStyles: Record<AvatarSize, { box: string; text: string }> = {
    sm: { box: 'w-8 h-8 min-w-[32px] min-h-[32px]', text: 'text-xs' },
    md: { box: 'w-10 h-10 min-w-[40px] min-h-[40px]', text: 'text-sm' },
    lg: { box: 'w-12 h-12 min-w-[48px] min-h-[48px]', text: 'text-base' },
  }

  const initials = getInitials(name)
  const tint = getDeterministicTint(name)

  return (
    <div
      aria-label={name}
      className={cn(
        'relative inline-flex items-center justify-center rounded-none overflow-hidden shrink-0 border select-none font-semibold',
        sizeStyles[size].box,
        tint,
        className,
      )}
      {...props}
    >
      {src && !imgFailed ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={sizeStyles[size].text} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  )
}
