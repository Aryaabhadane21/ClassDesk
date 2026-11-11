import { useState, useEffect, useRef, type FormEvent } from 'react'
import { isLikelyOneDriveLink } from '@/utils/links'
import {
  hasErrors,
  validateCourseAssignment,
  type CourseAssignmentErrors,
} from '@/utils/validation'
import { ApiError, mockApi } from '@/services/mockApi'
import { useToast } from '@/components/ui'
import type {
  CourseAssignmentInput,
  ProfessorCourseAssignment,
  SafeUser,
  SubmissionType,
} from '@/types'

export function toDatetimeLocal(isoDate: string): string {
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getDefaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 0, 0)
  return toDatetimeLocal(d.toISOString())
}

export interface UseCourseAssignmentFormOptions {
  isOpen: boolean
  onClose: () => void
  courseId: string
  professorId: string
  enrolledStudents: SafeUser[]
  initialItem?: ProfessorCourseAssignment | null
  onSuccess: (saved: ProfessorCourseAssignment) => void
}

export function useCourseAssignmentForm({
  isOpen,
  onClose,
  courseId,
  professorId,
  enrolledStudents,
  initialItem,
  onSuccess,
}: UseCourseAssignmentFormOptions) {
  const { success } = useToast()
  const isEditing = Boolean(initialItem)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [oneDriveLink, setOneDriveLink] = useState('')
  const [submissionType, setSubmissionType] = useState<SubmissionType>('individual')
  const [assignMode, setAssignMode] = useState<'all' | 'selected'>('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const [errors, setErrors] = useState<CourseAssignmentErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ref tracking for focus on first invalid field
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLTextAreaElement>(null)
  const dueInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  const enrolledStudentIds = enrolledStudents.map((s) => s.id)

  // Can submissionType be modified?
  const canChangeType = !isEditing || initialItem?.tracking.submitted === 0

  // Students who have already submitted (for warning note when deselecting)
  const previouslySubmittedIds =
    isEditing && initialItem?.tracking.kind === 'individual'
      ? initialItem.tracking.entries
          .filter((e) => e.status === 'submitted')
          .map((e) => e.student.id)
      : []

  const hasDeselectedSubmittedStudents =
    isEditing &&
    submissionType === 'individual' &&
    assignMode === 'selected' &&
    previouslySubmittedIds.some((id) => !selectedStudentIds.includes(id))

  const isUrlValid = (url: string) => {
    try {
      const p = new URL(url.trim())
      return p.protocol === 'http:' || p.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Non-blocking OneDrive warning: valid URL but isLikelyOneDriveLink is false
  const showOneDriveWarning =
    Boolean(oneDriveLink.trim()) &&
    isUrlValid(oneDriveLink) &&
    !isLikelyOneDriveLink(oneDriveLink)

  // Reset form when modal opens or initialItem changes
  useEffect(() => {
    if (!isOpen) return

    setErrors({})
    setTouched({})
    setApiError(null)
    setIsSubmitting(false)

    if (initialItem) {
      setTitle(initialItem.assignment.title)
      setDescription(initialItem.assignment.description)
      setDueDate(toDatetimeLocal(initialItem.assignment.dueDate))
      setOneDriveLink(initialItem.assignment.oneDriveLink)
      setSubmissionType(initialItem.assignment.submissionType)
      if (initialItem.assignment.submissionType === 'group') {
        setAssignMode('all')
        setSelectedStudentIds([])
      } else {
        setAssignMode(initialItem.assignment.audience)
        setSelectedStudentIds(
          initialItem.assignment.audience === 'selected'
            ? [...initialItem.assignment.assignedTo]
            : [],
        )
      }
    } else {
      setTitle('')
      setDescription('')
      setDueDate(getDefaultDueDate())
      setOneDriveLink('')
      setSubmissionType('individual')
      setAssignMode('all')
      setSelectedStudentIds([])
    }
  }, [isOpen, initialItem])

  const validateField = (field: string) => {
    const payload: Partial<CourseAssignmentInput> = {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
      oneDriveLink,
      submissionType,
      assignedTo:
        submissionType === 'group'
          ? 'all'
          : assignMode === 'all'
            ? 'all'
            : selectedStudentIds,
    }

    const fieldErrors = validateCourseAssignment(payload, { enrolledStudentIds })

    // "Deadline must be in the future" applies only to NEW assignments
    if (!isEditing && dueDate) {
      const time = new Date(dueDate).getTime()
      if (!isNaN(time) && time <= Date.now()) {
        fieldErrors.dueDate = 'Due date must be in the future'
      }
    }

    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field as keyof CourseAssignmentErrors],
    }))
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field)
  }

  const handleSelectAll = () => {
    setSelectedStudentIds([...enrolledStudentIds])
    setTouched((prev) => ({ ...prev, assignedTo: true }))
    setErrors((prev) => ({ ...prev, assignedTo: undefined }))
  }

  const handleClearSelected = () => {
    setSelectedStudentIds([])
    setTouched((prev) => ({ ...prev, assignedTo: true }))
    setErrors((prev) => ({ ...prev, assignedTo: 'Select at least one student' }))
  }

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]

      if (next.length === 0) {
        setErrors((errs) => ({ ...errs, assignedTo: 'Select at least one student' }))
      } else {
        setErrors((errs) => ({ ...errs, assignedTo: undefined }))
      }

      return next
    })
    setTouched((prev) => ({ ...prev, assignedTo: true }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setApiError(null)

    const payload: CourseAssignmentInput = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
      oneDriveLink: oneDriveLink.trim(),
      submissionType,
      assignedTo:
        submissionType === 'group'
          ? 'all'
          : assignMode === 'all'
            ? 'all'
            : selectedStudentIds,
    }

    const validationErrors = validateCourseAssignment(payload, { enrolledStudentIds })

    // "Deadline must be in the future" applies only to NEW assignments
    if (!isEditing && dueDate) {
      const time = new Date(dueDate).getTime()
      if (!isNaN(time) && time <= Date.now()) {
        validationErrors.dueDate = 'Due date must be in the future'
      }
    }

    setErrors(validationErrors)
    setTouched({
      title: true,
      description: true,
      dueDate: true,
      oneDriveLink: true,
      submissionType: true,
      assignedTo: true,
    })

    if (hasErrors(validationErrors)) {
      if (validationErrors.title) titleInputRef.current?.focus()
      else if (validationErrors.description) descInputRef.current?.focus()
      else if (validationErrors.dueDate) dueInputRef.current?.focus()
      else if (validationErrors.oneDriveLink) linkInputRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      let saved: ProfessorCourseAssignment
      if (isEditing && initialItem) {
        saved = await mockApi.updateCourseAssignment(
          professorId,
          initialItem.assignment.id,
          payload,
        )
        success('Changes saved')
      } else {
        saved = await mockApi.createCourseAssignment(professorId, courseId, payload)
        success('Assignment created')
      }

      onSuccess(saved)
      onClose()

      // Focus the new or edited card
      setTimeout(() => {
        const cardEl = document.getElementById(`prof-asg-card-${saved.assignment.id}`)
        cardEl?.focus()
      }, 50)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('An unexpected error occurred while saving the assignment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}
