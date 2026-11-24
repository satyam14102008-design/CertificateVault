import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const VARIANT_META = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-semantic-success',
    borderClass: 'border-emerald-200/80',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-semantic-danger',
    borderClass: 'border-red-200/80',
  },
  warning: {
    icon: AlertCircle,
    iconClass: 'text-semantic-warning',
    borderClass: 'border-amber-200/80',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-blue',
    borderClass: 'border-border',
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
    >
      {toasts.map((item) => {
        const meta = VARIANT_META[item.variant] || VARIANT_META.info;
        const Icon = meta.icon;

        return (
          <div
            key={item.id}
            role="status"
            className={clsx(
              'pointer-events-auto bg-surface border rounded-card shadow-card-hover p-3.5 flex items-start gap-3',
              meta.borderClass
            )}
          >
            <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', meta.iconClass)} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-primary">{item.title}</p>
              {item.message && (
                <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{item.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss notification"
              className="rounded-control p-1 text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
