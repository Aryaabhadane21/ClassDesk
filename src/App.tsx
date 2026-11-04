import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { UiGallery } from '@/features/dev/UiGallery'
import { Avatar, Button, Spinner, ThemeToggle } from '@/components/ui'

// temporary, replaced in step 7
export default function App() {
  const { user, status, logout } = useAuth()
  const [isGalleryView, setIsGalleryView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('gallery=1')
    }
    return false
  })

  useEffect(() => {
    const handlePopState = () => {
      setIsGalleryView(window.location.search.includes('gallery=1'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // If ?gallery=1 is present in URL, render the complete component gallery
  if (isGalleryView) {
    return <UiGallery />
  }

  // 1. Loading state: centered Spinner
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" tone="accent" />
          <p className="text-sm font-medium text-muted">Restoring session...</p>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated: render LoginPage
  if (status === 'unauthenticated' || !user) {
    return <LoginPage />
  }

  // 3. Authenticated: temporary placeholder screen
  return (
    <div className="min-h-screen bg-app text-fg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-lg bg-surface border border-line shadow-card text-center space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted">
            ClassDesk Session
          </span>
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-fg">
              Signed in as {user.name}
            </h1>
            <p className="text-sm text-accent font-semibold uppercase tracking-wider mt-0.5">
              Role: {user.role}
            </p>
            <p className="text-xs text-muted mt-1">{user.email}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-line space-y-3">
          <Button variant="danger" size="md" onClick={logout} className="w-full">
            Sign out
          </Button>

          <div>
            <a
              href="?gallery=1"
              className="inline-block text-xs text-accent hover:underline cursor-pointer"
            >
              View UI Component Gallery (?gallery=1)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
