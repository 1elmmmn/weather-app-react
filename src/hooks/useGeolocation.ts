import { useCallback, useState } from 'react';
import { reverseGeocode } from '../lib/api';
import type { Place } from '../types';

const ERRORS: Record<number, string> = {
  1: 'Доступ к геолокации запрещён. Разрешите его в настройках браузера или найдите город вручную.',
  2: 'Не удалось определить местоположение. Найдите город вручную.',
  3: 'Определение местоположения заняло слишком много времени. Попробуйте ещё раз.',
};

/** Определяет местоположение через Geolocation API и передаёт найденное место в onFound. */
export function useGeolocation(onFound: (place: Place) => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Ваш браузер не поддерживает геолокацию');
      return;
    }
    setPending(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const geo = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
        setPending(false);
        onFound({
          name: geo?.name || 'Моё местоположение',
          region: geo?.region ?? '',
          country: geo?.country ?? '',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      (failure) => {
        setPending(false);
        setError(ERRORS[failure.code] ?? ERRORS[2] ?? null);
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, [onFound]);

  const clearError = useCallback(() => setError(null), []);

  return { locate, pending, error, clearError };
}
