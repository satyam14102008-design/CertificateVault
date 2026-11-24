import { useCallback, useRef, useState } from 'react';
import { ToastContext } from './contexts';

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message = '', variant = 'info', duration = 3800 }) => {
      toastCounter += 1;
      const id = `toast_${toastCounter}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, variant }]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const toast = {
    success: (title, message) => showToast({ title, message, variant: 'success' }),
    error: (title, message) => showToast({ title, message, variant: 'error', duration: 5000 }),
    info: (title, message) => showToast({ title, message, variant: 'info' }),
    warning: (title, message) => showToast({ title, message, variant: 'warning' }),
    dismiss: dismissToast,
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}
