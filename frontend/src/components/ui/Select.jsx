import { forwardRef, useId } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    options = [],
    placeholder,
    required = false,
    className = '',
    selectClassName = '',
    id: providedId,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = providedId || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-primary mb-1.5">
          {label}
          {required && <span className="text-semantic-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            'w-full appearance-none rounded-control bg-surface border text-sm text-ink-primary',
            'min-h-[44px] sm:min-h-[40px] pl-3 pr-9 py-2 transition-colors duration-150 cursor-pointer',
            error
              ? 'border-semantic-danger focus:border-semantic-danger'
              : 'border-border hover:border-slate-300 focus:border-brand-blue',
            selectClassName
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-semantic-danger">
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
});
