/**
 * Превращает «сырой» ответ Open-Meteo в удобную для интерфейса модель.
 * Всё, что связано со структурой API, живёт здесь — компоненты про неё не знают.
 */
import type { Coordinates, Forecast, HourlyPoint, Place } from '../types';

export interface RawForecast {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    is_day: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
    precipitation_probability: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: (number | null)[];
    precipitation_probability_max: (number | null)[];
  };
}

/** Стабильный идентификатор места (координаты округляются, чтобы «почти те же» совпадали). */
export function placeId({ latitude, longitude }: Coordinates): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

/** «Московская область, Россия» — без повторов названия города. */
export function placeSubtitle(place: Place): string {
  return [place.region, place.country]
    .filter((part, i, all) => part && part !== place.name && all.indexOf(part) === i)
    .join(', ');
}

/**
 * Берёт `count` часов начиная с текущего.
 * Строки времени в ISO сравниваются лексикографически — это корректно.
 */
export function pickHourly(hourly: RawForecast['hourly'], currentTime: string, count = 24): HourlyPoint[] {
  const hourPrefix = currentTime.slice(0, 13); // «YYYY-MM-DDTHH»
  let start = hourly.time.findIndex((t) => t.slice(0, 13) >= hourPrefix);
  if (start === -1) start = 0;
  const end = Math.min(start + count, hourly.time.length);

  const result: HourlyPoint[] = [];
  for (let i = start; i < end; i += 1) {
    result.push({
      time: hourly.time[i] as string,
      temp: hourly.temperature_2m[i] as number,
      code: hourly.weather_code[i] as number,
      isDay: hourly.is_day[i] === 1,
      precip: hourly.precipitation_probability[i] ?? null,
    });
  }
  return result;
}

/** @throws {Error} если ответ не похож на прогноз */
export function normalizeForecast(raw: unknown): Forecast {
  const { timezone, current, hourly, daily } = (raw ?? {}) as Partial<RawForecast>;
  if (!current || !hourly?.time || !daily?.time) {
    throw new Error('Сервис вернул неожиданный ответ');
  }

  return {
    timezone: timezone ?? '',
    current: {
      time: current.time,
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
      code: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDir: current.wind_direction_10m,
      pressure: current.surface_pressure,
    },
    hourly: pickHourly(hourly, current.time, 24),
    daily: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i] as number,
      max: daily.temperature_2m_max[i] as number,
      min: daily.temperature_2m_min[i] as number,
      sunrise: daily.sunrise[i] as string,
      sunset: daily.sunset[i] as string,
      uv: daily.uv_index_max[i] ?? null,
      precip: daily.precipitation_probability_max[i] ?? null,
    })),
  };
}
