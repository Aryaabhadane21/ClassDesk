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
  CreateCourseModal,
  ProfessorCourseCard,
} from '@/components/courses'
import { useAuth } from '@/context/AuthContext'
import { useProfessorCourses } from '@/features/admin/useProfessorCourses'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'
import { getProfessorCourseStats } from '@/utils/stats'

export function ProfessorDashboardPage() {
  usePageTitle('Courses · ClassDesk')
  const { user } = useAuth()
  const {
    courses,
    status,
    error,
    reload,
    addCourse,
  } = useProfessorCourses()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  // Filter courses by name, code, or description (case-insensitive)
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    )
  }, [courses, searchQuery])

  // Overview metrics across all courses (never affected by search)
  const stats = useMemo(() => getProfessorCourseStats(courses), [courses])

  const greeting = user?.name
    ? `Welcome back, ${getGreetingName(user.name)}`
    : 'Welcome back'

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Your courses"
        description={greeting}
        actions={
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New course
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
              { label: 'Students enrolled', value: stats.studentCount },
              { label: 'Assignments', value: stats.assignmentCount },
              { label: 'Groups', value: stats.groupCount },
            ]}
          />
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. COURSES SECTION & SEARCH TOOLBAR                           */}
      {/* ------------------------------------------------------------- */}
      <section aria-labelledby="courses-list-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Eyebrow id="courses-list-heading">Your Courses</Eyebrow>

          {/* Polite live region for filtered count */}
          {status === 'success' && courses.length > 0 && (
            <p
              aria-live="polite"
              className="text-xs text-muted tabular-nums"
            >
              Showing {filteredCourses.length} of {courses.length}{' '}
              {courses.length === 1 ? 'course' : 'courses'}
            </p>
          )}
        </div>

        {/* Search input (visible if there are courses or if user is searching) */}
        {(courses.length > 0 || searchQuery) && (
          <SearchInput
            id="course-search-input"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search courses by name, code or description..."
            ariaLabel="Search courses by name, code or description"
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
                    <Skeleton className="h-7 w-24 rounded-md" />
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
            message={error || 'We encountered an error loading your courses. Please try again.'}
            onRetry={reload}
          />
        )}

        {/* Empty State: Professor has no courses */}
        {status === 'success' && courses.length === 0 && !searchQuery && (
          <EmptyState
            title="You haven't created any courses yet"
            description="Create a course, then share its join code with your students."
            action={
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create your first course
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
              <ProfessorCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Course Creation Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCourseCreated={addCourse}
      />
    </div>
  )
}
