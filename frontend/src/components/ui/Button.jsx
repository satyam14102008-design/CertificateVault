import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'cv-brand-gradient text-white shadow-sm hover:shadow active:scale-[0.99] border border-transparent',
  secondary:
    'bg-surface text-ink-primary border border-border shadow-card hover:bg-slate-50 hover:border-slate-300',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-slate-100 hover:text-ink-primary border border-transparent',
  danger:
    'bg-semantic-danger text-white hover:bg-red-700 border border-transparent shadow-sm',
  subtle:
    'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs font-medium min-h-[36px] sm:min-h-[32px]',
  md: 'px-4 py-2 text-sm font-medium min-h-[44px] sm:min-h-[38px]',
  lg: 'px-5 py-2.5 text-sm font-semibold min-h-[44px]',
  icon: 'p-2 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-control transition-all duration-150 ease-out select-none whitespace-nowrap',
        'disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.secondary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
});
