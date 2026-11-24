import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SidebarNavContent } from './Sidebar';

export function MobileNav({ open, onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="relative z-10 w-72 max-w-[85vw] h-full bg-sidebar shadow-2xl flex flex-col"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute top-3.5 right-3 z-20 p-2 rounded-control text-slate-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <SidebarNavContent onNavigate={onClose} />
      </div>
    </div>,
    document.body
  );
}
