import { Calendar as CalendarIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

// placeholder, replaced in step 9
export function AdminCalendarPage() {
  usePageTitle('Calendar')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Comprehensive overview of active assignment deadlines across all student cohorts."
      />

      <EmptyState
        icon={<CalendarIcon className="w-6 h-6 text-accent" />}
        title="Admin Calendar Overview"
        description="Course milestone deadlines and schedule synchronization will appear here."
      />
    </div>
  )
}
