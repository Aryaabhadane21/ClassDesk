import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError, mockApi } from '@/services/mockApi'
import { STORAGE_KEYS } from '@/utils/constants'
import type {
  Course,
  GroupDetail,
  ProfessorCourseAssignment,
  SafeUser,
} from '@/types'

export type ProfessorCourseStatus = 'loading' | 'success' | 'error' | 'not_found'

export interface UseProfessorCourseReturn {
  course: Course | null
  students: SafeUser[]
  groups: GroupDetail[]
  assignments: ProfessorCourseAssignment[]
  status: ProfessorCourseStatus
  error: string | null
  reload: () => void
  addAssignment: (assignment: ProfessorCourseAssignment) => void
  replaceAssignment: (assignment: ProfessorCourseAssignment) => void
  removeAssignment: (assignmentId: string) => void
  upsertAssignment: (assignment: ProfessorCourseAssignment) => void
}

export function useProfessorCourse(courseId?: string): UseProfessorCourseReturn {
  const { user, status: authStatus } = useAuth()
  const userId = user?.id

  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<SafeUser[]>([])
  const [groups, setGroups] = useState<GroupDetail[]>([])
  const [assignments, setAssignments] = useState<ProfessorCourseAssignment[]>([])
  const [status, setStatus] = useState<ProfessorCourseStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  const activeKeyRef = useRef(`${userId}:${courseId}`)
  activeKeyRef.current = `${userId}:${courseId}`

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

      if (!userId || !courseId) {
        if (!isMountedRef.current) return
        setStatus('not_found')
        return
      }

      const requestKey = `${userId}:${courseId}`

      if (!quiet) {
        setStatus('loading')
        setError(null)
      }

      try {
        // 1. First getCourse to verify access & ownership
        const courseRes = await mockApi.getCourse(userId, courseId)
        if (courseRes.role !== 'professor') {
          if (isMountedRef.current && activeKeyRef.current === requestKey) {
            setStatus('not_found')
          }
          return
        }

        // 2. Load students, groups and assignments concurrently
        const [loadedStudents, loadedGroups, loadedAssignments] = await Promise.all([
          mockApi.listCourseStudents(userId, courseId),
          mockApi.listCourseGroups(userId, courseId),
          mockApi.listCourseAssignments(userId, courseId),
        ])

        if (!isMountedRef.current || activeKeyRef.current !== requestKey) {
          return
        }

        setCourse(courseRes.course)
        setStudents(loadedStudents)
        setGroups(loadedGroups)
        setAssignments(loadedAssignments)
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
              err instanceof ApiError
                ? err.message
                : 'Failed to load course details.',
            )
          }
        }
      }
    },
    [userId, courseId],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Quiet reload on window storage event and visibilitychange
  useEffect(() => {
    if (!userId || !courseId || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.COURSES ||
        e.key === STORAGE_KEYS.ASSIGNMENTS ||
        e.key === STORAGE_KEYS.SUBMISSIONS ||
        e.key === STORAGE_KEYS.ENROLLMENTS ||
        e.key === STORAGE_KEYS.GROUPS ||
        e.key === STORAGE_KEYS.GROUP_ACKS
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
  }, [fetchData, userId, courseId])

  // In-place mutation helpers
  const addAssignment = useCallback((newAssignment: ProfessorCourseAssignment) => {
    setAssignments((prev) => {
      const next = [...prev, newAssignment]
      return next.sort(
        (a, b) =>
          new Date(a.assignment.dueDate).getTime() -
          new Date(b.assignment.dueDate).getTime(),
      )
    })
  }, [])

  const replaceAssignment = useCallback(
    (updatedAssignment: ProfessorCourseAssignment) => {
      setAssignments((prev) => {
        const next = prev.map((item) =>
          item.assignment.id === updatedAssignment.assignment.id
            ? updatedAssignment
            : item,
        )
        return next.sort(
          (a, b) =>
            new Date(a.assignment.dueDate).getTime() -
            new Date(b.assignment.dueDate).getTime(),
        )
      })
    },
    [],
  )

  const removeAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.assignment.id !== assignmentId))
  }, [])

  const upsertAssignment = useCallback(
    (item: ProfessorCourseAssignment) => {
      setAssignments((prev) => {
        const exists = prev.some((a) => a.assignment.id === item.assignment.id)
        if (exists) {
          return prev.map((a) => (a.assignment.id === item.assignment.id ? item : a))
        }
        const next = [...prev, item]
        return next.sort(
          (a, b) =>
            new Date(a.assignment.dueDate).getTime() -
            new Date(b.assignment.dueDate).getTime(),
        )
      })
    },
    [],
  )

  const reload = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  return {
    course,
    students,
    groups,
    assignments,
    status,
    error,
    reload,
    addAssignment,
    replaceAssignment,
    removeAssignment,
    upsertAssignment,
  }
}
