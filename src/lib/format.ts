/**
 * Чистые функции форматирования: без DOM, React и сети.
 *
 * Open-Meteo с timezone=auto отдаёт время города БЕЗ смещения («2026-10-05T14:00»).
 * Поэтому время не парсится через Date (оно «поехало» бы в часовой пояс браузера),
 * а берётся срезом строки.
 */
import type { UnitSystem } from '../types';

interface UnitLabels {
  temp: string;
  speed: string;
  apiTemp: 'celsius' | 'fahrenheit';
  apiWind: 'ms' | 'mph';
}

export const UNITS: Record<UnitSystem, UnitLabels> = {
  metric: { temp: '°C', speed: 'м/с', apiTemp: 'celsius', apiWind: 'ms' },
  imperial: { temp: '°F', speed: 'миль/ч', apiTemp: 'fahrenheit', apiWind: 'mph' },
};

const COMPASS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'] as const;

/** 21.6 → «22°», −4.5 → «−4°» (типографский минус), null → «—». */
export function formatTemp(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value);
  return rounded < 0 ? `−${Math.abs(rounded)}°` : `${rounded}°`;
}

/** Направление ветра по азимуту в градусах. */
export function windDirection(deg: number | null | undefined): string {
  if (deg == null || Number.isNaN(deg)) return '';
  const normalized = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % 8] ?? '';
}

/** гПа → мм рт. ст. */
export function hPaToMmHg(hPa: number): number {
  return Math.round(hPa * 0.750062);
}

/** «2026-10-05T14:30» → «14:30». */
export function formatClock(iso: string): string {
  return iso.slice(11, 16);
}

/** Подпись часа в почасовом прогнозе: первый элемент — «Сейчас». */
export function formatHourLabel(iso: string, index: number): string {
  return index === 0 ? 'Сейчас' : formatClock(iso);
}

const utcDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** «Сегодня», «Завтра», затем «Ср», «Чт»… */
export function formatWeekday(iso: string, index: number): string {
  if (index === 0) return 'Сегодня';
  if (index === 1) return 'Завтра';
  const short = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' }).format(utcDate(iso));
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** «2026-10-05T14:15» → «5 октября». */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utcDate(iso));
}

/** Словесная оценка УФ-индекса по шкале ВОЗ. */
export function uvLabel(uv: number | null | undefined): string {
  const value = Math.round(uv ?? 0);
  if (value < 3) return 'Низкий';
  if (value < 6) return 'Умеренный';
  if (value < 8) return 'Высокий';
  if (value < 11) return 'Очень высокий';
  return 'Экстремальный';
}

/**
 * Позиция полоски «мин–макс» дня относительно диапазона всей недели (в процентах).
 * Минимальная ширина гарантирует, что полоска остаётся видимой.
 */
export function rangePosition(min: number, max: number, weekMin: number, weekMax: number) {
  const span = weekMax - weekMin || 1;
  const round = (n: number) => Math.round(n * 10) / 10;
  const width = Math.min(Math.max(((max - min) / span) * 100, 6), 100);
  const left = Math.min(((min - weekMin) / span) * 100, 100 - width);
  return { left: round(Math.max(left, 0)), width: round(width) };
}
