import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  widthClass = 'w-48',
  className = '',
  children,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger({ open, setOpen })}</div>

      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute z-40 mt-1.5 rounded-card bg-surface border border-border shadow-card-hover py-1.5',
            align === 'left' ? 'left-0' : 'right-0',
            widthClass
          )}
        >
          {children
            ? children({ close: () => setOpen(false) })
            : items.map((item, idx) => {
                if (item.divider) {
                  return <div key={`div_${idx}`} className="my-1 border-t border-border" role="separator" />;
                }
                const Icon = item.icon;
                return (
                  <button
                    key={item.id || item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      'min-h-[40px] sm:min-h-[34px]',
                      item.danger
                        ? 'text-semantic-danger hover:bg-red-50'
                        : 'text-ink-primary hover:bg-slate-50',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}
