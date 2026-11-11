import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError, mockApi } from '@/services/mockApi'
import type { StudentCourse, StudentCourseAssignment } from '@/types'

export type StudentCoursePageStatus = 'loading' | 'success' | 'error' | 'not_found'

export function useStudentCourseAssignments(courseId: string | undefined) {
  const { user } = useAuth()

  const [course, setCourse] = useState<StudentCourse | null>(null)
  const [assignments, setAssignments] = useState<StudentCourseAssignment[]>([])
  const [status, setStatus] = useState<StudentCoursePageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isMountedRef = useRef(true)

  const fetchCourseData = useCallback(
    async (silent = false) => {
      if (!user || !courseId) {
        setStatus('not_found')
        return
      }

      if (!silent) {
        setStatus('loading')
        setErrorMessage(null)
      }

      try {
        // 1. Verify access via getCourse to ensure student role boundaries
        const access = await mockApi.getCourse(user.id, courseId)
        if (access.role !== 'student') {
          if (isMountedRef.current) setStatus('not_found')
          return
        }

        // 2. Fetch student courses to obtain course details and myGroup
        const studentCourses = await mockApi.listStudentCourses(user.id)
        const matchedCourse = studentCourses.find((c) => c.id === courseId)
        if (!matchedCourse) {
          if (isMountedRef.current) setStatus('not_found')
          return
        }

        // 3. Fetch applicable assignments with acknowledgement & group info
        const asgs = await mockApi.getStudentCourseAssignments(user.id, courseId)

        if (isMountedRef.current) {
          setCourse(matchedCourse)
          setAssignments(asgs)
          setStatus('success')
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return
        if (err instanceof ApiError && err.code === 'NOT_FOUND') {
          setStatus('not_found')
        } else if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          setStatus('not_found')
        } else {
          setStatus('error')
          setErrorMessage(
            err instanceof ApiError ? err.message : 'Failed to load course assignments.',
          )
        }
      }
    },
    [user, courseId],
  )

  useEffect(() => {
    isMountedRef.current = true
    void fetchCourseData(false)

    // Quiet refresh on storage changes or tab visibility
    const handleStorage = () => {
      void fetchCourseData(true)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchCourseData(true)
      }
    }

    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMountedRef.current = false
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchCourseData])

  const submitIndividual = useCallback(
    async (assignmentId: string) => {
      if (!user) throw new Error('Not authenticated')
      await mockApi.markSubmitted(user.id, assignmentId)
      await fetchCourseData(true)
    },
    [user, fetchCourseData],
  )

  const submitGroup = useCallback(
    async (assignmentId: string) => {
      if (!user) throw new Error('Not authenticated')
      await mockApi.acknowledgeGroupAssignment(user.id, assignmentId)
      await fetchCourseData(true)
    },
    [user, fetchCourseData],
  )

  return {
    course,
    assignments,
    status,
    errorMessage,
    reload: fetchCourseData,
    submitIndividual,
    submitGroup,
  }
}
