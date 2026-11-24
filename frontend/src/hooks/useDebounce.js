import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly changing value (e.g. search query input).
 * @template T
 * @param {T} value
 * @param {number} [delay=220]
 * @returns {T}
 */
export function useDebounce(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
