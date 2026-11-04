import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'

// placeholder, replaced in step 8
export function StudentDashboardPage() {
  const { user } = useAuth()
  usePageTitle('Assignments')

  const firstName = user?.name.split(' ')[0] || 'Student'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description={`Hello, ${firstName}! Track your ongoing homework, submissions, and deadlines.`}
      />

      <EmptyState
        icon={<ClipboardList className="w-6 h-6 text-accent" />}
        title="Assignments Dashboard"
        description="Your course assignments, due dates, and submission records will appear here."
      />
    </div>
  )
}
