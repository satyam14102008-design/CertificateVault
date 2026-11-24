import { useState } from 'react';
import clsx from 'clsx';

export function CategoryChart({ data = [], total = 0, onSelectCategory }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const nonZero = data.filter((item) => item.count > 0);
  const size = 164;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeFraction = 0;
  const segments = nonZero.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const dashLength = Math.max(0, fraction * circumference - 2);
    const dashOffset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return {
      ...item,
      dashLength,
      dashOffset,
    };
  });

  const activeItem = hoveredCategory
    ? data.find((d) => d.category === hoveredCategory)
    : null;

  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-ink-primary">Category Distribution</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Breakdown across achievement types</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-sm text-ink-muted">
          No certificates to chart yet.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="Certificates by category donut chart"
              className="-rotate-90"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg) => (
                <circle
                  key={seg.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.hex}
                  strokeWidth={hoveredCategory === seg.category ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${circumference}`}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(seg.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory?.(seg.category)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="text-2xl font-bold text-ink-primary tabular-nums">
                {activeItem ? activeItem.count : total}
              </span>
              <span className="text-[11px] font-medium text-ink-secondary truncate max-w-full">
                {activeItem ? activeItem.category : 'Total'}
              </span>
            </div>
          </div>

          <ul className="w-full space-y-2 flex-1">
            {data.map((item) => (
              <li key={item.category}>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.(item.category)}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-control text-xs transition-colors text-left',
                    hoveredCategory === item.category ? 'bg-slate-100' : 'hover:bg-slate-50'
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.hex }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-ink-primary truncate">{item.category}</span>
                  </span>
                  <span className="text-ink-secondary tabular-nums shrink-0">
                    <strong className="text-ink-primary font-semibold">{item.count}</strong>{' '}
                    <span className="text-ink-muted">({item.percentage}%)</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
