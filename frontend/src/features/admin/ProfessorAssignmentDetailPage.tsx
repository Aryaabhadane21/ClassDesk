import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Info,
  Search,
  User,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Eyebrow,
  ProgressBar,
  SearchInput,
  Skeleton,
  StatCard,
} from '@/components/ui'
import { DueLabel } from '@/components/assignments/DueLabel'
import { useProfessorAssignmentDetail } from '@/features/admin/useProfessorAssignmentDetail'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatSubmissionDate } from '@/utils/dates'
import { getAdminUrgency } from '@/utils/dueStyles'
import { cn } from '@/utils/cn'

export function ProfessorAssignmentDetailPage() {
  const { courseId, assignmentId } = useParams<{
    courseId: string
    assignmentId: string
  }>()
  const navigate = useNavigate()

  const { course, item, status, error, reload } = useProfessorAssignmentDetail(
    courseId,
    assignmentId,
  )

  const assignment = item?.assignment
  const tracking = item?.tracking

  usePageTitle(
    assignment ? `${assignment.title} · Submissions · ClassDesk` : 'Assignment · ClassDesk',
  )

  // Filters & Search state
  const [filterTab, setFilterTab] = useState<'all' | 'submitted' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isGroup = assignment?.submissionType === 'group'

  // Urgency styling
  const isOverdue = assignment
    ? new Date(assignment.dueDate).getTime() < Date.now()
    : false

  const urgency = assignment && tracking
    ? getAdminUrgency(
        assignment.dueDate,
        tracking.submitted,
        tracking.total,
      )
    : null

  // Metric computations
  const percent =
    tracking && tracking.total > 0
      ? Math.round((tracking.submitted / tracking.total) * 100)
      : 0
  const isComplete = percent === 100 && (tracking?.total || 0) > 0
  const pendingCount = tracking ? Math.max(0, tracking.total - tracking.submitted) : 0

  // Filter individual entries
  const filteredIndividualEntries = useMemo(() => {
    if (!tracking || tracking.kind !== 'individual') return []

    return tracking.entries.filter((entry) => {
      // Tab filter
      if (filterTab === 'submitted' && entry.status !== 'submitted') return false
      if (filterTab === 'pending' && entry.status === 'submitted') return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchesName = entry.student.name.toLowerCase().includes(query)
        const matchesEmail = entry.student.email.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail) return false
      }

      return true
    })
  }, [tracking, filterTab, searchQuery])

  // Filter group entries
  const filteredGroupEntries = useMemo(() => {
    if (!tracking || tracking.kind !== 'group') return []

    return tracking.entries.filter((entry) => {
      // Tab filter
      if (filterTab === 'submitted' && entry.status !== 'submitted') return false
      if (filterTab === 'pending' && entry.status === 'submitted') return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchesGroup = entry.group.name.toLowerCase().includes(query)
        const matchesLeader = entry.group.leader.name.toLowerCase().includes(query)
        const matchesMembers = entry.group.members.some((m) =>
          m.name.toLowerCase().includes(query),
        )
        if (!matchesGroup && !matchesLeader && !matchesMembers) return false
      }

      return true
    })
  }, [tracking, filterTab, searchQuery])

  const handleClearFilters = () => {
    setFilterTab('all')
    setSearchQuery('')
  }

  // 1. Loading state
  if (status === 'loading') {
    return (
      <div className="space-y-8 text-left" aria-busy="true">
        <Skeleton className="h-5 w-28 rounded-sm" />

        <div className="space-y-3 border-b border-line pb-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-2/3 max-w-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 flex items-center gap-3.5 bg-surface border border-line rounded-lg"
            >
              <Skeleton className="w-10 h-10 rounded-pill shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  // 2. Not found / Unauthorized
  if (status === 'not_found' || !course || !assignment || !tracking) {
    return (
      <div className="py-12 text-left">
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-muted" />}
          title="We couldn't find that assignment"
          description="The assignment you are looking for may have been removed or you might not have permission to view it."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(courseId ? `/admin/courses/${courseId}` : '/admin')}
            >
              Back to course
            </Button>
          }
        />
      </div>
    )
  }

  // 3. Error state
  if (status === 'error') {
    return (
      <div className="py-8 text-left">
        <ErrorState
          title="Error loading assignment"
          message={error || 'An unexpected error occurred.'}
          onRetry={reload}
        />
      </div>
    )
  }

  const totalEntriesCount = tracking.entries.length
  const filteredCount = isGroup
    ? filteredGroupEntries.length
    : filteredIndividualEntries.length
  const hasActiveFilters = filterTab !== 'all' || Boolean(searchQuery.trim())

  return (
    <div className="space-y-8 text-left">
      {/* 1. Back link to course */}
      <div>
        <Link
          to={`/admin/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm motion-safe:transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to {course.name}</span>
        </Link>
      </div>

      {/* 2. Header, metadata & Actions */}
      <div className="space-y-3 pb-6 border-b border-line">
        <Eyebrow>{course.code} · {course.semester}</Eyebrow>
        <PageHeader
          title={assignment.title}
          description={assignment.description}
          actions={
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={assignment.oneDriveLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  size="md"
                  rightIcon={<ExternalLink className="w-4 h-4" aria-hidden="true" />}
                  aria-label={`Open OneDrive folder for ${assignment.title} (opens in a new tab)`}
                >
                  Open OneDrive
                </Button>
              </a>
            </div>
          }
        />

        {/* Metadata row: type badge, audience, deadline */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <Badge
            tone="neutral"
            size="sm"
            icon={
              isGroup ? (
                <Users className="w-3 h-3 text-muted" aria-hidden="true" />
              ) : (
                <User className="w-3 h-3 text-muted" aria-hidden="true" />
              )
            }
          >
            {isGroup ? 'Group' : 'Individual'}
          </Badge>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface-2 border border-line text-xs font-medium text-fg">
            <Users className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
            <span>
              {isGroup
                ? 'All groups'
                : assignment.audience === 'selected'
                  ? `${assignment.assignedTo.length} selected students`
                  : `All ${assignment.assignedTo.length} students`}
            </span>
          </span>

          <div
            className={cn(
              'flex items-center gap-2 rounded-md',
              urgency?.isUrgent && urgency.dueRowClasses,
            )}
          >
            <DueLabel dueDate={assignment.dueDate} />
          </div>

          {urgency?.isUrgent && (
            <Badge tone={urgency.tone} size="sm">
              {urgency.badgeLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* 3. Summary StatCards (Submitted, Pending, Total, Completion %) */}
      <section aria-labelledby="summary-heading" className="space-y-4">
        <Eyebrow id="summary-heading">Summary</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={isGroup ? 'Acknowledged' : 'Submitted'}
            value={tracking.submitted}
            tone={isComplete ? 'success' : 'default'}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            tone={pendingCount > 0 && isOverdue ? 'danger' : 'default'}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            label={isGroup ? 'Total groups' : 'Total assigned'}
            value={tracking.total}
            icon={isGroup ? <FolderGit2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          />
          <StatCard
            label="Completion"
            value={`${percent}%`}
            tone={isComplete ? 'success' : 'default'}
            icon={<BarChart2 className="w-5 h-5" />}
          />
        </div>

        {/* Progress Bar Card */}
        <Card className="p-4 sm:p-5 bg-surface border border-line rounded-lg shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-medium tabular-nums">
            <span className="text-muted">
              {tracking.submitted} of {tracking.total}{' '}
              {isGroup ? 'groups acknowledged' : 'students submitted'}
            </span>
            <span className="font-semibold text-fg">{percent}%</span>
          </div>
          <ProgressBar
            value={tracking.submitted}
            max={tracking.total || 1}
            tone={isComplete ? 'success' : 'accent'}
            aria-label={`Overall progress for ${assignment.title}`}
          />
        </Card>
      </section>

      {/* 4. Submissions Drill-down Section */}
      <section aria-labelledby="submissions-heading" className="space-y-4">
        <div className="space-y-1">
          <Eyebrow id="submissions-heading">
            {isGroup ? 'Group acknowledgements' : 'Student submissions'}
          </Eyebrow>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg tracking-tight">
              {isGroup ? 'Group tracking' : 'Submissions drill-down'}{' '}
              <span className="text-muted text-sm font-normal tabular-nums">
                ({totalEntriesCount})
              </span>
            </h2>
          </div>
        </div>

        {/* Ungrouped students notice for group assignments */}
        {tracking.kind === 'group' && tracking.ungroupedStudents.length > 0 && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-surface-2/60 border border-line text-xs text-muted">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-fg">
                {tracking.ungroupedStudents.length}{' '}
                {tracking.ungroupedStudents.length === 1 ? 'student is' : 'students are'} not in
                any group
              </p>
              <p className="mt-0.5">
                {tracking.ungroupedStudents.map((s) => s.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {totalEntriesCount === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={isGroup ? <FolderGit2 className="w-10 h-10 text-muted" /> : <Users className="w-10 h-10 text-muted" />}
              title={isGroup ? 'No groups yet' : 'No students enrolled yet'}
              description={
                isGroup
                  ? "Students haven't created any groups in this course yet."
                  : 'Students will appear here once they enroll in this course.'
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter toolbar: tabs + search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div
                role="radiogroup"
                aria-label="Status filter"
                className="inline-flex rounded-pill border border-line bg-surface-2 p-0.5 min-h-[44px] items-center self-start overflow-x-auto max-w-full"
              >
                {[
                  { label: 'All', value: 'all' as const, count: totalEntriesCount },
                  {
                    label: isGroup ? 'Acknowledged' : 'Submitted',
                    value: 'submitted' as const,
                    count: tracking.submitted,
                  },
                  { label: 'Pending', value: 'pending' as const, count: pendingCount },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    role="radio"
                    aria-checked={filterTab === tab.value}
                    aria-label={`${tab.label} (${tab.count})`}
                    onClick={() => setFilterTab(tab.value)}
                    className={cn(
                      'h-[38px] px-3.5 rounded-pill flex items-center gap-2 text-xs font-medium cursor-pointer select-none whitespace-nowrap motion-safe:transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:z-10',
                      filterTab === tab.value
                        ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                        : 'text-muted hover:text-fg hover:bg-surface/60',
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-pill font-mono',
                        filterTab === tab.value
                          ? 'bg-primary-fg/20 text-primary-fg'
                          : 'bg-surface text-muted border border-line',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search box */}
              <div className="w-full sm:w-72">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={
                    isGroup
                      ? 'Search by group or member...'
                      : 'Search by student name or email...'
                  }
                  ariaLabel={
                    isGroup
                      ? 'Search by group or member name'
                      : 'Search by student name or email'
                  }
                />
              </div>
            </div>

            {/* Live result count */}
            <div
              id="submissions-result-count"
              tabIndex={-1}
              aria-live="polite"
              className="text-xs text-muted font-medium outline-none"
            >
              Showing {filteredCount} of {totalEntriesCount}{' '}
              {isGroup
                ? totalEntriesCount === 1
                  ? 'group'
                  : 'groups'
                : totalEntriesCount === 1
                  ? 'student'
                  : 'students'}
              {hasActiveFilters && filteredCount < totalEntriesCount && ' (filtered)'}
            </div>

            {/* Zero matching items empty state */}
            {filteredCount === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<Search className="w-10 h-10 text-muted" />}
                  title={isGroup ? 'No matching groups' : 'No matching students'}
                  description="Try adjusting your search query or filter tab."
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearFilters}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : isGroup ? (
              /* Group list */
              <div className="space-y-4">
                {filteredGroupEntries.map((entry) => {
                  const isAck = entry.status === 'submitted'
                  return (
                    <Card
                      key={entry.group.id}
                      className="p-4 sm:p-5 bg-surface border border-line rounded-lg shadow-card text-left space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                        <div className="space-y-1">
                          <h3 className="font-display text-base font-semibold text-fg tracking-tight">
                            {entry.group.name}
                          </h3>
                          <p className="text-xs text-muted">
                            {isAck && entry.acknowledgedAt ? (
                              <span className="text-success font-medium">
                                Acknowledged by {entry.group.leader.name} on{' '}
                                {formatSubmissionDate(entry.acknowledgedAt)}
                              </span>
                            ) : isOverdue ? (
                              <span className="text-danger font-medium">
                                Pending acknowledgement (Overdue)
                              </span>
                            ) : (
                              <span>Pending acknowledgement</span>
                            )}
                          </p>
                        </div>

                        <div>
                          {isAck ? (
                            <Badge
                              tone="success"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                            >
                              Acknowledged
                            </Badge>
                          ) : isOverdue ? (
                            <Badge
                              tone="danger"
                              size="sm"
                              icon={<AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                            >
                              Overdue
                            </Badge>
                          ) : (
                            <Badge
                              tone="warning"
                              size="sm"
                              icon={<Clock className="w-3.5 h-3.5" aria-hidden="true" />}
                            >
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Group Leader */}
                      <div className="flex items-center gap-3 text-xs">
                        <Avatar name={entry.group.leader.name} size="sm" />
                        <div>
                          <p className="font-semibold text-fg">
                            Leader: {entry.group.leader.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            {entry.group.leader.email}
                          </p>
                        </div>
                      </div>

                      {/* Members list */}
                      <div className="pt-2 border-t border-line/60">
                        <p className="text-xs font-medium text-muted mb-2">
                          Team Members ({entry.group.members.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entry.group.members.map((member) => (
                            <span
                              key={member.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-2 border border-line text-xs font-medium text-fg"
                            >
                              <Avatar name={member.name} size="sm" />
                              <span>{member.name}</span>
                              {member.id === entry.group.leaderId && (
                                <span className="text-[10px] text-accent font-semibold">
                                  (Leader)
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* Individual list: Desktop Table + Mobile Cards */
              <div>
                {/* Desktop Table (md and up) */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-line bg-surface shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <caption className="sr-only">
                      Student submission status for {assignment.title}
                    </caption>
                    <thead>
                      <tr className="border-b border-line bg-surface-2/50 text-xs font-semibold uppercase tracking-wider text-muted">
                        <th scope="col" className="py-3.5 px-5">
                          Student
                        </th>
                        <th scope="col" className="py-3.5 px-5">
                          Status
                        </th>
                        <th scope="col" className="py-3.5 px-5">
                          Submitted on
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-sm">
                      {filteredIndividualEntries.map((entry) => {
                        const isSubmitted = entry.status === 'submitted'
                        const isLate =
                          isSubmitted &&
                          entry.submittedAt &&
                          new Date(entry.submittedAt).getTime() >
                            new Date(assignment.dueDate).getTime()

                        return (
                          <tr
                            key={entry.student.id}
                            className="hover:bg-surface-2/40 motion-safe:transition-colors"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <Avatar name={entry.student.name} size="sm" />
                                <div className="min-w-0">
                                  <p className="font-medium text-fg truncate">
                                    {entry.student.name}
                                  </p>
                                  <p className="text-xs text-muted truncate">
                                    {entry.student.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              {isSubmitted ? (
                                <Badge
                                  tone="success"
                                  size="sm"
                                  icon={
                                    <CheckCircle2
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  }
                                >
                                  Submitted
                                </Badge>
                              ) : isOverdue ? (
                                <Badge
                                  tone="danger"
                                  size="sm"
                                  icon={
                                    <AlertCircle
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  }
                                >
                                  Overdue
                                </Badge>
                              ) : (
                                <Badge
                                  tone="warning"
                                  size="sm"
                                  icon={
                                    <Clock
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  }
                                >
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted">
                                  {entry.submittedAt
                                    ? formatSubmissionDate(entry.submittedAt)
                                    : '—'}
                                </span>
                                {isLate && (
                                  <Badge tone="warning" size="sm">
                                    Late
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards (below md) */}
                <div className="md:hidden space-y-3">
                  {filteredIndividualEntries.map((entry) => {
                    const isSubmitted = entry.status === 'submitted'
                    const isLate =
                      isSubmitted &&
                      entry.submittedAt &&
                      new Date(entry.submittedAt).getTime() >
                        new Date(assignment.dueDate).getTime()

                    return (
                      <Card
                        key={entry.student.id}
                        className="p-4 bg-surface border border-line rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={entry.student.name} size="sm" />
                            <div className="min-w-0 truncate">
                              <p className="font-semibold text-sm text-fg truncate">
                                {entry.student.name}
                              </p>
                              <p className="text-xs text-muted truncate">
                                {entry.student.email}
                              </p>
                            </div>
                          </div>
                          <div>
                            {isSubmitted ? (
                              <Badge
                                tone="success"
                                size="sm"
                                icon={
                                  <CheckCircle2
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                }
                              >
                                Submitted
                              </Badge>
                            ) : isOverdue ? (
                              <Badge
                                tone="danger"
                                size="sm"
                                icon={
                                  <AlertCircle
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                }
                              >
                                Overdue
                              </Badge>
                            ) : (
                              <Badge
                                tone="warning"
                                size="sm"
                                icon={
                                  <Clock
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                }
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-line text-muted">
                          <span>Submitted on:</span>
                          <span className="font-medium text-fg">
                            {entry.submittedAt
                              ? formatSubmissionDate(entry.submittedAt)
                              : '—'}
                          </span>
                          {isLate && (
                            <Badge tone="warning" size="sm">
                              Late
                            </Badge>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
