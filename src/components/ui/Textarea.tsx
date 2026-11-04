import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    id: customId,
    className,
    disabled,
    required,
    rows = 4,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const textareaId = customId || generatedId
  const hintId = `${textareaId}-hint`
  const errorId = `${textareaId}-error`

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
          htmlFor={textareaId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted select-none"
        >
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={cn(
          'w-full px-4 py-3 text-sm rounded-md bg-surface-2 border border-line text-fg placeholder:text-muted resize-y',
          'focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'motion-safe:transition-colors motion-safe:duration-150',
          error && 'border-danger focus:border-danger focus-visible:ring-danger',
          disabled && 'opacity-50 cursor-not-allowed bg-surface',
          className,
        )}
        {...props}
      />

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
