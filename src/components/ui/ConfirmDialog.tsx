import { useRef, type ReactNode, type RefObject } from 'react'
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
  initialFocusRef?: RefObject<HTMLElement | null>
  errorContent?: ReactNode
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
  initialFocusRef,
  errorContent,
}: ConfirmDialogProps) {
  const defaultCancelRef = useRef<HTMLButtonElement>(null)
  const focusRef = initialFocusRef || defaultCancelRef

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          onCancel()
        }
      }}
      title={title}
      disableBackdropClick={loading}
      initialFocusRef={focusRef}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted leading-relaxed">{message}</div>

        {errorContent && <div>{errorContent}</div>}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            ref={defaultCancelRef}
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
            disabled={loading}
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
