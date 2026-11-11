import { AlertCircle, AlertTriangle, Check } from 'lucide-react'
import {
  Avatar,
  Button,
  Checkbox,
  Input,
  Modal,
  Textarea,
} from '@/components/ui'
import type { ProfessorCourseAssignment, SafeUser } from '@/types'
import { useCourseAssignmentForm } from '@/features/admin/useCourseAssignmentForm'
import { cn } from '@/utils/cn'

export interface CourseAssignmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  professorId: string
  enrolledStudents: SafeUser[]
  initialItem?: ProfessorCourseAssignment | null
  onSuccess: (saved: ProfessorCourseAssignment) => void
}

export function CourseAssignmentFormModal({
  isOpen,
  onClose,
  courseId,
  professorId,
  enrolledStudents,
  initialItem,
  onSuccess,
}: CourseAssignmentFormModalProps) {
  const {
    isEditing,
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    oneDriveLink,
    setOneDriveLink,
    submissionType,
    setSubmissionType,
    assignMode,
    setAssignMode,
    selectedStudentIds,
    canChangeType,
    hasDeselectedSubmittedStudents,
    showOneDriveWarning,
    errors,
    touched,
    apiError,
    isSubmitting,
    titleInputRef,
    descInputRef,
    dueInputRef,
    linkInputRef,
    handleBlur,
    handleSelectAll,
    handleClearSelected,
    handleToggleStudent,
    handleSubmit,
  } = useCourseAssignmentForm({
    isOpen,
    onClose,
    courseId,
    professorId,
    enrolledStudents,
    initialItem,
    onSuccess,
  })

  const hasZeroStudents = enrolledStudents.length === 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title={isEditing ? 'Edit assignment' : 'New assignment'}
      description={
        isEditing
          ? 'Update details, deadline, or student assignments.'
          : 'Create a new course assignment with clear instructions and submission settings.'
      }
      disableBackdropClick={isSubmitting}
      initialFocusRef={titleInputRef}
      className="max-w-xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
        {/* Top ApiError alert banner */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-md bg-danger-soft/60 border border-danger/40 text-danger text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 leading-relaxed">{apiError}</div>
          </div>
        )}

        {/* 1. Title */}
        <div className="space-y-1">
          <Input
            ref={titleInputRef}
            name="title"
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleBlur('title')}
            maxLength={80}
            placeholder="e.g. Sprint 2: User Authentication"
            error={touched.title ? errors.title : undefined}
            disabled={isSubmitting}
          />
          <div className="flex justify-end text-[11px] text-muted">
            <span>{title.length}/80</span>
          </div>
        </div>

        {/* 2. Description */}
        <div className="space-y-1">
          <Textarea
            ref={descInputRef}
            name="description"
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            maxLength={500}
            rows={3}
            placeholder="Describe the requirements, deliverables, and submission guidelines..."
            error={touched.description ? errors.description : undefined}
            disabled={isSubmitting}
          />
          <div className="flex justify-end text-[11px] text-muted">
            <span>{description.length}/500</span>
          </div>
        </div>

        {/* 3. Deadline */}
        <div className="space-y-1">
          <Input
            ref={dueInputRef}
            name="dueDate"
            type="datetime-local"
            label="Deadline"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onBlur={() => handleBlur('dueDate')}
            hint="Date and time when submissions close"
            error={touched.dueDate ? errors.dueDate : undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* 4. OneDrive Link */}
        <div className="space-y-1">
          <Input
            ref={linkInputRef}
            name="oneDriveLink"
            type="url"
            label="OneDrive link"
            required
            value={oneDriveLink}
            onChange={(e) => setOneDriveLink(e.target.value)}
            onBlur={() => handleBlur('oneDriveLink')}
            placeholder="https://..."
            hint="Share link to the assignment folder or brief on OneDrive or SharePoint"
            error={touched.oneDriveLink ? errors.oneDriveLink : undefined}
            disabled={isSubmitting}
          />
          {showOneDriveWarning && (
            <div className="flex items-start gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                This doesn't look like a OneDrive link. Students can still open it, but
                make sure it is accessible to your class.
              </span>
            </div>
          )}
        </div>

        {/* 5. Submission Type Fieldset */}
        <fieldset className="space-y-3 pt-2 border-t border-line text-left">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-muted select-none mb-1">
            Submission type
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label
              className={cn(
                'relative flex items-start gap-3 p-3 rounded-md border select-none motion-safe:transition-all',
                !canChangeType
                  ? 'opacity-60 cursor-not-allowed border-line bg-surface-2/20'
                  : 'cursor-pointer',
                submissionType === 'individual'
                  ? 'border-accent bg-accent-soft/40 text-fg'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="submissionType"
                value="individual"
                checked={submissionType === 'individual'}
                onChange={() => setSubmissionType('individual')}
                disabled={!canChangeType || isSubmitting}
                className="mt-1 text-accent focus:ring-accent"
              />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">Individual</span>
                <span className="block text-xs text-muted mt-0.5">
                  Each student submits their own work.
                </span>
              </div>
            </label>

            <label
              className={cn(
                'relative flex items-start gap-3 p-3 rounded-md border select-none motion-safe:transition-all',
                !canChangeType
                  ? 'opacity-60 cursor-not-allowed border-line bg-surface-2/20'
                  : 'cursor-pointer',
                submissionType === 'group'
                  ? 'border-accent bg-accent-soft/40 text-fg'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="submissionType"
                value="group"
                checked={submissionType === 'group'}
                onChange={() => setSubmissionType('group')}
                disabled={!canChangeType || isSubmitting}
                className="mt-1 text-accent focus:ring-accent"
              />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">Group</span>
                <span className="block text-xs text-muted mt-0.5">
                  One submission per group. Any member can open the brief, the group leader
                  acknowledges submission for the team.
                </span>
              </div>
            </label>
          </div>

          {!canChangeType && (
            <p className="text-xs text-muted">
              Submission type cannot be changed after submissions or acknowledgements have
              started.
            </p>
          )}
        </fieldset>

        {/* 6 / 7. Audience / Assign to */}
        {submissionType === 'group' ? (
          <div className="p-3 rounded-md bg-surface-2/40 border border-line text-xs text-muted space-y-0.5">
            <p className="font-semibold text-fg">Assign to all groups</p>
            <p>
              Group assignments go to every group in this course. Only the group leader can
              acknowledge.
            </p>
          </div>
        ) : (
          <fieldset className="space-y-3 pt-2 border-t border-line text-left">
            <legend className="block text-xs font-semibold uppercase tracking-wider text-muted select-none mb-1">
              Assign to
            </legend>

            {hasZeroStudents && (
              <p className="text-xs text-muted mb-2">
                No students have joined this course yet. 'All enrolled students' will
                include them as they join.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={cn(
                  'relative flex items-center justify-between p-3 rounded-md border cursor-pointer select-none motion-safe:transition-all',
                  assignMode === 'all'
                    ? 'border-accent bg-accent-soft text-fg font-medium'
                    : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
                )}
              >
                <input
                  type="radio"
                  name="assignMode"
                  value="all"
                  checked={assignMode === 'all'}
                  onChange={() => setAssignMode('all')}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <div>
                  <span className="block text-sm font-medium text-fg">
                    All enrolled students ({enrolledStudents.length})
                  </span>
                  <span className="block text-[11px] text-muted mt-0.5">
                    Students who join later are included automatically
                  </span>
                </div>
                {assignMode === 'all' && (
                  <Check className="w-4 h-4 text-accent shrink-0 ml-2" aria-hidden="true" />
                )}
              </label>

              <label
                className={cn(
                  'relative flex items-center justify-between p-3 rounded-md border select-none motion-safe:transition-all',
                  hasZeroStudents
                    ? 'opacity-50 cursor-not-allowed border-line bg-surface-2/20'
                    : 'cursor-pointer',
                  assignMode === 'selected'
                    ? 'border-accent bg-accent-soft text-fg font-medium'
                    : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
                )}
              >
                <input
                  type="radio"
                  name="assignMode"
                  value="selected"
                  checked={assignMode === 'selected'}
                  onChange={() => {
                    if (!hasZeroStudents) setAssignMode('selected')
                  }}
                  disabled={hasZeroStudents || isSubmitting}
                  className="sr-only"
                />
                <div>
                  <span className="block text-sm font-medium text-fg">Selected students</span>
                  <span className="block text-[11px] text-muted mt-0.5">
                    {selectedStudentIds.length} selected
                  </span>
                </div>
                {assignMode === 'selected' && (
                  <Check className="w-4 h-4 text-accent shrink-0 ml-2" aria-hidden="true" />
                )}
              </label>
            </div>

            {/* Student Picker (when assignMode === 'selected') */}
            {assignMode === 'selected' && (
              <div className="space-y-2 mt-2 p-3 rounded-md bg-surface-2/40 border border-line">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-line text-xs">
                  <span className="font-semibold text-fg">
                    {selectedStudentIds.length} of {enrolledStudents.length} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={isSubmitting}
                      className="text-accent hover:underline font-medium cursor-pointer"
                    >
                      Select all
                    </button>
                    <span className="text-muted" aria-hidden="true">
                      •
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      disabled={isSubmitting}
                      className="text-muted hover:text-fg hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Student checkboxes */}
                <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-line/40 pr-1">
                  {enrolledStudents.map((student) => {
                    const isChecked = selectedStudentIds.includes(student.id)
                    return (
                      <div
                        key={student.id}
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.tagName === 'INPUT' || target.closest('label')) {
                            return
                          }
                          if (!isSubmitting) handleToggleStudent(student.id)
                        }}
                        className={cn(
                          'flex items-center justify-between gap-3 p-2 cursor-pointer motion-safe:transition-colors rounded-sm',
                          isChecked ? 'bg-surface-2/70' : 'hover:bg-surface-2/30',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={isChecked}
                            onChange={() => handleToggleStudent(student.id)}
                            disabled={isSubmitting}
                            label=""
                            id={`student-check-${student.id}`}
                            aria-label={`Select ${student.name}`}
                          />
                          <Avatar name={student.name} size="sm" />
                          <div className="truncate text-left">
                            <p className="text-xs font-semibold text-fg truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-muted truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {touched.assignedTo && errors.assignedTo && (
                  <p className="text-xs text-danger font-medium pt-1">{errors.assignedTo}</p>
                )}
              </div>
            )}

            {/* Warning note if removing submitted students during edit */}
            {hasDeselectedSubmittedStudents && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-warning-soft/60 border border-warning/30 text-warning text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Removing a student also removes their submission record for this
                  assignment.
                </span>
              </div>
            )}
          </fieldset>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Save changes' : 'Create assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
