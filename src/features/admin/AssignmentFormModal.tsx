import { useRef, useEffect } from 'react'
import { AlertCircle, AlertTriangle, Check } from 'lucide-react'
import {
  Avatar,
  Button,
  Checkbox,
  Input,
  Modal,
  Textarea,
  useToast,
} from '@/components/ui'
import { mockApi } from '@/services/mockApi'
import type { AdminAssignment, AssignmentInput, SafeUser } from '@/types'
import { useAssignmentForm } from '@/features/admin/useAssignmentForm'
import { cn } from '@/utils/cn'

export interface AssignmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialAssignment?: AdminAssignment | null
  students: SafeUser[]
  adminId: string
  onSuccess: (savedAssignment: AdminAssignment) => void
}

export function AssignmentFormModal({
  isOpen,
  onClose,
  initialAssignment,
  students,
  adminId,
  onSuccess,
}: AssignmentFormModalProps) {
  const isEditing = Boolean(initialAssignment)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { success } = useToast()

  const handleFormSubmit = async (payload: AssignmentInput) => {
    let saved: AdminAssignment
    if (isEditing && initialAssignment) {
      saved = await mockApi.updateAssignment(adminId, initialAssignment.id, payload)
      success('Assignment updated')
    } else {
      saved = await mockApi.createAssignment(adminId, payload)
      success('Assignment created')
    }
    onSuccess(saved)
    onClose()
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    hasRemovedSubmittedStudents,
    handleChange,
    handleBlur,
    setFieldValue,
    toggleStudent,
    selectAllStudents,
    clearStudents,
    handleSubmit,
    resetForm,
  } = useAssignmentForm({
    initialAssignment,
    students,
    onSubmit: handleFormSubmit,
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title={isEditing ? 'Edit assignment' : 'New assignment'}
      description={
        isEditing
          ? 'Update details, due date, or student assignments.'
          : 'Create a new assignment for your students with clear instructions.'
      }
      initialFocusRef={titleInputRef}
      className="max-w-xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
        {/* Top ApiError alert banner */}
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-none bg-danger-soft/60 border border-danger/40 text-danger text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 leading-relaxed">{submitError}</div>
          </div>
        )}

        {/* 1. Title */}
        <div className="space-y-1">
          <Input
            ref={titleInputRef}
            name="title"
            label="Title"
            required
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={80}
            placeholder="e.g. Interactive Data Visualization Dashboard"
            error={touched.title ? errors.title : undefined}
            disabled={isSubmitting}
          />
          <div className="flex justify-end text-[11px] text-muted">
            <span>{values.title.length}/80</span>
          </div>
        </div>

        {/* 2. Description */}
        <div className="space-y-1">
          <Textarea
            name="description"
            label="Description"
            required
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={500}
            rows={3}
            placeholder="Describe the objectives, deliverables, and submission guidelines..."
            error={touched.description ? errors.description : undefined}
            disabled={isSubmitting}
          />
          <div className="flex justify-end text-[11px] text-muted">
            <span>{values.description.length}/500</span>
          </div>
        </div>

        {/* 3. Due Date */}
        <div className="space-y-1">
          <Input
            name="dueDate"
            type="datetime-local"
            label="Due Date & Time"
            required
            value={values.dueDate}
            onChange={handleChange}
            onBlur={handleBlur}
            hint="Students must submit before this time."
            error={touched.dueDate ? errors.dueDate : undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* 4. Drive Link */}
        <div className="space-y-1">
          <Input
            name="driveLink"
            type="url"
            label="Drive Submission Folder Link"
            required
            value={values.driveLink}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://drive.google.com/drive/folders/..."
            hint="Google Drive folder where students should upload their work."
            error={touched.driveLink ? errors.driveLink : undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* 5. Assign to Fieldset */}
        <fieldset className="space-y-3 pt-2 border-t border-line text-left">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-muted select-none mb-1">
            Assign to
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label
              className={cn(
                'relative flex items-center justify-between p-3 border cursor-pointer select-none motion-safe:transition-all',
                values.assignMode === 'all'
                  ? 'border-accent bg-accent-soft text-fg font-medium'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="assignMode"
                value="all"
                checked={values.assignMode === 'all'}
                onChange={() => setFieldValue('assignMode', 'all')}
                disabled={isSubmitting}
                className="sr-only"
              />
              <span className="text-sm font-medium text-fg">
                All students ({students.length})
              </span>
              {values.assignMode === 'all' && (
                <Check className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              )}
            </label>

            <label
              className={cn(
                'relative flex items-center justify-between p-3 border cursor-pointer select-none motion-safe:transition-all',
                values.assignMode === 'selected'
                  ? 'border-accent bg-accent-soft text-fg font-medium'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="assignMode"
                value="selected"
                checked={values.assignMode === 'selected'}
                onChange={() => setFieldValue('assignMode', 'selected')}
                disabled={isSubmitting}
                className="sr-only"
              />
              <span className="text-sm font-medium text-fg">Selected students</span>
              {values.assignMode === 'selected' && (
                <Check className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              )}
            </label>
          </div>

          {/* Student Picker (when assignMode === 'selected') */}
          {values.assignMode === 'selected' && (
            <div className="space-y-2 mt-2 p-3 bg-surface-2/40 border border-line">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-line text-xs">
                <span className="font-semibold text-fg">
                  {values.selectedStudentIds.length} of {students.length} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllStudents}
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
                    onClick={clearStudents}
                    disabled={isSubmitting}
                    className="text-muted hover:text-fg hover:underline font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Student checkboxes */}
              <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-line/40 pr-1">
                {students.map((student) => {
                  const isChecked = values.selectedStudentIds.includes(student.id)
                  return (
                    <div
                      key={student.id}
                      onClick={() => !isSubmitting && toggleStudent(student.id)}
                      className={cn(
                        'flex items-center justify-between gap-3 p-2 cursor-pointer motion-safe:transition-colors',
                        isChecked ? 'bg-surface-2/70' : 'hover:bg-surface-2/30',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleStudent(student.id)}
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
                <p className="text-xs text-danger font-medium pt-1">
                  {errors.assignedTo}
                </p>
              )}
            </div>
          )}

          {/* Warning note if removing submitted students during edit */}
          {hasRemovedSubmittedStudents && (
            <div className="flex items-start gap-2 p-2.5 rounded-none bg-warning-soft/60 border border-warning/30 text-warning text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Removing a student also removes their submission record for this
                assignment.
              </span>
            </div>
          )}
        </fieldset>

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
