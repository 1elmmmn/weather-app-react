import type { Coordinates, Forecast, Place, UnitSystem } from '../types';
import { UNITS } from './format';
import { normalizeForecast, placeId } from './model';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: Forecast }>();

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
  }
}

/** Отмена запроса — не ошибка для пользователя. */
export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError('Нет соединения с сервером погоды. Проверьте интернет.', { cause: error });
  }
  if (!response.ok) {
    throw new ApiError(`Сервис погоды вернул ошибку (${response.status}). Попробуйте позже.`, {
      status: response.status,
    });
  }
  return (await response.json()) as T;
}

interface GeoSearchResponse {
  results?: {
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
  }[];
}

/** Поиск городов по названию. Запрос короче 2 символов не уходит в сеть. */
export async function searchCities(query: string, signal?: AbortSignal): Promise<Place[]> {
  const name = query.trim();
  if (name.length < 2) return [];

  const params = new URLSearchParams({ name, count: '6', language: 'ru', format: 'json' });
  const data = await getJson<GeoSearchResponse>(`${GEO_URL}?${params}`, signal);

  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: r.admin1 ?? '',
    country: r.country ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Прогноз по координатам; ответы кэшируются на 10 минут. */
export async function getForecast(
  { latitude, longitude }: Coordinates,
  units: UnitSystem,
  signal?: AbortSignal,
): Promise<Forecast> {
  const key = `${placeId({ latitude, longitude })}|${units}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'is_day',
      'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'surface_pressure',
    ].join(','),
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset',
      'uv_index_max', 'precipitation_probability_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
    temperature_unit: UNITS[units].apiTemp,
    wind_speed_unit: UNITS[units].apiWind,
  });

  const raw = await getJson<unknown>(`${FORECAST_URL}?${params}`, signal);
  const data = normalizeForecast(raw);
  cache.set(key, { at: Date.now(), data });
  return data;
}

interface ReverseResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

/** Название населённого пункта по координатам; при любой ошибке — null. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ name: string | null; region: string; country: string } | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'ru',
    });
    const data = await getJson<ReverseResponse>(`${REVERSE_URL}?${params}`, signal);
    return {
      name: data.city || data.locality || null,
      region: data.principalSubdivision ?? '',
      country: data.countryName ?? '',
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

export function clearCache(): void {
  cache.clear();
}
