import { ArrowRight, ClipboardList, FolderGit2, Users } from 'lucide-react'
import { CourseCardShell } from '@/components/courses/CourseCardShell'
import { JoinCodeChip } from '@/components/courses/JoinCodeChip'
import type { ProfessorCourse } from '@/types'

export interface ProfessorCourseCardProps {
  course: ProfessorCourse
  className?: string
}

export function ProfessorCourseCard({
  course,
  className,
}: ProfessorCourseCardProps) {
  const studentLabel =
    course.studentCount === 1
      ? '1 student'
      : `${course.studentCount} students`

  const assignmentLabel =
    course.assignmentCount === 1
      ? '1 assignment'
      : `${course.assignmentCount} assignments`

  const groupLabel =
    course.groupCount === 1
      ? '1 group'
      : `${course.groupCount} groups`

  return (
    <CourseCardShell
      course={course}
      href={`/admin/courses/${course.id}`}
      className={className}
      footer={
        <>
          <div className="relative z-10">
            <JoinCodeChip
              code={course.joinCode}
              courseName={course.name}
              size="sm"
            />
          </div>

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
      {/* 3 Metric Chips */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted pt-1">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Users className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
          <span>{studentLabel}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <ClipboardList className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
          <span>{assignmentLabel}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <FolderGit2 className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
          <span>{groupLabel}</span>
        </span>
      </div>
    </CourseCardShell>
  )
}
