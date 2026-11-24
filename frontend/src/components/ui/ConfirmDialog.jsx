import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5 py-1">
        <div
          className={
            variant === 'danger'
              ? 'w-10 h-10 rounded-full bg-red-50 text-semantic-danger flex items-center justify-center shrink-0'
              : 'w-10 h-10 rounded-full bg-amber-50 text-semantic-warning flex items-center justify-center shrink-0'
          }
        >
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
          <p className="mt-1.5 text-sm text-ink-secondary leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
