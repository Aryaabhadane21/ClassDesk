import { Calendar as CalendarIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'

// placeholder, replaced in step 9
export function StudentCalendarPage() {
  const { user } = useAuth()
  usePageTitle('Calendar')

  const firstName = user?.name.split(' ')[0] || 'Student'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description={`Hello, ${firstName}! Your monthly schedule and upcoming assignment deadlines.`}
      />

      <EmptyState
        icon={<CalendarIcon className="w-6 h-6 text-accent" />}
        title="Calendar View"
        description="Your assignment deadlines and course milestone schedule will appear here."
      />
    </div>
  )
}
