import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { getHomePath, isPathAllowedForRole } from '@/utils/routes'
import type { Role } from '@/types'

/**
 * Route guard that requires active authentication.
 * Saves the attempted path in location state for post-login return.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()

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

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * Role-based guard ensuring only authorized roles view specific subtrees.
 * Users with the opposite role are redirected to their own role home.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return null
  }

  if (!user || user.role !== role) {
    const fallbackPath = user ? getHomePath(user.role) : '/login'
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

/**
 * Redirects authenticated users away from public-only pages like /login
 * back to their home or previous intended destination.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()

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

  if (status === 'authenticated' && user) {
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
    const destination =
      fromPath && isPathAllowedForRole(fromPath, user.role)
        ? fromPath
        : getHomePath(user.role)

    return <Navigate to={destination} replace />
  }

  return <>{children}</>
}

/**
 * Root index redirector (/)
 */
export function RootRedirect() {
  const { user, status } = useAuth()

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

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getHomePath(user.role)} replace />
}
