import clsx from 'clsx';
import { formatBytes } from '../../utils/formatDate';

const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024;

/**
 * Reusable progress meter displaying used vs. remaining cloud storage against a bucket quota.
 */
export function StorageMeter({
  usedBytes = 0,
  quotaBytes = DEFAULT_QUOTA_BYTES,
  remainingBytes,
  showLegend = true,
  className,
}) {
  const safeQuota = quotaBytes > 0 ? quotaBytes : DEFAULT_QUOTA_BYTES;
  const safeUsed = Math.max(0, usedBytes || 0);
  const safeRemaining =
    remainingBytes !== undefined && remainingBytes !== null
      ? Math.max(0, remainingBytes)
      : Math.max(0, safeQuota - safeUsed);

  const rawPercent = (safeUsed / safeQuota) * 100;
  const clampedPercent = Math.min(100, Math.max(0, rawPercent));
  const barWidth = safeUsed > 0 && clampedPercent < 2 ? 2 : clampedPercent;

  const percentLabel =
    rawPercent === 0
      ? '0%'
      : rawPercent < 0.1
        ? '< 0.1%'
        : `${rawPercent.toFixed(1)}%`;

  const barColor =
    clampedPercent >= 95
      ? 'bg-rose-500'
      : clampedPercent >= 80
        ? 'bg-amber-500'
        : 'bg-brand-blue';

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div
        role="progressbar"
        aria-label="Cloud storage usage"
        aria-valuenow={Math.round(clampedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {showLegend && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-emerald-700 tabular-nums">
            {formatBytes(safeRemaining)} left
          </span>
          <span className="text-ink-muted tabular-nums">
            {percentLabel} of {formatBytes(safeQuota)} used
          </span>
        </div>
      )}
    </div>
  );
}
