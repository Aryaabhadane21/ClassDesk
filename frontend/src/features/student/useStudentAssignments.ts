import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { mockApi, ApiError } from '@/services/mockApi'
import type { StudentAssignment } from '@/types'

export type DataStatus = 'loading' | 'success' | 'error'

export interface AssignmentCounts {
  total: number
  submitted: number
  remaining: number
}

export function useStudentAssignments() {
  const { user } = useAuth()
  const studentId = user?.id

  const [assignments, setAssignments] = useState<StudentAssignment[]>([])
  const [status, setStatus] = useState<DataStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const activeStudentIdRef = useRef(studentId)
  activeStudentIdRef.current = studentId

  const fetchAssignments = useCallback(async () => {
    if (!studentId) {
      setAssignments([])
      setStatus('success')
      setError(null)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const data = await mockApi.getStudentAssignments(studentId)
      // Guard against stale response if user switched or component unmounted
      if (activeStudentIdRef.current === studentId) {
        setAssignments(data)
        setStatus('success')
      }
    } catch (err) {
      if (activeStudentIdRef.current === studentId) {
        setStatus('error')
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to load assignments. Please try again.')
        }
      }
    }
  }, [studentId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Allows in-place state modification for single assignments
  const updateAssignment = useCallback((updated: StudentAssignment) => {
    setAssignments((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
  }, [])

  // Derived completion counts
  const counts = useMemo<AssignmentCounts>(() => {
    const total = assignments.length
    const submitted = assignments.filter((a) => a.status === 'submitted').length
    const remaining = total - submitted
    return { total, submitted, remaining }
  }, [assignments])

  return {
    assignments,
    status,
    error,
    reload: fetchAssignments,
    updateAssignment,
    counts,
  }
}
