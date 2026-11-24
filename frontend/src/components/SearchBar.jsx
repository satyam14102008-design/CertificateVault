import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search certificates, issuers...',
  enableShortcut = false,
  className = '',
  ariaLabel = 'Search certificates',
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!enableShortcut) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        document.activeElement?.isContentEditable;
      if (isEditable) return;

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
    if (event.key === 'Escape' && value) {
      onChange('');
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <Search
        className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-control bg-surface border border-border hover:border-slate-300 focus:border-brand-blue text-sm text-ink-primary placeholder:text-ink-muted pl-9 pr-14 py-2 min-h-[44px] sm:min-h-[38px] transition-colors"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
          enableShortcut && (
            <kbd
              aria-hidden="true"
              className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-medium text-ink-muted bg-slate-100 border border-border rounded"
            >
              /
            </kbd>
          )
        )}
      </div>
    </div>
  );
}
