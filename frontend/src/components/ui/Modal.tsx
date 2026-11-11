import { useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'

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

  // Shared focus trap hook
  useFocusTrap({
    containerRef: modalRef,
    isActive: isOpen,
    onClose,
    initialFocusRef,
    lockScroll: true,
  })

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
          'relative w-full max-h-[90vh] overflow-y-auto bg-surface border border-line text-fg z-10',
          'rounded-lg max-w-lg p-6 space-y-4 animate-modal-enter',
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
            className="inline-flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-md text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 text-left">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
