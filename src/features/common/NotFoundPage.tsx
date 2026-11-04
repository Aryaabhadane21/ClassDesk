import { Link } from 'react-router-dom'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { getHomePath } from '@/utils/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  const { user, status } = useAuth()
  usePageTitle('Page Not Found')

  const targetPath = status === 'authenticated' && user ? getHomePath(user.role) : '/login'

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md p-8 rounded-lg bg-surface border border-line shadow-card space-y-5">
        <div className="w-14 h-14 rounded-pill bg-surface-2 border border-line text-muted flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7 text-accent" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
            Page Not Found
          </h1>
          <p className="text-sm text-muted">
            The page you are looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link to={targetPath} className="inline-block w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Back to {status === 'authenticated' ? 'Dashboard' : 'Login'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
