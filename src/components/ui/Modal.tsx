import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  disableBackdropClick?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  className?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  disableBackdropClick = false,
  initialFocusRef,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Manage body scroll lock and focus restore
  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus management on open
    const focusTimeout = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length > 0) {
          focusable[0].focus()
        } else {
          modalRef.current.focus()
        }
      }
    }, 50)

    return () => {
      clearTimeout(focusTimeout)
      document.body.style.overflow = originalOverflow
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, initialFocusRef])

  // Key listener for Escape and Focus Trap
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null)

        if (focusable.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const titleId = title ? 'modal-dialog-title' : ariaLabelledBy
  const descId = description ? 'modal-dialog-desc' : ariaDescribedBy

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs motion-safe:transition-opacity duration-200"
        aria-hidden="true"
        onClick={() => {
          if (!disableBackdropClick) {
            onClose()
          }
        }}
      />

      {/* Dialog Container */}
      <div
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto bg-surface border border-line shadow-pop text-fg z-10',
          'rounded-t-lg md:rounded-lg max-w-lg p-6 space-y-4',
          'motion-safe:transition-transform motion-safe:duration-200',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 id={titleId} className="font-display text-xl font-semibold text-fg tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-xs text-muted mt-1">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex items-center justify-center w-8 h-8 rounded-pill text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer motion-safe:transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 text-left">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
