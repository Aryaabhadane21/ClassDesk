import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { mockApi, ApiError } from '@/services/mockApi'
import { STORAGE_KEYS } from '@/utils/constants'
import type { AdminAssignment, SafeUser } from '@/types'

export type AdminDataStatus = 'loading' | 'success' | 'error'

export function useAdminAssignments() {
  const { user } = useAuth()
  const adminId = user?.id

  const [assignments, setAssignments] = useState<AdminAssignment[]>([])
  const [students, setStudents] = useState<SafeUser[]>([])
  const [status, setStatus] = useState<AdminDataStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const activeAdminIdRef = useRef(adminId)
  activeAdminIdRef.current = adminId

  const fetchData = useCallback(
    async (quiet = false) => {
      if (!adminId) {
        setAssignments([])
        setStudents([])
        setStatus('success')
        setError(null)
        return
      }

      if (!quiet) {
        setStatus('loading')
        setError(null)
      }

      try {
        const [assignmentsData, studentsData] = await Promise.all([
          mockApi.getAdminAssignments(adminId),
          mockApi.listStudents(adminId),
        ])

        if (activeAdminIdRef.current === adminId) {
          // Sort newest created first
          const sorted = [...assignmentsData].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          setAssignments(sorted)
          setStudents(studentsData)
          setStatus('success')
          setError(null)
        }
      } catch (err) {
        if (activeAdminIdRef.current === adminId) {
          if (!quiet) {
            setStatus('error')
            if (err instanceof ApiError) {
              setError(err.message)
            } else {
              setError('Failed to load assignments and student roster.')
            }
          }
        }
      }
    },
    [adminId],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live quiet refresh when storage changes in another tab or tab becomes visible again
  useEffect(() => {
    if (!adminId || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.SUBMISSIONS ||
        e.key === STORAGE_KEYS.ASSIGNMENTS
      ) {
        void fetchData(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchData(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [adminId, fetchData])

  // In-place UI state operations
  const addAssignment = useCallback((newAssignment: AdminAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev])
  }, [])

  const replaceAssignment = useCallback((updated: AdminAssignment) => {
    setAssignments((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
  }, [])

  const removeAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((item) => item.id !== assignmentId))
  }, [])

  return {
    assignments,
    students,
    status,
    error,
    reload: () => fetchData(false),
    reloadQuiet: () => fetchData(true),
    addAssignment,
    replaceAssignment,
    removeAssignment,
  }
}
