import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => string
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type, message, title, duration = 5000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { id, type, message, title, duration }])
      return id
    },
    [],
  )

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast],
  )

  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast],
  )

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, dismissToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed z-50 bottom-4 inset-x-4 md:inset-x-auto md:right-4 flex flex-col items-center md:items-end gap-2.5 pointer-events-none"
          >
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: (id: string) => void
}) {
  const [isPaused, setIsPaused] = useState(false)
  const remainingRef = useRef(toast.duration ?? 5000)
  const timerStartRef = useRef(Date.now())

  useEffect(() => {
    if (isPaused) return

    timerStartRef.current = Date.now()
    const timerId = setTimeout(() => {
      onDismiss(toast.id)
    }, remainingRef.current)

    return () => {
      clearTimeout(timerId)
      const elapsed = Date.now() - timerStartRef.current
      remainingRef.current = Math.max(0, remainingRef.current - elapsed)
    }
  }, [isPaused, onDismiss, toast.id])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-info shrink-0" aria-hidden="true" />,
  }

  const role = toast.type === 'error' ? 'alert' : 'status'

  return (
    <div
      role={role}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-full max-w-sm p-4 rounded-lg bg-surface border border-line shadow-pop',
        'motion-safe:transition-all motion-safe:duration-200 text-left',
      )}
    >
      <div className="pt-0.5">{icons[toast.type]}</div>

      <div className="flex-1 space-y-0.5">
        {toast.title && (
          <h3 className="text-xs font-semibold text-fg tracking-wide">{toast.title}</h3>
        )}
        <p className="text-xs text-muted leading-relaxed">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 -mr-1 -mt-1 rounded-pill text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer motion-safe:transition-colors"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
