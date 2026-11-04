import { useRef, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const { unreadCount } = useNotifications()

  // Close panel on route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const panelId = 'header-notification-panel'
  const ariaLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications'

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          'relative w-9 h-9 rounded-none flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2',
          'border border-transparent hover:border-line cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'motion-safe:transition-all motion-safe:duration-150',
          isOpen && 'bg-surface-2 text-fg border-line',
        )}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-none bg-accent text-accent-fg text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        panelId={panelId}
        triggerRef={buttonRef}
      />
    </div>
  )
}
