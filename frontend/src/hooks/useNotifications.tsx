import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { mockApi } from '@/services/mockApi'
import {
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
  pruneReadNotificationIds,
} from '@/services/storage'
import {
  deriveAdminNotifications,
  deriveStudentNotifications,
} from '@/utils/notifications'
import { STORAGE_KEYS } from '@/utils/constants'
import type { AppNotification } from '@/types'

export interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  status: 'loading' | 'success' | 'error'
  reload: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const userRole = user?.role

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const activeUserIdRef = useRef(userId)
  activeUserIdRef.current = userId

  const loadNotifications = useCallback(
    async (quiet = false) => {
      if (!userId || !userRole) {
        setNotifications([])
        setStatus('success')
        return
      }

      if (!quiet) {
        setStatus('loading')
      }

      try {
        const readIds = getReadNotificationIds(userId)
        let derived: AppNotification[] = []

        if (userRole === 'student') {
          const studentAsgs = await mockApi.getStudentAssignments(userId)
          if (activeUserIdRef.current === userId) {
            derived = deriveStudentNotifications(studentAsgs, readIds)
          }
        } else if (userRole === 'admin') {
          const adminAsgs = await mockApi.getAdminAssignments(userId)
          if (activeUserIdRef.current === userId) {
            derived = deriveAdminNotifications(adminAsgs, readIds)
          }
        }

        if (activeUserIdRef.current === userId) {
          // Prune stale read IDs in background
          pruneReadNotificationIds(
            userId,
            derived.map((n) => n.id),
          )
          setNotifications(derived)
          setStatus('success')
        }
      } catch {
        if (activeUserIdRef.current === userId && !quiet) {
          setStatus('error')
        }
      }
    },
    [userId, userRole],
  )

  // Initial load
  useEffect(() => {
    loadNotifications(false)
  }, [loadNotifications])

  // Periodic refresh (every 60 seconds)
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => {
      loadNotifications(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [userId, loadNotifications])

  // Storage and Visibility listeners
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return

    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.SUBMISSIONS ||
        e.key === STORAGE_KEYS.ASSIGNMENTS ||
        e.key === STORAGE_KEYS.NOTIFICATION_READS
      ) {
        loadNotifications(true)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(true)
      }
    }

    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId, loadNotifications])

  const markRead = useCallback(
    (id: string) => {
      if (!userId) return
      markNotificationRead(userId, id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      )
    },
    [userId],
  )

  const markAllRead = useCallback(() => {
    if (!userId) return
    const ids = notifications.map((n) => n.id)
    markAllNotificationsRead(userId, ids)
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [userId, notifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      status,
      reload: () => loadNotifications(false),
    }),
    [notifications, unreadCount, markRead, markAllRead, status, loadNotifications],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
