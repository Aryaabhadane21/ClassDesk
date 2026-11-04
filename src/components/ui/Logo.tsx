import { cn } from '@/utils/cn'

export type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps {
  size?: LogoSize
  showWordmark?: boolean
  className?: string
}

export function Logo({
  size = 'md',
  showWordmark = true,
  className,
}: LogoProps) {
  const sizeConfig = {
    sm: {
      mark: 'w-7 h-7 rounded-none',
      icon: 'w-4 h-4',
      text: 'text-lg',
    },
    md: {
      mark: 'w-9 h-9 rounded-none',
      icon: 'w-5 h-5',
      text: 'text-xl',
    },
    lg: {
      mark: 'w-11 h-11 rounded-none',
      icon: 'w-6 h-6',
      text: 'text-2xl',
    },
  }

  const { mark, icon, text } = sizeConfig[size]

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {/* Geometric mark: Rounded squircle with desk & open-book/checkmark geometry */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 bg-accent text-accent-fg shadow-card motion-safe:transition-transform motion-safe:duration-200',
          mark,
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={icon}
        >
          {/* Desk surface & open notebook pages */}
          <path d="M4 19.5v-13A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v13.5" />
          <path d="M6 18h14" />
          <path d="m9 10 2 2 4-4" />
        </svg>
      </div>

      {showWordmark && (
        <span className={cn('font-display font-semibold tracking-tight text-fg', text)}>
          ClassDesk
        </span>
      )}
    </div>
  )
}
