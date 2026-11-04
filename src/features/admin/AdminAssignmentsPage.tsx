import { ClipboardList, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, EmptyState } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

// placeholder, replaced in step 8
export function AdminAssignmentsPage() {
  usePageTitle('Assignments')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Manage course assignments, view student submission rates, and evaluate submissions."
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Assignment
          </Button>
        }
      />

      <EmptyState
        icon={<ClipboardList className="w-6 h-6 text-accent" />}
        title="Assignments Manager"
        description="Admin assignment management tools, cohort submissions, and grading metrics will appear here."
      />
    </div>
  )
}
