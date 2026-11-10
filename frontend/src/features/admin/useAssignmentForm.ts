import { useState, useCallback, useMemo, useEffect } from 'react'
import type { AdminAssignment, AssignmentInput, SafeUser } from '@/types'
import {
  validateAssignmentForm,
  type AssignmentFormData,
} from '@/utils/validation'
import {
  getDefaultDueDateTimeLocal,
  isoToDateTimeLocal,
  dateTimeLocalToIso,
} from '@/utils/dates'

export interface UseAssignmentFormProps {
  initialAssignment?: AdminAssignment | null
  students: SafeUser[]
  onSubmit: (input: AssignmentInput) => Promise<void>
}

export function useAssignmentForm({
  initialAssignment,
  students,
  onSubmit,
}: UseAssignmentFormProps) {
  const isEditing = Boolean(initialAssignment)

  const getInitialValues = useCallback((): AssignmentFormData => {
    if (initialAssignment) {
      const isAll =
        initialAssignment.assignedTo.length >= students.length ||
        initialAssignment.assignedTo.length === 0
      return {
        title: initialAssignment.title,
        description: initialAssignment.description,
        dueDate: isoToDateTimeLocal(initialAssignment.dueDate),
        driveLink: initialAssignment.driveLink,
        assignMode: isAll ? 'all' : 'selected',
        selectedStudentIds: isAll
          ? students.map((s) => s.id)
          : [...initialAssignment.assignedTo],
      }
    }

    return {
      title: '',
      description: '',
      dueDate: getDefaultDueDateTimeLocal(),
      driveLink: '',
      assignMode: 'all',
      selectedStudentIds: students.map((s) => s.id),
    }
  }, [initialAssignment, students])

  const [values, setValues] = useState<AssignmentFormData>(getInitialValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Reset form when initialAssignment changes (or opens/closes)
  useEffect(() => {
    setValues(getInitialValues())
    setTouched({})
    setErrors({})
    setSubmitError(null)
  }, [getInitialValues])

  // Run validation
  const validationResult = useMemo(() => {
    return validateAssignmentForm(values, {
      isEditing,
      originalDueDate: initialAssignment?.dueDate,
    })
  }, [values, isEditing, initialAssignment?.dueDate])

  // Check if any student who already submitted is being removed
  const hasRemovedSubmittedStudents = useMemo(() => {
    if (!initialAssignment) return false
    const submittedStudentIds = initialAssignment.submissions
      .filter((sub) => sub.status === 'submitted')
      .map((sub) => sub.studentId)

    if (submittedStudentIds.length === 0) return false
    if (values.assignMode === 'all') return false

    return submittedStudentIds.some(
      (id) => !values.selectedStudentIds.includes(id),
    )
  }, [initialAssignment, values.assignMode, values.selectedStudentIds])

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = e.target
      setValues((prev) => ({ ...prev, [name]: value }))
      setSubmitError(null)
    },
    [],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target
      setTouched((prev) => ({ ...prev, [name]: true }))

      // Update errors for touched fields
      const res = validateAssignmentForm(values, {
        isEditing,
        originalDueDate: initialAssignment?.dueDate,
      })
      setErrors(res.errors)
    },
    [values, isEditing, initialAssignment?.dueDate],
  )

  const setFieldValue = useCallback(
    <K extends keyof AssignmentFormData>(field: K, value: AssignmentFormData[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }))
      setSubmitError(null)
    },
    [],
  )

  const toggleStudent = useCallback((studentId: string) => {
    setValues((prev) => {
      const exists = prev.selectedStudentIds.includes(studentId)
      const nextIds = exists
        ? prev.selectedStudentIds.filter((id) => id !== studentId)
        : [...prev.selectedStudentIds, studentId]

      return {
        ...prev,
        selectedStudentIds: nextIds,
      }
    })
    setSubmitError(null)
  }, [])

  const selectAllStudents = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      selectedStudentIds: students.map((s) => s.id),
    }))
    setSubmitError(null)
  }, [students])

  const clearStudents = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      selectedStudentIds: [],
    }))
    setSubmitError(null)
  }, [])

  const resetForm = useCallback(() => {
    setValues(getInitialValues())
    setTouched({})
    setErrors({})
    setSubmitError(null)
  }, [getInitialValues])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) {
        e.preventDefault()
      }

      // Mark all fields as touched
      setTouched({
        title: true,
        description: true,
        dueDate: true,
        driveLink: true,
        assignedTo: true,
      })

      const res = validateAssignmentForm(values, {
        isEditing,
        originalDueDate: initialAssignment?.dueDate,
      })
      setErrors(res.errors)

      if (!res.isValid) {
        return false
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const assignedToPayload: 'all' | string[] =
          values.assignMode === 'all' ||
          values.selectedStudentIds.length === students.length
            ? 'all'
            : values.selectedStudentIds

        const payload: AssignmentInput = {
          title: values.title.trim(),
          description: values.description.trim(),
          dueDate: dateTimeLocalToIso(values.dueDate),
          driveLink: values.driveLink.trim(),
          assignedTo: assignedToPayload,
        }

        await onSubmit(payload)
        return true
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while saving the assignment.'
        setSubmitError(msg)
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, isEditing, initialAssignment?.dueDate, students.length, onSubmit],
  )

  return {
    values,
    errors,
    touched,
    isValid: validationResult.isValid,
    isSubmitting,
    submitError,
    setSubmitError,
    hasRemovedSubmittedStudents,
    handleChange,
    handleBlur,
    setFieldValue,
    toggleStudent,
    selectAllStudents,
    clearStudents,
    handleSubmit,
    resetForm,
  }
}
