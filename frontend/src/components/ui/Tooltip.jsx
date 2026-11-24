import { useState } from 'react';
import clsx from 'clsx';

export function Tooltip({ content, children, position = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute z-50 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap shadow-md',
            position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
            position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
