import type { RawForecast } from '../lib/model';

/** Минимальный ответ Open-Meteo: 48 часов и 7 дней. Текущее время — 5 октября 2026, 14:15. */
export function makeRawForecast(): RawForecast {
  const hourTimes = Array.from({ length: 48 }, (_, i) => {
    const day = i < 24 ? '05' : '06';
    return `2026-10-${day}T${String(i % 24).padStart(2, '0')}:00`;
  });
  const dayTimes = Array.from({ length: 7 }, (_, i) => `2026-10-${String(5 + i).padStart(2, '0')}`);

  return {
    timezone: 'Europe/Moscow',
    current: {
      time: '2026-10-05T14:15',
      temperature_2m: 12.4,
      apparent_temperature: 10.1,
      relative_humidity_2m: 71,
      is_day: 1,
      weather_code: 3,
      wind_speed_10m: 4.2,
      wind_direction_10m: 225,
      surface_pressure: 1008,
    },
    hourly: {
      time: hourTimes,
      temperature_2m: hourTimes.map((_, i) => 8 + (i % 24) / 3),
      weather_code: hourTimes.map(() => 3),
      is_day: hourTimes.map((_, i) => (i % 24 >= 7 && i % 24 <= 18 ? 1 : 0)),
      precipitation_probability: hourTimes.map((_, i) => (i % 5) * 10),
    },
    daily: {
      time: dayTimes,
      weather_code: dayTimes.map(() => 61),
      temperature_2m_max: dayTimes.map((_, i) => 14 + i),
      temperature_2m_min: dayTimes.map((_, i) => 4 + i),
      sunrise: dayTimes.map((d) => `${d}T06:48`),
      sunset: dayTimes.map((d) => `${d}T18:12`),
      uv_index_max: dayTimes.map(() => 2.4),
      precipitation_probability_max: dayTimes.map((_, i) => i * 10),
    },
  };
}

/** Подставная замена fetch: возвращает JSON с нужным статусом. */
export function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
