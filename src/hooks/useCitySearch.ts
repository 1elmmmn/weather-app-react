import { useEffect, useState } from 'react';
import { isAbortError, searchCities } from '../lib/api';
import type { Place } from '../types';
import { useDebouncedValue } from './useDebouncedValue';

export const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/** Поиск городов с дебаунсом и отменой устаревших запросов. */
export function useCitySearch(query: string) {
  const typed = query.trim();
  const term = useDebouncedValue(typed, DEBOUNCE_MS);
  const enabled = term.length >= MIN_QUERY_LENGTH;
  const [result, setResult] = useState<{ term: string; places: Place[]; failed: boolean } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    searchCities(term, controller.signal).then(
      (places) => setResult({ term, places, failed: false }),
      (error: unknown) => {
        if (!isAbortError(error)) setResult({ term, places: [], failed: true });
      },
    );

    return () => controller.abort();
  }, [term, enabled]);

  // Результат актуален, только если он для того, что сейчас введено.
  const current = enabled && typed === term && result?.term === term ? result : null;

  return {
    places: current?.places ?? [],
    failed: current?.failed ?? false,
    settled: current !== null,
    loading: typed.length >= MIN_QUERY_LENGTH && current === null,
  };
}
