import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronDown, RotateCcw, Sparkles } from 'lucide-react'
import {
  Avatar,
  Button,
  ConfirmDialog,
  GradientBlob,
  Input,
  Logo,
  PasswordInput,
  ThemeToggle,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/mockApi'
import { DEMO_PASSWORD, SEED_USERS } from '@/data/seed'
import { resetDemoData } from '@/services/storage'
import { getHomePath } from '@/utils/routes'
import type { User } from '@/types'

export function LoginPage() {
  const { login } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  // Form input state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [heroImgFailed, setHeroImgFailed] = useState(false)

  // Refs for accessible focus management
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

  // Validation logic
  const validateEmail = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Email address is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid institutional email'
    }
    return null
  }

  const validatePassword = (value: string): string | null => {
    if (!value) {
      return 'Password is required'
    }
    return null
  }

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email))
  }

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password))
  }

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (emailError) setEmailError(null)
    if (serverError) setServerError(null)
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val)
    if (passwordError) setPasswordError(null)
    if (serverError) setServerError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const eErr = validateEmail(email)
    const pErr = validatePassword(password)

    setEmailError(eErr)
    setPasswordError(pErr)
    setServerError(null)

    if (eErr) {
      emailInputRef.current?.focus()
      return
    }
    if (pErr) {
      passwordInputRef.current?.focus()
      return
    }

    try {
      setIsSubmitting(true)
      const authenticatedUser = await login(email, password)
      navigate(getHomePath(authenticatedUser.role), { replace: true })
    } catch (err) {
      if (!isMountedRef.current) return
      if (err instanceof ApiError) {
        setServerError(err.message)
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
    setEmail(demoUser.email)
    setPassword(DEMO_PASSWORD)
    setEmailError(null)
    setPasswordError(null)
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
    <div className="min-h-screen bg-app text-fg flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* MOBILE / TABLET BANNER (Below lg only, 200px full-width)       */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:hidden w-full h-[200px] overflow-hidden border-b border-line relative shrink-0 bg-surface-2">
        {!heroImgFailed ? (
          <img
            src="/images/login-hero.jpg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            onError={() => setHeroImgFailed(true)}
            className="w-full h-full object-cover object-[center_35%] scale-115 origin-top-left"
          />
        ) : (
          <GradientBlob seed="mobile-login-hero" variant="hero" className="h-full w-full" />
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LEFT COLUMN: Form Side                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 lg:overflow-y-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between w-full max-w-xl mx-auto">
          <Logo size="md" />
          <ThemeToggle />
        </header>

        {/* Centered Form Area */}
        <main className="w-full max-w-[420px] mx-auto my-8 space-y-6">
          <div className="space-y-1.5 text-left">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
              Welcome back
            </h1>
            <p className="font-body text-sm text-muted">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <Input
              ref={emailInputRef}
              type="email"
              autoComplete="username"
              inputMode="email"
              label="Email address"
              placeholder="e.g. meera.iyer@classdesk.edu"
              value={email}
              error={emailError || undefined}
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
              error={passwordError || undefined}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={handlePasswordBlur}
              required
            />

            {/* Server Error Alert Box */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-md bg-danger-soft/60 border border-danger/30 text-danger text-xs font-medium motion-safe:transition-all"
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

          {/* --------------------------------------------------------- */}
          {/* DEMO ACCOUNTS BLOCK                                       */}
          {/* --------------------------------------------------------- */}
          <div className="pt-6 border-t border-line text-left">
            <div className="hidden sm:block space-y-4">
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
                  Click an account to fill the form. Password for all: <code className="font-mono text-fg bg-surface-2 px-1 py-0.5 rounded-sm">demo1234</code>
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

            {/* Mobile Collapsible Details (<details>) */}
            <details className="sm:hidden group rounded-lg bg-surface-2 border border-line p-3 cursor-pointer">
              <summary className="flex items-center justify-between text-xs font-semibold text-fg select-none list-none">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Demo accounts (click to view)</span>
                </span>
                <ChevronDown className="w-4 h-4 text-muted transition-transform group-open:rotate-180" />
              </summary>

              <div className="pt-3 space-y-3 mt-2 border-t border-line">
                <p className="text-[11px] text-muted">
                  Click an account to fill the form. Password for all: <code className="font-mono text-fg bg-surface px-1 py-0.5 rounded-sm">demo1234</code>
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                    Professors
                  </span>
                  {professors.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectDemoAccount(p)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md bg-surface border border-line text-left"
                    >
                      <Avatar name={p.name} size="sm" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-medium text-fg truncate">{p.name}</div>
                        <div className="text-[10px] text-muted truncate">{p.email}</div>
                      </div>
                    </button>
                  ))}

                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block pt-1">
                    Students
                  </span>
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectDemoAccount(s)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md bg-surface border border-line text-left"
                    >
                      <Avatar name={s.name} size="sm" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-medium text-fg truncate">{s.name}</div>
                        <div className="text-[10px] text-muted truncate">{s.email}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <span className="text-[11px] text-muted">Restore initial state</span>
                  <button
                    type="button"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg motion-safe:transition-colors focus:outline-none focus-visible:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset demo data</span>
                  </button>
                </div>
              </div>
            </details>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-muted">
          ClassDesk &bull; Responsive Assignment &amp; Review Dashboard
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Full-Bleed Hero Image (lg and up)               */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden lg:block lg:w-1/2 relative h-full overflow-hidden border-l border-line bg-surface-2 select-none">
        {!heroImgFailed ? (
          <img
            src="/images/login-hero.jpg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            onError={() => setHeroImgFailed(true)}
            className="w-full h-full object-cover scale-112 origin-top-left"
          />
        ) : (
          <GradientBlob seed="classdesk-desktop-cover" variant="hero" className="w-full h-full" />
        )}

        {/* Bottom-left solid panel */}
        <div className="absolute bottom-8 left-8 max-w-md p-6 bg-surface border border-line shadow-card text-left space-y-1.5 z-10 rounded-lg">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Every assignment, one clear view.
          </h2>
          <p className="font-body text-sm text-muted">
            Students track what&apos;s due. Professors see who&apos;s done.
          </p>
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
    </div>
  )
}
