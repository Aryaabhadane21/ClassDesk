import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    id: customId,
    className,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = customId || generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted select-none"
        >
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span
            className="absolute left-3.5 flex items-center justify-center text-muted pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            'w-full min-h-[44px] px-4 py-2.5 text-sm rounded-md bg-surface-2 border border-line text-fg placeholder:text-muted',
            'focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            'transition-colors duration-150',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-danger focus:border-danger focus-visible:ring-danger',
            disabled && 'opacity-50 cursor-not-allowed bg-surface',
            className,
          )}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3.5 flex items-center justify-center text-muted">
            {rightIcon}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
