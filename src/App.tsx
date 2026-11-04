import { useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { DEMO_PASSWORD } from '@/data/seed'

// temporary, replaced in a later step
export default function App() {
  const { user, status, login, logout } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDemoLogin = async (email: string) => {
    try {
      setLoginError(null)
      setIsSubmitting(true)
      await login(email, DEMO_PASSWORD)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-app p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Surface Card */}
        <section className="bg-surface rounded-lg p-8 border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Theme Token &amp; Auth Preview
            </span>
            {/* New ThemeToggle Component */}
            <ThemeToggle />
          </div>

          <div>
            <h1 className="font-display text-4xl font-semibold text-fg tracking-tight">
              ClassDesk
            </h1>
            <p className="font-body text-base text-muted mt-2">
              An assignment and review dashboard for students and instructors.
              Experience seamless workflow management with clean design tokens.
            </p>
          </div>

          {/* Session Test Section */}
          <div className="p-4 rounded-md bg-surface-2 border border-line space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-muted">
                Session Test
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-pill bg-app text-fg border border-line">
                Status: <strong className="capitalize">{status}</strong>
              </span>
            </div>

            {status === 'loading' ? (
              <p className="text-sm text-muted animate-pulse">Restoring session...</p>
            ) : status === 'authenticated' && user ? (
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="text-fg font-medium">{user.name}</div>
                  <div className="text-xs text-muted">{user.email}</div>
                  <div className="text-xs">
                    Role:{' '}
                    <span className="font-semibold uppercase tracking-wider text-accent">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-1.5 rounded-pill text-xs font-medium bg-danger-soft text-danger hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Not signed in. Click a demo account to test auth context &amp; session persistence:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('meera.iyer@classdesk.edu')}
                    className="px-3 py-1.5 rounded-pill text-xs font-medium bg-primary text-primary-fg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    Sign in as Prof. Meera Iyer (admin)
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('aarav.sharma@classdesk.edu')}
                    className="px-3 py-1.5 rounded-pill text-xs font-medium bg-surface text-fg border border-line hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Sign in as Aarav Sharma (student)
                  </button>
                </div>
                {loginError && (
                  <p className="text-xs text-danger font-medium">{loginError}</p>
                )}
              </div>
            )}
          </div>

          {/* Badges preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted">Status &amp; Accent Badges</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-accent-soft text-accent">
                Accent Badge
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-success-soft text-success">
                Success Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-warning-soft text-warning">
                Warning Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-danger-soft text-danger">
                Danger Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-info-soft text-info">
                Info Status
              </span>
            </div>
          </div>

          {/* Primary Pill Button */}
          <div className="pt-2 flex items-center justify-between border-t border-line">
            <button
              type="button"
              className="px-6 py-2.5 rounded-pill bg-primary text-primary-fg font-medium text-sm shadow-pop cursor-pointer hover:opacity-90 transition-opacity"
            >
              Pill Primary Button
            </button>
            <span className="text-xs text-muted">
              Font changes per theme (Fraunces/Inter ⇄ Outfit)
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
