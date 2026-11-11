import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  Skeleton,
} from '@/components/ui'
import { JoinCodeChip } from '@/components/courses'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError, mockApi } from '@/services/mockApi'
import type { Course } from '@/types'

/**
 * Temporary course view for professors.
 * Replaced in Round 2 Step 8 by the full Course Management & Assignments experience.
 */
export function ProfessorCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState<Course | null>(null)
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
      const data = await mockApi.getCourse(user.id, courseId)
      // Must be the professor of this course
      if (data.role !== 'professor' || data.course.professorId !== user.id) {
        setStatus('not_found')
        return
      }
      setCourse(data.course)
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
          description="This course may have been removed or you might not have permission to view it."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin')}
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

  return (
    <div className="space-y-6 text-left">
      {/* Back Link */}
      <div>
        <Link
          to="/admin"
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

      {/* Join Code Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-line shadow-card">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-fg">Course Join Code</p>
          <p className="text-xs text-muted">Students join with this code</p>
        </div>
        <div className="shrink-0">
          <JoinCodeChip
            code={course.joinCode}
            courseName={course.name}
            size="md"
          />
        </div>
      </div>

      {/* Temporary Placeholder for Assignments (replaced in Step 8) */}
      <div className="pt-2">
        <EmptyState
          icon={<ClipboardList className="w-8 h-8 text-muted" />}
          title="Assignments for this course arrive in the next step"
          description="Course assignments, individual and group submissions, and student grading will appear here."
        />
      </div>
    </div>
  )
}
