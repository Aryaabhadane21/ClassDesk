import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DropdownOption<T extends string = string> {
  label: string
  value: T
  disabled?: boolean
}

export interface DropdownProps<T extends string = string> {
  label: string
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  prefix?: string
  align?: 'left' | 'right'
  className?: string
  'aria-label'?: string
}

export function Dropdown<T extends string = string>({
  label,
  value,
  options,
  onChange,
  prefix,
  align = 'left',
  className,
  'aria-label': customAriaLabel,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchBufferRef = useRef('')

  const id = useId()
  const triggerId = `${id}-trigger`
  const listboxId = `${id}-listbox`

  const selectedOption = options.find((opt) => opt.value === value) || options[0]
  const displayLabel = prefix
    ? `${prefix} ${selectedOption?.label ?? ''}`
    : selectedOption?.label ?? label

  // Sync highlightedIndex when opening and focus listbox
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value)
      setHighlightedIndex(idx >= 0 ? idx : 0)
      listboxRef.current?.focus()
    }
  }, [isOpen, options, value])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const optionEl = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (optionEl && optionEl.scrollIntoView) {
        optionEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, highlightedIndex])

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  const closeAndFocusTrigger = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const selectOption = (opt: DropdownOption<T>) => {
    if (opt.disabled) return
    onChange(opt.value)
    closeAndFocusTrigger()
  }

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex(options.length - 1)
    }
  }

  const handleListboxKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeAndFocusTrigger()
      return
    }

    if (e.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex])
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % options.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length)
      return
    }

    if (e.key === 'Home') {
      e.preventDefault()
      setHighlightedIndex(0)
      return
    }

    if (e.key === 'End') {
      e.preventDefault()
      setHighlightedIndex(options.length - 1)
      return
    }

    // Typeahead search
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchBufferRef.current += e.key.toLowerCase()

      const matchIdx = options.findIndex((opt) =>
        opt.label.toLowerCase().startsWith(searchBufferRef.current),
      )
      if (matchIdx >= 0) {
        setHighlightedIndex(matchIdx)
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchBufferRef.current = ''
      }, 500)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={customAriaLabel || label}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'w-full min-h-[44px] px-4 py-2.5 rounded-pill flex items-center justify-between gap-2.5 bg-surface border border-line text-fg text-xs font-medium cursor-pointer select-none',
          'focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          'hover:bg-surface-2 motion-safe:transition-all',
          isOpen && 'border-accent ring-1 ring-accent bg-surface-2',
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted shrink-0 motion-safe:transition-transform motion-safe:duration-150',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={0}
          onKeyDown={handleListboxKeyDown}
          className={cn(
            'absolute z-40 mt-1 min-w-[200px] max-h-60 overflow-y-auto rounded-md bg-surface border border-line shadow-pop text-fg text-xs outline-none p-1 animate-popover-enter',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value
            const isHighlighted = idx === highlightedIndex

            return (
              <li
                key={opt.value}
                id={`${id}-opt-${opt.value}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  'px-3 py-2 rounded-sm flex items-center justify-between gap-3 cursor-pointer select-none min-h-[36px] motion-safe:transition-colors',
                  isHighlighted && 'bg-surface-2 text-fg',
                  isSelected ? 'font-semibold text-fg' : 'font-normal text-muted',
                  opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
