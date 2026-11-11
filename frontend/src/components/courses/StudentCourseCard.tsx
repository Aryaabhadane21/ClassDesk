import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Crown,
  UserPlus,
  Users,
} from 'lucide-react'
import { CourseCardShell } from '@/components/courses/CourseCardShell'
import { Avatar, Badge, ProgressBar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import type { StudentCourse } from '@/types'

export interface StudentCourseCardProps {
  course: StudentCourse
  className?: string
}

export function StudentCourseCard({
  course,
  className,
}: StudentCourseCardProps) {
  const { user } = useAuth()

  const hasAssignments = course.assignmentCount > 0
  const isComplete =
    hasAssignments && course.acknowledgedCount === course.assignmentCount
  const percent = hasAssignments
    ? Math.round((course.acknowledgedCount / course.assignmentCount) * 100)
    : 0

  const isLeader =
    Boolean(course.myGroup && user && course.myGroup.leaderId === user.id)
  const isMember = Boolean(course.myGroup && !isLeader)

  return (
    <CourseCardShell
      course={course}
      href={`/student/courses/${course.id}`}
      className={className}
      footer={
        <>
          {/* Group Status Chip */}
          <div className="relative z-10 select-none">
            {isLeader && course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-accent-soft text-accent text-xs font-medium border border-accent/20">
                <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{course.myGroup.name} · Leader</span>
              </span>
            )}
            {isMember && course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-2 text-fg text-xs font-medium border border-line">
                <Users className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                <span>Member of {course.myGroup.name}</span>
              </span>
            )}
            {!course.myGroup && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-2 text-muted text-xs font-medium border border-line">
                <UserPlus className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                <span>No group yet</span>
              </span>
            )}
          </div>

          {/* Open Course Affordance */}
          <span
            className="inline-flex items-center gap-1 font-medium text-xs text-muted group-hover:text-accent pointer-events-none select-none motion-safe:transition-colors"
            aria-hidden="true"
          >
            <span>Open course</span>
            <ArrowRight className="w-3.5 h-3.5 motion-safe:transition-transform group-hover:translate-x-0.5" />
          </span>
        </>
      }
    >
      <div className="space-y-3 pt-1">
        {/* 1. Professor Details */}
        <div className="flex items-center gap-2">
          <Avatar name={course.professor.name} size="sm" />
          <span className="text-xs font-medium text-fg truncate">
            {course.professor.name}
          </span>
        </div>

        {/* 2. Progress */}
        {hasAssignments ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted tabular-nums">
              <span>
                {course.acknowledgedCount} of {course.assignmentCount} done
              </span>
              <span className="font-semibold text-fg">{percent}%</span>
            </div>
            <ProgressBar
              value={course.acknowledgedCount}
              max={course.assignmentCount}
              tone={isComplete ? 'success' : 'accent'}
            />
          </div>
        ) : (
          <p className="text-xs text-muted italic">No assignments yet</p>
        )}

        {/* 3. Status Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none">
          {course.overdueCount > 0 && (
            <Badge
              tone="danger"
              size="sm"
              icon={<AlertTriangle className="w-3 h-3" />}
            >
              <span className="tabular-nums">
                {course.overdueCount} {course.overdueCount === 1 ? 'overdue' : 'overdue'}
              </span>
            </Badge>
          )}

          {course.dueSoonCount > 0 && (
            <Badge
              tone="warning"
              size="sm"
              icon={<Clock className="w-3 h-3" />}
            >
              <span className="tabular-nums">
                {course.dueSoonCount} due soon
              </span>
            </Badge>
          )}

          {isComplete && (
            <Badge
              tone="success"
              size="sm"
              icon={<CheckCircle className="w-3 h-3" />}
            >
              <span>All done</span>
            </Badge>
          )}
        </div>
      </div>
    </CourseCardShell>
  )
}
