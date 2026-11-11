import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-primary-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
    secondary:
      'bg-surface-2 border border-line text-fg hover:bg-surface hover:border-line active:bg-surface-2',
    ghost:
      'bg-transparent text-fg hover:bg-surface-2 active:bg-surface-2/80',
    accent:
      'bg-accent text-accent-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
    danger:
      'bg-danger text-danger-fg hover:opacity-90 active:opacity-95 shadow-card hover:shadow-pop',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[40px] sm:min-h-[38px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[44px] gap-2.5',
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-pill cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'motion-safe:transition-all motion-safe:duration-150',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" tone={variant === 'secondary' || variant === 'ghost' ? 'current' : 'white'} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})
