import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError, mockApi } from '@/services/mockApi'
import { STORAGE_KEYS } from '@/utils/constants'
import type { Course, ProfessorCourseAssignment } from '@/types'

export type AssignmentDetailStatus = 'loading' | 'success' | 'error' | 'not_found'

export interface UseProfessorAssignmentDetailReturn {
  course: Course | null
  item: ProfessorCourseAssignment | null
  status: AssignmentDetailStatus
  error: string | null
  reload: () => void
}

export function useProfessorAssignmentDetail(
  courseId?: string,
  assignmentId?: string,
): UseProfessorAssignmentDetailReturn {
  const { user, status: authStatus } = useAuth()
  const userId = user?.id

  const [course, setCourse] = useState<Course | null>(null)
  const [item, setItem] = useState<ProfessorCourseAssignment | null>(null)
  const [status, setStatus] = useState<AssignmentDetailStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  const activeKeyRef = useRef(`${userId}:${courseId}:${assignmentId}`)
  activeKeyRef.current = `${userId}:${courseId}:${assignmentId}`

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(
    async (quiet = false) => {
      if (authStatus === 'loading') {
        return
      }

      if (!userId || !courseId || !assignmentId) {
        if (!isMountedRef.current) return
        setStatus('not_found')
        return
      }

      const requestKey = `${userId}:${courseId}:${assignmentId}`

      if (!quiet) {
        setStatus('loading')
        setError(null)
      }

      try {
        // 1. Verify course ownership
        const courseRes = await mockApi.getCourse(userId, courseId)
        if (courseRes.role !== 'professor' || courseRes.course.professorId !== userId) {
          if (isMountedRef.current && activeKeyRef.current === requestKey) {
            setStatus('not_found')
          }
          return
        }

        // 2. Fetch the assignment details with full tracking
        const assignmentRes = await mockApi.getCourseAssignment(userId, courseId, assignmentId)

        if (!isMountedRef.current || activeKeyRef.current !== requestKey) {
          return
        }

        setCourse(courseRes.course)
        setItem(assignmentRes)
        setStatus('success')
        setError(null)
      } catch (err: unknown) {
        if (!isMountedRef.current || activeKeyRef.current !== requestKey) {
          return
        }

        if (err instanceof ApiError && (err.code === 'NOT_FOUND' || err.code === 'UNAUTHORIZED')) {
          setStatus('not_found')
        } else {
          if (!quiet) {
            setStatus('error')
            setError(
              err instanceof ApiError ? err.message : 'Failed to load assignment details.',
            )
          }
        }
      }
    },
    [authStatus, userId, courseId, assignmentId],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Quiet reload on storage events and visibility change
  useEffect(() => {
    if (!userId || !courseId || !assignmentId || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.ASSIGNMENTS ||
        e.key === STORAGE_KEYS.SUBMISSIONS ||
        e.key === STORAGE_KEYS.GROUPS ||
        e.key === STORAGE_KEYS.GROUP_ACKS ||
        e.key === STORAGE_KEYS.ENROLLMENTS
      ) {
        fetchData(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchData, userId, courseId, assignmentId])

  const reload = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  return {
    course,
    item,
    status,
    error,
    reload,
  }
}
