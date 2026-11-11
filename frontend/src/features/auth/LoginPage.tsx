import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import {
  Avatar,
  Button,
  ConfirmDialog,
  Input,
  PasswordInput,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/mockApi'
import { DEMO_PASSWORD, SEED_USERS } from '@/data/seed'
import { resetDemoData } from '@/services/storage'
import { getHomePath, isPathAllowedForRole } from '@/utils/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import { hasErrors, validateLogin, type LoginErrors } from '@/utils/validation'
import { AuthLayout } from '@/features/auth/AuthLayout'
import type { User } from '@/types'

export function LoginPage() {
  usePageTitle('Sign in · ClassDesk')

  const { login, sessionNotice, clearSessionNotice } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Form input state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Validation & error states
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  // Accessible focus refs
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (sessionNotice) clearSessionNotice()
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
    if (serverError) setServerError(null)
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val)
    if (sessionNotice) clearSessionNotice()
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
    if (serverError) setServerError(null)
  }

  const handleEmailBlur = () => {
    const errors = validateLogin({ email, password })
    if (errors.email) {
      setFieldErrors((prev) => ({ ...prev, email: errors.email }))
    }
  }

  const handlePasswordBlur = () => {
    const errors = validateLogin({ email, password })
    if (errors.password) {
      setFieldErrors((prev) => ({ ...prev, password: errors.password }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const errors = validateLogin({ email, password })
    setFieldErrors(errors)
    setServerError(null)

    if (hasErrors(errors)) {
      if (errors.email) {
        emailInputRef.current?.focus()
      } else if (errors.password) {
        passwordInputRef.current?.focus()
      }
      return
    }

    try {
      setIsSubmitting(true)
      const authenticatedUser = await login(email, password)
      clearSessionNotice()

      // Redirect to originally requested page if permitted for role, else role home
      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
      const destination =
        fromPath && isPathAllowedForRole(fromPath, authenticatedUser.role)
          ? fromPath
          : getHomePath(authenticatedUser.role)

      navigate(destination, { replace: true })
    } catch (err) {
      if (!isMountedRef.current) return
      if (err instanceof ApiError) {
        if (err.fieldErrors && hasErrors(err.fieldErrors)) {
          setFieldErrors(err.fieldErrors)
          if (err.fieldErrors.email) {
            emailInputRef.current?.focus()
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

  // Pre-fill demo credentials
  const selectDemoAccount = (demoUser: User) => {
    if (sessionNotice) clearSessionNotice()
    setEmail(demoUser.email)
    setPassword(DEMO_PASSWORD)
    setFieldErrors({})
    setServerError(null)

    setTimeout(() => {
      submitButtonRef.current?.focus()
    }, 50)
  }

  const handleResetDemoData = () => {
    resetDemoData()
    setIsResetDialogOpen(false)
    success('Demo data has been reset')
  }

  const professors = SEED_USERS.filter((u) => u.role === 'admin')
  const students = SEED_USERS.filter((u) => u.role === 'student')

  return (
    <AuthLayout>
      <div className="space-y-1.5 text-left">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
          Welcome back
        </h1>
        <p className="font-body text-sm text-muted">
          Sign in to continue to your dashboard.
        </p>
      </div>

      {/* Dismissible Session Expiration / Invalid Notice */}
      {sessionNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 p-3 rounded-md bg-accent-soft/70 border border-accent/30 text-fg text-xs font-medium motion-safe:transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
            <span>
              {sessionNotice === 'expired'
                ? 'Your session expired. Please sign in again.'
                : 'Your session was not valid. Please sign in again.'}
            </span>
          </div>
          <button
            type="button"
            onClick={clearSessionNotice}
            aria-label="Dismiss message"
            className="text-muted hover:text-fg p-1 rounded cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={emailInputRef}
          type="email"
          autoComplete="username"
          inputMode="email"
          label="Email address"
          placeholder="e.g. meera.iyer@classdesk.edu"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={handleEmailBlur}
          required
        />

        <PasswordInput
          ref={passwordInputRef}
          autoComplete="current-password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          onBlur={handlePasswordBlur}
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
          ref={submitButtonRef}
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      {/* Link to Register */}
      <div className="text-center text-xs text-muted">
        <span>New here? </span>
        <Link
          to="/register"
          className="font-medium text-accent hover:underline focus:outline-none focus-visible:underline cursor-pointer"
        >
          Create an account
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DEMO ACCOUNTS BLOCK (visible across all screen sizes)          */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-6 border-t border-line text-left space-y-4">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-fg uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Demo accounts</span>
            </div>
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg motion-safe:transition-colors focus:outline-none focus-visible:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset demo data</span>
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Click an account to fill the form. Password for all:{' '}
            <code className="font-mono text-fg bg-surface-2 px-1 py-0.5 rounded-sm">
              demo1234
            </code>
          </p>
        </div>

        {/* Professors */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Professors
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {professors.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectDemoAccount(p)}
                className="flex items-center gap-2.5 p-2 rounded-md bg-surface-2 border border-line text-left hover:border-accent/40 hover:bg-surface motion-safe:transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Avatar name={p.name} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-fg truncate group-hover:text-accent transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-muted truncate">{p.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Students
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectDemoAccount(s)}
                className="flex items-center gap-2.5 p-2 rounded-md bg-surface-2 border border-line text-left hover:border-accent/40 hover:bg-surface motion-safe:transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Avatar name={s.name} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-fg truncate group-hover:text-accent transition-colors">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-muted truncate">{s.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Demo Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onConfirm={handleResetDemoData}
        onCancel={() => setIsResetDialogOpen(false)}
        title="Reset demo data?"
        message="This restores the original sample users, assignments and submissions. Anything you created will be removed."
        confirmLabel="Reset data"
        cancelLabel="Cancel"
        tone="default"
      />
    </AuthLayout>
  )
}
