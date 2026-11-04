import { AlertCircle } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui'
import type { StudentAssignment } from '@/types'

export interface SubmitConfirmationProps {
  isOpen: boolean
  assignment: StudentAssignment | null
  loading?: boolean
  error?: string | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function SubmitConfirmation({
  isOpen,
  assignment,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  if (!assignment) return null

  return (
    <ConfirmDialog
      isOpen={isOpen}
      tone="default"
      title="Confirm your submission"
      message={`You're about to mark "${assignment.title}" as submitted. Your professor will see it as submitted right away. Please make sure your work is uploaded to the Drive link first.`}
      confirmLabel="Yes, confirm submission"
      cancelLabel="Not yet"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      errorContent={
        error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-none bg-danger-soft/70 border border-danger/30 text-danger text-xs font-medium text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">{error}</span>
          </div>
        ) : null
      }
    />
  )
}
