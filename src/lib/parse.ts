/**
 * Данные из localStorage — недоверенный ввод: любые значения проверяются
 * и приводятся к безопасному виду, прежде чем попасть в состояние.
 */
import type { Place, Theme, UnitSystem } from '../types';

export const MAX_FAVORITES = 8;

export const DEFAULT_PLACE: Place = {
  name: 'Москва',
  region: 'Москва',
  country: 'Россия',
  latitude: 55.7558,
  longitude: 37.6173,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Возвращает очищенное место или null, если значение не похоже на место. */
function toPlace(value: unknown): Place | null {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude)
  ) {
    return null;
  }
  return {
    name: value.name,
    region: typeof value.region === 'string' ? value.region : '',
    country: typeof value.country === 'string' ? value.country : '',
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export const parsePlace = (value: unknown): Place => toPlace(value) ?? DEFAULT_PLACE;

export function parseFavorites(value: unknown): Place[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(toPlace)
    .filter((place): place is Place => place !== null)
    .slice(0, MAX_FAVORITES);
}

export const parseUnits = (value: unknown): UnitSystem => (value === 'imperial' ? 'imperial' : 'metric');

export const parseTheme = (value: unknown): Theme | null =>
  value === 'light' || value === 'dark' ? value : null;
