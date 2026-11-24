import clsx from 'clsx';
import { Award } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon = Award,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) {
  const Icon = icon;
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-card px-6 py-12 text-center shadow-card flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-ink-secondary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ink-secondary max-w-md leading-relaxed">{description}</p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load certificates',
  message = 'Something went wrong while fetching your vault.',
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="bg-surface border border-red-200 rounded-card px-6 py-10 text-center shadow-card flex flex-col items-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-semantic-danger flex items-center justify-center mb-3.5">
        <Award className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-secondary max-w-md">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
