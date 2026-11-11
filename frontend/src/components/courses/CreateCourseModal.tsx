import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Button,
  Input,
  Modal,
  Textarea,
  useToast,
} from '@/components/ui'
import { JoinCodeChip } from '@/components/courses/JoinCodeChip'
import { useAuth } from '@/context/AuthContext'
import { ApiError, mockApi } from '@/services/mockApi'
import { CURRENT_SEMESTER } from '@/utils/constants'
import {
  hasErrors,
  validateCourse,
  type CourseErrors,
} from '@/utils/validation'
import type { Course } from '@/types'
import { cn } from '@/utils/cn'

export interface CreateCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onCourseCreated: (course: Course) => void
}

export function CreateCourseModal({
  isOpen,
  onClose,
  onCourseCreated,
}: CreateCourseModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success } = useToast()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [semester, setSemester] = useState(CURRENT_SEMESTER)

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<CourseErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null)

  const codeInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLTextAreaElement>(null)
  const semesterInputRef = useRef<HTMLInputElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Reset form whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCode('')
      setName('')
      setDescription('')
      setSemester(CURRENT_SEMESTER)
      setErrors({})
      setTouched({})
      setGeneralError(null)
      setIsSubmitting(false)
      setCreatedCourse(null)
    }
  }, [isOpen])

  // Focus heading when entering success view
  useEffect(() => {
    if (createdCourse && successHeadingRef.current) {
      successHeadingRef.current.focus()
    }
  }, [createdCourse])

  const validateSingleField = (field: 'code' | 'name' | 'description' | 'semester', val: string) => {
    const fullInput = {
      code,
      name,
      description,
      semester,
      [field]: val,
    }
    const allErrors = validateCourse(fullInput)
    setErrors((prev) => ({
      ...prev,
      [field]: allErrors[field],
    }))
  }

  const handleBlur = (field: 'code' | 'name' | 'description' | 'semester') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const val = field === 'code' ? code : field === 'name' ? name : field === 'description' ? description : semester
    validateSingleField(field, val)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setGeneralError(null)
    const fieldErrors = validateCourse({
      code,
      name,
      description,
      semester,
    })

    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors)
      setTouched({
        code: true,
        name: true,
        description: true,
        semester: true,
      })

      // Focus first invalid field
      if (fieldErrors.code) {
        codeInputRef.current?.focus()
      } else if (fieldErrors.name) {
        nameInputRef.current?.focus()
      } else if (fieldErrors.description) {
        descInputRef.current?.focus()
      } else if (fieldErrors.semester) {
        semesterInputRef.current?.focus()
      }
      return
    }

    if (!user) {
      setGeneralError('You must be signed in as a professor to create a course.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await mockApi.createCourse(user.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        semester: semester.trim(),
      })

      onCourseCreated(created)
      success(`Course created: ${created.name}`)
      setCreatedCourse(created)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create course. Please try again.'
      setGeneralError(message)

      if (message.toLowerCase().includes('code')) {
        setErrors((prev) => ({ ...prev, code: message }))
        codeInputRef.current?.focus()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleOpenCourse = () => {
    if (createdCourse) {
      onClose()
      navigate(`/admin/courses/${createdCourse.id}`)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdCourse ? undefined : 'New course'}
      description={
        createdCourse
          ? undefined
          : 'Create a new course space to share materials, assignments, and group projects.'
      }
      disableBackdropClick={isSubmitting}
      initialFocusRef={codeInputRef}
      className="max-w-md"
    >
      {createdCourse ? (
        /* Success View */
        <div className="text-center py-4 space-y-5">
          <div className="mx-auto w-14 h-14 rounded-pill bg-success-soft text-success flex items-center justify-center border border-success/30 shadow-xs">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-xl font-display font-bold text-fg tracking-tight focus:outline-none"
            >
              Course created
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
              Share this join code with your students so they can enroll
            </p>
          </div>

          <div className="flex justify-center py-2">
            <JoinCodeChip
              code={createdCourse.joinCode}
              courseName={createdCourse.name}
              size="lg"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Done
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCourse}
              className="w-full sm:w-auto"
            >
              Open course
            </Button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {generalError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-danger-soft/40 border border-danger/40 text-danger text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Course Code */}
          <Input
            ref={codeInputRef}
            id="course-code"
            label="Course Code"
            hint="For example WEB101"
            placeholder="WEB101"
            value={code}
            onChange={(e) => {
              const val = e.target.value.toUpperCase()
              setCode(val)
              if (touched.code) validateSingleField('code', val)
            }}
            onBlur={() => handleBlur('code')}
            error={errors.code}
            disabled={isSubmitting}
            required
            autoCapitalize="characters"
          />

          {/* Course Name */}
          <Input
            ref={nameInputRef}
            id="course-name"
            label="Course Name"
            placeholder="e.g. Web Development"
            value={name}
            onChange={(e) => {
              const val = e.target.value
              setName(val)
              if (touched.name) validateSingleField('name', val)
            }}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            disabled={isSubmitting}
            required
          />

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label
                htmlFor="course-desc"
                className="block text-xs font-semibold uppercase tracking-wider text-muted select-none"
              >
                Description <span className="text-danger ml-0.5">*</span>
              </label>
              <span
                className={cn(
                  'text-xs tabular-nums select-none',
                  description.length > 300 ? 'text-danger font-semibold' : 'text-muted',
                )}
                aria-hidden="true"
              >
                {description.length}/300
              </span>
            </div>

            <Textarea
              ref={descInputRef}
              id="course-desc"
              rows={3}
              placeholder="Brief summary of course topics and learning goals..."
              value={description}
              onChange={(e) => {
                const val = e.target.value
                setDescription(val)
                if (touched.description) validateSingleField('description', val)
              }}
              onBlur={() => handleBlur('description')}
              error={errors.description}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Semester */}
          <Input
            ref={semesterInputRef}
            id="course-semester"
            label="Semester"
            placeholder="Autumn 2026"
            value={semester}
            onChange={(e) => {
              const val = e.target.value
              setSemester(val)
              if (touched.semester) validateSingleField('semester', val)
            }}
            onBlur={() => handleBlur('semester')}
            error={errors.semester}
            disabled={isSubmitting}
            required
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
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
              Create course
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
