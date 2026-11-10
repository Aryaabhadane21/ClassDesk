import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface UseFocusTrapOptions {
  containerRef: RefObject<HTMLElement | null>
  isActive: boolean
  onClose?: () => void
  initialFocusRef?: RefObject<HTMLElement | null>
  lockScroll?: boolean
}

/**
 * Custom hook to trap keyboard focus, handle Escape key dismissal,
 * restore focus to triggering element on close, and lock body scroll.
 */
export function useFocusTrap({
  containerRef,
  isActive,
  onClose,
  initialFocusRef,
  lockScroll = true,
}: UseFocusTrapOptions) {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Manage body scroll and initial focus
  useEffect(() => {
    if (!isActive) return

    previousActiveElement.current = document.activeElement as HTMLElement
    const originalOverflow = document.body.style.overflow

    if (lockScroll) {
      document.body.style.overflow = 'hidden'
    }

    const focusTimeout = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else if (containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length > 0) {
          focusable[0].focus()
        } else {
          containerRef.current.focus()
        }
      }
    }, 50)

    return () => {
      clearTimeout(focusTimeout)
      if (lockScroll) {
        document.body.style.overflow = originalOverflow
      }
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function'
      ) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive, initialFocusRef, containerRef, lockScroll])

  // Key listeners for Escape and Tab trapping
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'Tab' && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null)

        if (focusable.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === containerRef.current
          ) {
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
  }, [isActive, onClose, containerRef])
}
