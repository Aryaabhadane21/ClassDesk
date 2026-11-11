import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SearchInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  label?: string
  className?: string
  enableKeyboardShortcut?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      id = 'search-input',
      value,
      onChange,
      placeholder = 'Search...',
      ariaLabel,
      label,
      className,
      enableKeyboardShortcut = true,
    },
    ref,
  ) {
    const internalRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

    // Global "/" key listener to focus search box when not typing in an editable element
    useEffect(() => {
      if (!enableKeyboardShortcut) return

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeEl = document.activeElement as HTMLElement | null
          const isEditable =
            activeEl &&
            (activeEl.tagName === 'INPUT' ||
              activeEl.tagName === 'TEXTAREA' ||
              activeEl.tagName === 'SELECT' ||
              activeEl.isContentEditable)

          if (!isEditable) {
            e.preventDefault()
            internalRef.current?.focus()
            internalRef.current?.select()
          }
        }
      }

      window.addEventListener('keydown', handleGlobalKeyDown)
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown)
      }
    }, [enableKeyboardShortcut])

    const effectiveAriaLabel = ariaLabel || label || placeholder

    return (
      <div className={cn('w-full', className)}>
        {label ? (
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
        ) : (
          <label htmlFor={id} className="sr-only">
            {effectiveAriaLabel}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <span
            className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            <Search className="w-4 h-4" />
          </span>

          <input
            ref={internalRef}
            id={id}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onChange('')
              }
            }}
            placeholder={placeholder}
            aria-label={effectiveAriaLabel}
            className={cn(
              'w-full h-[44px] min-h-[44px] pl-10 pr-10 rounded-md bg-surface border border-line text-fg text-xs font-body',
              'placeholder:text-muted focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              'transition-colors duration-150',
            )}
          />

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                internalRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-2.5 w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    )
  },
)
