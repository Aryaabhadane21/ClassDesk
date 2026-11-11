import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options?: SelectOption[]
  children?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    options,
    children,
    id: customId,
    className,
    disabled,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const selectId = customId || generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`

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
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted select-none"
        >
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            'w-full min-h-[44px] px-4 py-2.5 pr-10 text-sm rounded-pill bg-surface-2 border border-line text-fg appearance-none cursor-pointer',
            'focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            'motion-safe:transition-colors motion-safe:duration-150',
            error && 'border-danger focus:border-danger focus-visible:ring-danger',
            disabled && 'opacity-50 cursor-not-allowed bg-surface pointer-events-none',
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <span
          className="absolute right-3.5 flex items-center justify-center text-muted pointer-events-none"
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </span>
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
