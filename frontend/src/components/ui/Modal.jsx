import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  mobileSheet = false,
  className = '',
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first form field if present, otherwise first focusable element or dialog container
    const focusTimer = requestAnimationFrame(() => {
      const firstInput = dialogRef.current?.querySelector(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
      );
      if (firstInput && firstInput.offsetParent !== null) {
        firstInput.focus();
        return;
      }
      const focusables = getFocusableElements(dialogRef.current);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        mobileSheet ? 'p-0 sm:p-4' : 'p-4'
      )}
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={clsx(
          'relative z-10 w-full bg-surface shadow-modal border border-border flex flex-col overflow-hidden',
          mobileSheet
            ? 'h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-card'
            : 'max-h-[90vh] rounded-card',
          SIZE_CLASSES[size] || SIZE_CLASSES.lg,
          className
        )}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border bg-surface shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-ink-primary truncate">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs text-ink-secondary mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex items-center justify-center rounded-control p-1.5 min-h-[40px] min-w-[40px] sm:min-h-[32px] sm:min-w-[32px] text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-border bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
