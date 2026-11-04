import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  FilePlus,
  RefreshCw,
} from 'lucide-react'
import { Button, Skeleton } from '@/components/ui'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/utils/notifications'
import type { AppNotification, NotificationType } from '@/types'
import { cn } from '@/utils/cn'

export interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  panelId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const TYPE_ICONS: Record<NotificationType, typeof FilePlus> = {
  assigned: FilePlus,
  due_soon: Clock,
  overdue: AlertTriangle,
  submitted: CheckCircle2,
}

const TYPE_TONES: Record<NotificationType, { bg: string; text: string }> = {
  assigned: {
    bg: 'bg-accent/15 text-accent',
    text: 'text-accent',
  },
  due_soon: {
    bg: 'bg-warning-soft/70 text-warning',
    text: 'text-warning',
  },
  overdue: {
    bg: 'bg-danger-soft/70 text-danger',
    text: 'text-danger',
  },
  submitted: {
    bg: 'bg-success-soft/70 text-success',
    text: 'text-success',
  },
}

export function NotificationPanel({
  isOpen,
  onClose,
  panelId,
  triggerRef,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, status, reload } =
    useNotifications()

  // Focus management: move focus into panel on open, return to trigger on close
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus()
    }
  }, [isOpen])

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        triggerRef.current?.focus()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  const handleItemClick = (notification: AppNotification) => {
    markRead(notification.id)
    onClose()
    if (notification.targetPath) {
      navigate(notification.targetPath)
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover / Panel container */}
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-label="Notifications"
        tabIndex={-1}
        className={cn(
          'fixed inset-x-3 top-16 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2',
          'w-auto md:w-96 max-h-[75vh] flex flex-col',
          'bg-surface border border-line rounded-none shadow-pop outline-none text-left',
          'motion-safe:animate-fade-in',
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold text-fg">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-none bg-accent/20 text-accent font-semibold text-[10px]">
                {unreadCount} new
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-xs h-7 px-2 text-muted hover:text-fg disabled:opacity-40"
          >
            Mark all as read
          </Button>
        </div>

        {/* Scrollable Notifications List */}
        <div className="overflow-y-auto flex-1 divide-y divide-line/60">
          {status === 'loading' && notifications.length === 0 ? (
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-none shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" rounded="sm" />
                  <Skeleton className="h-3 w-1/3" rounded="sm" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-none shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-5/6" rounded="sm" />
                  <Skeleton className="h-3 w-1/4" rounded="sm" />
                </div>
              </div>
            </div>
          ) : status === 'error' && notifications.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-danger font-medium">
                Could not load notifications
              </p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={reload}
              >
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-surface-2 text-muted mb-1">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-fg">You're all caught up</p>
              <p className="text-xs text-muted">
                No notifications right now. Check back later for updates.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = TYPE_ICONS[item.type] || Bell
              const tone = TYPE_TONES[item.type]

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-full p-3.5 flex items-start gap-3 text-left cursor-pointer motion-safe:transition-colors',
                    'hover:bg-surface-2/60 focus:outline-none focus-visible:bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent',
                    !item.read ? 'bg-surface-2/30' : 'opacity-85',
                  )}
                >
                  {/* Type Icon */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-none flex items-center justify-center shrink-0 mt-0.5',
                      tone.bg,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Message & Relative Timestamp */}
                  <div className="flex-1 min-w-0 pr-1 space-y-0.5">
                    <p
                      className={cn(
                        'text-xs leading-relaxed text-fg',
                        !item.read ? 'font-semibold' : 'font-normal',
                      )}
                    >
                      {item.message}
                    </p>
                    <p className="text-[11px] text-muted">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {!item.read && (
                    <span
                      className="w-2 h-2 rounded-none bg-accent shrink-0 mt-1.5"
                      aria-label="Unread"
                    />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
