import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { mockApi, ApiError } from '@/services/mockApi'
import { STORAGE_KEYS } from '@/utils/constants'
import type { StudentCourse } from '@/types'

export type StudentCoursesStatus = 'loading' | 'success' | 'error'

export interface UseStudentCoursesReturn {
  courses: StudentCourse[]
  status: StudentCoursesStatus
  error: string | null
  reload: () => void
  addCourse: (course: StudentCourse) => void
  joinCourse: (code: string) => Promise<StudentCourse>
}

export function useStudentCourses(): UseStudentCoursesReturn {
  const { user } = useAuth()
  const userId = user?.id

  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [status, setStatus] = useState<StudentCoursesStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const activeUserIdRef = useRef(userId)
  activeUserIdRef.current = userId

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(
    async (quiet = false) => {
      if (!userId) {
        if (!isMountedRef.current) return
        setCourses([])
        setStatus('success')
        setError(null)
        return
      }

      if (!quiet) {
        setStatus('loading')
        setError(null)
      }

      try {
        const data = await mockApi.listStudentCourses(userId)
        if (!isMountedRef.current || activeUserIdRef.current !== userId) return

        setCourses(data)
        setStatus('success')
        setError(null)
      } catch (err) {
        if (!isMountedRef.current || activeUserIdRef.current !== userId) return
        if (!quiet) {
          setStatus('error')
          if (err instanceof ApiError) {
            setError(err.message)
          } else {
            setError('Failed to load enrolled courses.')
          }
        }
      }
    },
    [userId],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Quiet reload on window storage change and tab visibility
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.COURSES ||
        e.key === STORAGE_KEYS.ENROLLMENTS ||
        e.key === STORAGE_KEYS.ASSIGNMENTS ||
        e.key === STORAGE_KEYS.SUBMISSIONS ||
        e.key === STORAGE_KEYS.GROUPS ||
        e.key === STORAGE_KEYS.GROUP_ACKS
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
  }, [userId, fetchData])

  const addCourse = useCallback((newCourse: StudentCourse) => {
    setCourses((prev) => {
      if (prev.some((c) => c.id === newCourse.id)) return prev
      return [newCourse, ...prev]
    })
  }, [])

  const joinCourse = useCallback(
    async (code: string): Promise<StudentCourse> => {
      if (!userId) {
        throw new ApiError('Not authenticated', 'UNAUTHORIZED')
      }
      const joined = await mockApi.joinCourseByCode(userId, code)
      addCourse(joined)
      return joined
    },
    [userId, addCourse],
  )

  const reload = useCallback(() => {
    void fetchData(false)
  }, [fetchData])

  return {
    courses,
    status,
    error,
    reload,
    addCourse,
    joinCourse,
  }
}
