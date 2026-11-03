import { useCallback, useEffect, useState } from 'react';
import { ApiError, getForecast, isAbortError } from '../lib/api';
import type { Coordinates, Forecast, UnitSystem } from '../types';

type Outcome = { status: 'success'; data: Forecast } | { status: 'error'; message: string };
export type ForecastState = { status: 'loading' } | Outcome;

/**
 * Загружает прогноз при смене места или единиц измерения.
 *
 * Результат хранится вместе с «ключом» запроса, а загрузка выводится сравнением ключей.
 * Поэтому устаревший ответ никогда не показывается для другого места,
 * а в эффекте не нужно синхронно вызывать setState.
 */
export function useForecast({ latitude, longitude }: Coordinates, units: UnitSystem) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; outcome: Outcome } | null>(null);
  const key = `${latitude},${longitude}|${units}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();

    getForecast({ latitude, longitude }, units, controller.signal).then(
      (data) => setResult({ key, outcome: { status: 'success', data } }),
      (error: unknown) => {
        if (isAbortError(error)) return;
        const message = error instanceof ApiError ? error.message : 'Произошла непредвиденная ошибка.';
        setResult({ key, outcome: { status: 'error', message } });
      },
    );

    return () => controller.abort(); // смена места или размонтирование отменяет запрос
  }, [key, latitude, longitude, units]);

  const state: ForecastState = result?.key === key ? result.outcome : { status: 'loading' };
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, reload };
}
