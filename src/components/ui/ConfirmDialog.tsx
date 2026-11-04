import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      disableBackdropClick={loading}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted">{message}</div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="md"
            loading={loading}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
