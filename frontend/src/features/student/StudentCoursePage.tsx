import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Crown,
  UserPlus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  Skeleton,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError, mockApi } from '@/services/mockApi'
import type { StudentCourse } from '@/types'

/**
 * Temporary course view for students.
 * Replaced in Round 2 Step 10 by the full Student Course Assignments & Group Hub.
 */
export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState<StudentCourse | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not_found'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageTitle(course ? `${course.name} · ClassDesk` : 'Course · ClassDesk')

  const fetchCourse = async () => {
    if (!user || !courseId) {
      setStatus('not_found')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      // First verify access via getCourse to ensure student role boundaries
      const access = await mockApi.getCourse(user.id, courseId)
      if (access.role !== 'student') {
        setStatus('not_found')
        return
      }

      // Retrieve student-specific course details including myGroup
      const studentCourses = await mockApi.listStudentCourses(user.id)
      const matched = studentCourses.find((c) => c.id === courseId)
      if (!matched) {
        setStatus('not_found')
        return
      }

      setCourse(matched)
      setStatus('success')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_FOUND') {
        setStatus('not_found')
      } else {
        setStatus('error')
        setErrorMessage(
          err instanceof ApiError ? err.message : 'Failed to load course details.',
        )
      }
    }
  }

  useEffect(() => {
    void fetchCourse()
  }, [user?.id, courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (status === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-5 w-28 rounded-sm" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  // Not found or unauthorized: friendly state without leaking existence
  if (status === 'not_found') {
    return (
      <div className="py-12">
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-muted" />}
          title="We couldn't find that course"
          description="This course may have been removed or you might not be enrolled in it."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/student')}
            >
              Back to courses
            </Button>
          }
        />
      </div>
    )
  }

  // Other error
  if (status === 'error' || !course) {
    return (
      <div className="py-8">
        <ErrorState
          title="Error loading course"
          message={errorMessage || 'An unexpected error occurred.'}
          onRetry={fetchCourse}
        />
      </div>
    )
  }

  const isLeader = Boolean(course.myGroup && user && course.myGroup.leaderId === user.id)
  const isMember = Boolean(course.myGroup && !isLeader)

  return (
    <div className="space-y-6 text-left">
      {/* Back Link */}
      <div>
        <Link
          to="/student"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to courses</span>
        </Link>
      </div>

      {/* Course Header */}
      <div className="space-y-2 border-b border-line pb-6">
        <Eyebrow>{course.code} · {course.semester}</Eyebrow>
        <PageHeader
          title={course.name}
          description={course.description}
          className="border-b-0 pb-0 mb-0"
        />
      </div>

      {/* Professor and Group Status Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-line shadow-card">
        {/* Professor Profile */}
        <div className="flex items-center gap-3">
          <Avatar name={course.professor.name} size="md" />
          <div className="space-y-0.5">
            <p className="text-xs text-muted">Instructor</p>
            <p className="text-sm font-semibold text-fg">{course.professor.name}</p>
          </div>
        </div>

        {/* Group Status */}
        <div className="select-none">
          {isLeader && course.myGroup && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent-soft text-accent text-xs font-medium border border-accent/20">
              <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{course.myGroup.name} · Leader</span>
            </span>
          )}
          {isMember && course.myGroup && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-2 text-fg text-xs font-medium border border-line">
              <Users className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
              <span>Member of {course.myGroup.name}</span>
            </span>
          )}
          {!course.myGroup && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-2 text-muted text-xs font-medium border border-line">
              <UserPlus className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
              <span>No group yet</span>
            </span>
          )}
        </div>
      </div>

      {/* Temporary Placeholder for Assignments (replaced in Step 10) */}
      <div className="pt-2">
        <EmptyState
          icon={<ClipboardList className="w-8 h-8 text-muted" />}
          title="Assignments for this course arrive in the next step"
          description="Course assignments, individual submissions, and group project acknowledgements will appear here in Step 10."
        />
      </div>
    </div>
  )
}
