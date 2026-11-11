import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Accessible text description required for screen readers
   */
  'aria-label': string
  variant?: IconButtonVariant
  size?: IconButtonSize
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    'aria-label': ariaLabel,
    variant = 'secondary',
    size = 'md',
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const variantStyles: Record<IconButtonVariant, string> = {
    primary:
      'bg-primary text-primary-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
    secondary:
      'bg-surface-2 border border-line text-fg hover:bg-surface active:bg-surface-2',
    ghost:
      'bg-transparent text-fg hover:bg-surface-2 active:bg-surface-2/80',
    accent:
      'bg-accent text-accent-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
    danger:
      'bg-danger text-danger-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
  }

  const sizeStyles: Record<IconButtonSize, string> = {
    sm: 'w-11 h-11 min-w-[44px] min-h-[44px] text-xs',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-sm',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-base',
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-pill cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'motion-safe:transition-all motion-safe:duration-150',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
