import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  SearchInput,
  Skeleton,
  StatStrip,
  StatStripSkeleton,
} from '@/components/ui'
import {
  JoinCourseModal,
  StudentCourseCard,
} from '@/components/courses'
import { useAuth } from '@/context/AuthContext'
import { useStudentCourses } from '@/features/student/useStudentCourses'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageTitle } from '@/hooks/usePageTitle'
import { CURRENT_SEMESTER } from '@/utils/constants'
import { getGreetingName } from '@/utils/names'
import { getStudentCourseStats } from '@/utils/stats'

export function StudentDashboardPage() {
  usePageTitle('Courses · ClassDesk')
  const { user } = useAuth()
  const { courses, status, error, reload, addCourse } = useStudentCourses()

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  // URL search query synchronization
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const debouncedQuery = useDebounce(searchQuery, 250)

  // Sync debounced search to URL search param
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedQuery.trim()) {
          next.set('q', debouncedQuery.trim())
        } else {
          next.delete('q')
        }
        return next
      },
      { replace: true },
    )
  }, [debouncedQuery, setSearchParams])

  // Sync state if URL changes externally (e.g. browser history navigation)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchQuery && q !== debouncedQuery) {
      setSearchQuery(q)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter courses by name, code, description, or professor name (case-insensitive)
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.professor.name.toLowerCase().includes(q),
    )
  }, [courses, searchQuery])

  // Overview metrics across all enrolled courses (never affected by search)
  const stats = useMemo(() => getStudentCourseStats(courses), [courses])

  const greeting = user?.name ? getGreetingName(user.name) : 'there'
  const headerDescription = `Courses you're enrolled in for ${CURRENT_SEMESTER}. Welcome back, ${greeting}.`

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Your courses"
        description={headerDescription}
        actions={
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsJoinModalOpen(true)}
          >
            Join a course
          </Button>
        }
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. SINGLE-ROW STAT STRIP                                      */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Course statistics">
        {status === 'loading' ? (
          <StatStripSkeleton />
        ) : (
          <StatStrip
            items={[
              { label: 'Courses', value: stats.courseCount },
              { label: 'Assignments', value: stats.assignmentCount },
              { label: 'Completed', value: stats.completedCount },
              { label: 'Overdue', value: stats.overdueCount, isOverdue: true },
            ]}
          />
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. COURSES SECTION & SEARCH TOOLBAR                           */}
      {/* ------------------------------------------------------------- */}
      <section aria-labelledby="student-courses-list" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Eyebrow id="student-courses-list">Your Courses</Eyebrow>

          {/* Polite live region for filtered count */}
          {status === 'success' && courses.length > 0 && (
            <p aria-live="polite" className="text-xs text-muted tabular-nums">
              Showing {filteredCourses.length} of {courses.length}{' '}
              {courses.length === 1 ? 'course' : 'courses'}
            </p>
          )}
        </div>

        {/* Search input (visible if student has courses or is searching) */}
        {(courses.length > 0 || searchQuery) && (
          <SearchInput
            id="student-course-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by course name, code, description or professor..."
            ariaLabel="Search by course name, code, description or professor"
          />
        )}

        {/* Loading State: Skeletons */}
        {status === 'loading' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6"
            aria-label="Loading courses"
            aria-busy="true"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-line bg-surface overflow-hidden flex flex-col justify-between"
              >
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="pt-4 border-t border-line flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-pill" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <ErrorState
            title="Failed to load courses"
            message={error || 'We encountered an error loading your enrolled courses. Please try again.'}
            onRetry={reload}
          />
        )}

        {/* Empty State: Student not enrolled in any courses */}
        {status === 'success' && courses.length === 0 && !searchQuery && (
          <EmptyState
            title="You're not enrolled in any course yet"
            description="Ask your professor for a join code, then join the course here."
            action={
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsJoinModalOpen(true)}
              >
                Join your first course
              </Button>
            }
          />
        )}

        {/* Empty State: Search yielded no matches */}
        {status === 'success' && courses.length > 0 && filteredCourses.length === 0 && (
          <EmptyState
            icon={<Search className="w-8 h-8 text-muted" />}
            title="No matching courses"
            description={`No courses match your search "${searchQuery}". Try a different keyword.`}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            }
          />
        )}

        {/* Course Cards Grid */}
        {status === 'success' && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <StudentCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Join Course Modal */}
      <JoinCourseModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onCourseJoined={addCourse}
      />
    </div>
  )
}
