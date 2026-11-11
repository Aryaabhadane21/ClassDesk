import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    id: customId,
    className,
    disabled,
    checked,
    defaultChecked,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const checkboxId = customId || generatedId
  const descriptionId = `${checkboxId}-desc`

  return (
    <div className={cn('relative flex items-start gap-3 py-1 cursor-pointer select-none', className)}>
      <div className="flex items-center justify-center min-h-[44px] shrink-0">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            aria-describedby={description ? descriptionId : undefined}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              'w-5 h-5 rounded-sm border border-line bg-surface-2 flex items-center justify-center cursor-pointer',
              'peer-checked:bg-accent peer-checked:border-accent text-accent-fg',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2',
              'motion-safe:transition-all motion-safe:duration-150',
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            )}
          >
            <Check
              className="w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 motion-safe:transition-opacity stroke-[3]"
              aria-hidden="true"
            />
          </label>
        </div>
      </div>

      <div className="pt-2 text-left">
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium text-fg cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-xs text-muted mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  )
})
