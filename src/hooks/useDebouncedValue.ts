import { useEffect, useState } from 'react';

/** Возвращает `value` с задержкой: меняется, только когда ввод «затих» на `delay` мс. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
