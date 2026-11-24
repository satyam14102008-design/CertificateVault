import clsx from 'clsx';

export function StatsCard({ title, value, helper, icon: Icon, iconBgClass = 'bg-blue-50 text-brand-blue', onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'bg-surface border border-border rounded-card p-5 text-left w-full',
        onClick ? 'cv-card-interactive cursor-pointer' : 'shadow-card'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink-primary tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-control flex items-center justify-center shrink-0', iconBgClass)}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>
      {helper && <p className="mt-2.5 text-xs text-ink-muted">{helper}</p>}
    </Tag>
  );
}
