import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button, Input, Modal, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ApiError, mockApi } from '@/services/mockApi'
import { normalizeJoinCode, validateJoinCode } from '@/utils/validation'
import type { StudentCourse } from '@/types'

export interface JoinCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onCourseJoined: (course: StudentCourse) => void
}

export function JoinCourseModal({
  isOpen,
  onClose,
  onCourseJoined,
}: JoinCourseModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success } = useToast()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joinedCourse, setJoinedCourse] = useState<StudentCourse | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setCode('')
      setError(undefined)
      setTouched(false)
      setIsSubmitting(false)
      setJoinedCourse(null)
    }
  }, [isOpen])

  // Focus heading when entering success view
  useEffect(() => {
    if (joinedCourse && successHeadingRef.current) {
      successHeadingRef.current.focus()
    }
  }, [joinedCourse])

  const handleBlur = () => {
    setTouched(true)
    const err = validateJoinCode(code)
    setError(err)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const normalized = normalizeJoinCode(code)
    const err = validateJoinCode(normalized)
    if (err) {
      setError(err)
      setTouched(true)
      inputRef.current?.focus()
      return
    }

    if (!user) {
      setError('You must be signed in as a student to join a course')
      return
    }

    setIsSubmitting(true)
    setError(undefined)

    try {
      const course = await mockApi.joinCourseByCode(user.id, normalized)
      onCourseJoined(course)
      success(`Joined ${course.name}`)
      setJoinedCourse(course)
    } catch (apiErr) {
      const message =
        apiErr instanceof ApiError
          ? apiErr.message
          : 'Failed to join course. Please verify the code and try again.'
      setError(message)
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleOpenCourse = () => {
    if (joinedCourse) {
      onClose()
      navigate(`/student/courses/${joinedCourse.id}`)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={joinedCourse ? undefined : 'Join a course'}
      description={
        joinedCourse
          ? undefined
          : 'Enter the join code shared by your professor to enroll in the course.'
      }
      disableBackdropClick={isSubmitting}
      initialFocusRef={inputRef}
      className="max-w-md"
    >
      {joinedCourse ? (
        /* Success View */
        <div className="text-center py-4 space-y-5">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto" aria-hidden="true" />

          <div className="space-y-1.5">
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-xl font-display font-bold text-fg tracking-tight focus:outline-none"
            >
              You joined {joinedCourse.name}
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
              You can now see its assignments and create or join a group.
            </p>
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
          <Input
            ref={inputRef}
            id="join-code-input"
            label="Join code"
            hint="Ask your professor for the code, for example WEB-4K7P"
            placeholder="WEB-4K7P"
            value={code}
            onChange={(e) => {
              const val = e.target.value.toUpperCase()
              setCode(val)
              if (touched) {
                setError(validateJoinCode(val))
              }
            }}
            onBlur={handleBlur}
            error={error}
            disabled={isSubmitting}
            required
            autoCapitalize="characters"
            className="font-mono tracking-wider"
          />

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
              Join course
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
