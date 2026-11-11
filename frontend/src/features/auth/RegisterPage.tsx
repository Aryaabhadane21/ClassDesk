import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  Circle,
  GraduationCap,
  Presentation,
} from 'lucide-react'
import {
  Button,
  Input,
  PasswordInput,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/mockApi'
import { getHomePath } from '@/utils/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import { roleLabel } from '@/utils/roles'
import { cn } from '@/utils/cn'
import {
  hasErrors,
  validateRegister,
  type RegisterErrors,
} from '@/utils/validation'
import { AuthLayout } from '@/features/auth/AuthLayout'
import type { Role } from '@/types'

export function RegisterPage() {
  usePageTitle('Create account · ClassDesk')

  const { register } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  // Form input state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | undefined>(undefined)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation & error states
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Accessible focus refs
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const roleStudentRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Live password requirements
  const isLengthMet = password.length >= 8
  const isLetterMet = /[a-zA-Z]/.test(password)
  const isNumberMet = /[0-9]/.test(password)

  const handleNameChange = (val: string) => {
    setName(val)
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }))
    if (serverError) setServerError(null)
  }

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
    if (serverError) setServerError(null)
  }

  const handleRoleChange = (val: Role) => {
    setRole(val)
    if (fieldErrors.role) setFieldErrors((prev) => ({ ...prev, role: undefined }))
    if (serverError) setServerError(null)
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val)
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
    if (fieldErrors.confirmPassword && val === confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
    if (serverError) setServerError(null)
  }

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val)
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
    if (serverError) setServerError(null)
  }

  const handleBlur = (field: keyof RegisterErrors) => {
    const errors = validateRegister({
      name,
      email,
      password,
      confirmPassword,
      role,
    })
    if (errors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const errors = validateRegister({
      name,
      email,
      password,
      confirmPassword,
      role,
    })
    setFieldErrors(errors)
    setServerError(null)

    if (hasErrors(errors)) {
      // Focus first invalid field
      if (errors.name) {
        nameInputRef.current?.focus()
      } else if (errors.email) {
        emailInputRef.current?.focus()
      } else if (errors.role) {
        roleStudentRef.current?.focus()
      } else if (errors.password) {
        passwordInputRef.current?.focus()
      } else if (errors.confirmPassword) {
        confirmPasswordInputRef.current?.focus()
      }
      return
    }

    try {
      setIsSubmitting(true)
      const registeredUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: role as Role,
      })

      const firstName = registeredUser.name.trim().split(' ')[0] || registeredUser.name
      success(`Welcome to ClassDesk, ${firstName}`)
      navigate(getHomePath(registeredUser.role), { replace: true })
    } catch (err) {
      if (!isMountedRef.current) return
      if (err instanceof ApiError) {
        if (err.fieldErrors && hasErrors(err.fieldErrors)) {
          setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }))
          if (err.fieldErrors.email) {
            emailInputRef.current?.focus()
          } else if (err.fieldErrors.name) {
            nameInputRef.current?.focus()
          } else if (err.fieldErrors.password) {
            passwordInputRef.current?.focus()
          }
        } else {
          setServerError(err.message)
        }
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5 text-left">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
          Create your account
        </h1>
        <p className="font-body text-sm text-muted">
          Join ClassDesk as a student or a professor.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          ref={nameInputRef}
          type="text"
          autoComplete="name"
          label="Full name"
          placeholder="e.g. Aarav Sharma"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => handleBlur('name')}
          required
        />

        {/* Email */}
        <Input
          ref={emailInputRef}
          type="email"
          autoComplete="email"
          inputMode="email"
          label="Email address"
          placeholder="e.g. aarav.sharma@classdesk.edu"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={() => handleBlur('email')}
          required
        />

        {/* Role Fieldset */}
        <fieldset className="space-y-2 pt-1 text-left">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-muted select-none mb-1">
            I am a
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Student Tile */}
            <label
              className={cn(
                'relative flex flex-col justify-between p-3.5 rounded-md border cursor-pointer select-none motion-safe:transition-all text-left gap-1.5',
                role === 'student'
                  ? 'border-accent bg-accent-soft/80 text-fg'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                ref={roleStudentRef}
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => handleRoleChange('student')}
                onBlur={() => handleBlur('role')}
                disabled={isSubmitting}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-fg">
                    {roleLabel('student')}
                  </span>
                </div>
                {role === 'student' && (
                  <Check className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Join courses, work in groups and acknowledge submissions
              </p>
            </label>

            {/* Professor Tile */}
            <label
              className={cn(
                'relative flex flex-col justify-between p-3.5 rounded-md border cursor-pointer select-none motion-safe:transition-all text-left gap-1.5',
                role === 'admin'
                  ? 'border-accent bg-accent-soft/80 text-fg'
                  : 'border-line bg-surface-2/40 text-muted hover:border-line hover:bg-surface-2',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={() => handleRoleChange('admin')}
                onBlur={() => handleBlur('role')}
                disabled={isSubmitting}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-fg">
                    {roleLabel('admin')}
                  </span>
                </div>
                {role === 'admin' && (
                  <Check className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Create courses and track every submission
              </p>
            </label>
          </div>

          {fieldErrors.role && (
            <p role="alert" className="text-xs text-danger font-medium mt-1">
              {fieldErrors.role}
            </p>
          )}
        </fieldset>

        {/* Password */}
        <div className="space-y-2 text-left">
          <PasswordInput
            ref={passwordInputRef}
            autoComplete="new-password"
            label="Password"
            placeholder="Create a password"
            value={password}
            error={fieldErrors.password}
            aria-describedby="password-rules"
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => handleBlur('password')}
            required
          />

          {/* Live Requirement Checklist */}
          <div
            id="password-rules"
            className="p-3 rounded-md bg-surface-2/50 border border-line text-xs space-y-1.5"
          >
            <span className="text-[11px] font-semibold text-muted block uppercase tracking-wider">
              Password requirements:
            </span>
            <ul className="space-y-1 text-xs">
              <li
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isLengthMet ? 'text-fg font-medium' : 'text-muted',
                )}
              >
                {isLengthMet ? (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                )}
                <span>At least 8 characters</span>
                <span className="sr-only">({isLengthMet ? 'met' : 'not met'})</span>
              </li>

              <li
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isLetterMet ? 'text-fg font-medium' : 'text-muted',
                )}
              >
                {isLetterMet ? (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                )}
                <span>Contains a letter</span>
                <span className="sr-only">({isLetterMet ? 'met' : 'not met'})</span>
              </li>

              <li
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isNumberMet ? 'text-fg font-medium' : 'text-muted',
                )}
              >
                {isNumberMet ? (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                )}
                <span>Contains a number</span>
                <span className="sr-only">({isNumberMet ? 'met' : 'not met'})</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password */}
        <PasswordInput
          ref={confirmPasswordInputRef}
          autoComplete="new-password"
          label="Confirm password"
          placeholder="Repeat your password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          required
        />

        {/* Server Error Alert Box */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-md bg-danger-soft/60 border border-danger/30 text-danger text-xs font-medium motion-safe:transition-all text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full mt-3"
        >
          Create account
        </Button>
      </form>

      {/* Link to Login */}
      <div className="text-center text-xs text-muted">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-medium text-accent hover:underline focus:outline-none focus-visible:underline cursor-pointer"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
