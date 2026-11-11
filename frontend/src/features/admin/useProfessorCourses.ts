import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { mockApi, ApiError } from '@/services/mockApi'
import { STORAGE_KEYS } from '@/utils/constants'
import type { Course, CourseInput, ProfessorCourse } from '@/types'

export type ProfessorCoursesStatus = 'loading' | 'success' | 'error'

export interface UseProfessorCoursesReturn {
  courses: ProfessorCourse[]
  status: ProfessorCoursesStatus
  error: string | null
  reload: () => void
  addCourse: (course: Course | ProfessorCourse) => void
  createCourse: (input: CourseInput) => Promise<Course>
}

export function useProfessorCourses(): UseProfessorCoursesReturn {
  const { user } = useAuth()
  const userId = user?.id

  const [courses, setCourses] = useState<ProfessorCourse[]>([])
  const [status, setStatus] = useState<ProfessorCoursesStatus>('loading')
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
        const data = await mockApi.listProfessorCourses(userId)
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
            setError('Failed to load courses.')
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
        e.key === STORAGE_KEYS.GROUPS
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

  const addCourse = useCallback((newCourse: Course | ProfessorCourse) => {
    const profCourse: ProfessorCourse = {
      studentCount: 0,
      assignmentCount: 0,
      groupCount: 0,
      ...newCourse,
    }
    setCourses((prev) => {
      if (prev.some((c) => c.id === profCourse.id)) return prev
      return [profCourse, ...prev]
    })
  }, [])

  const createCourse = useCallback(
    async (input: CourseInput): Promise<Course> => {
      if (!userId) {
        throw new ApiError('Not authenticated', 'UNAUTHORIZED')
      }
      const created = await mockApi.createCourse(userId, input)
      addCourse(created)
      return created
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
    createCourse,
  }
}
