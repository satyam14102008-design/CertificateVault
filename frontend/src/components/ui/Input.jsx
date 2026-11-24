import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    rightElement,
    className = '',
    inputClassName = '',
    required = false,
    id: providedId,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-primary mb-1.5">
          {label}
          {required && <span className="text-semantic-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            'w-full rounded-control bg-surface border text-sm text-ink-primary placeholder:text-ink-muted',
            'min-h-[44px] sm:min-h-[40px] py-2 transition-colors duration-150',
            LeftIcon ? 'pl-9' : 'pl-3',
            rightElement ? 'pr-10' : 'pr-3',
            error
              ? 'border-semantic-danger focus:border-semantic-danger'
              : 'border-border hover:border-slate-300 focus:border-brand-blue',
            'disabled:bg-slate-50 disabled:text-ink-muted disabled:cursor-not-allowed',
            inputClassName
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
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

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    counter,
    className = '',
    textareaClassName = '',
    required = false,
    id: providedId,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-primary">
            {label}
            {required && <span className="text-semantic-danger ml-0.5">*</span>}
          </label>
        )}
        {counter && <span className="text-xs text-ink-muted tabular-nums">{counter}</span>}
      </div>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'w-full rounded-control bg-surface border text-sm text-ink-primary placeholder:text-ink-muted',
          'px-3 py-2.5 transition-colors duration-150 resize-y',
          error
            ? 'border-semantic-danger focus:border-semantic-danger'
            : 'border-border hover:border-slate-300 focus:border-brand-blue',
          textareaClassName
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-semantic-danger">
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
});
