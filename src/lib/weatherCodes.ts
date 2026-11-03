import type { WeatherTheme } from '../types';

interface CodeInfo {
  label: string;
  icon: string;
  night?: string;
  theme: Exclude<WeatherTheme, 'night'>;
}

/** Коды погоды WMO, которые возвращает Open-Meteo. theme — группа для фона страницы. */
const CODES: Record<number, CodeInfo> = {
  0: { label: 'Ясно', icon: '☀️', night: '🌙', theme: 'clear' },
  1: { label: 'Преимущественно ясно', icon: '🌤️', night: '🌙', theme: 'clear' },
  2: { label: 'Переменная облачность', icon: '⛅', night: '☁️', theme: 'cloudy' },
  3: { label: 'Пасмурно', icon: '☁️', theme: 'cloudy' },
  45: { label: 'Туман', icon: '🌫️', theme: 'fog' },
  48: { label: 'Изморозь', icon: '🌫️', theme: 'fog' },
  51: { label: 'Лёгкая морось', icon: '🌦️', theme: 'rain' },
  53: { label: 'Морось', icon: '🌦️', theme: 'rain' },
  55: { label: 'Сильная морось', icon: '🌧️', theme: 'rain' },
  56: { label: 'Ледяная морось', icon: '🌧️', theme: 'rain' },
  57: { label: 'Сильная ледяная морось', icon: '🌧️', theme: 'rain' },
  61: { label: 'Небольшой дождь', icon: '🌦️', theme: 'rain' },
  63: { label: 'Дождь', icon: '🌧️', theme: 'rain' },
  65: { label: 'Сильный дождь', icon: '🌧️', theme: 'rain' },
  66: { label: 'Ледяной дождь', icon: '🌧️', theme: 'rain' },
  67: { label: 'Сильный ледяной дождь', icon: '🌧️', theme: 'rain' },
  71: { label: 'Небольшой снег', icon: '🌨️', theme: 'snow' },
  73: { label: 'Снег', icon: '🌨️', theme: 'snow' },
  75: { label: 'Сильный снег', icon: '❄️', theme: 'snow' },
  77: { label: 'Снежная крупа', icon: '🌨️', theme: 'snow' },
  80: { label: 'Небольшой ливень', icon: '🌦️', theme: 'rain' },
  81: { label: 'Ливень', icon: '🌧️', theme: 'rain' },
  82: { label: 'Сильный ливень', icon: '🌧️', theme: 'rain' },
  85: { label: 'Небольшой снегопад', icon: '🌨️', theme: 'snow' },
  86: { label: 'Сильный снегопад', icon: '❄️', theme: 'snow' },
  95: { label: 'Гроза', icon: '⛈️', theme: 'storm' },
  96: { label: 'Гроза с градом', icon: '⛈️', theme: 'storm' },
  99: { label: 'Сильная гроза с градом', icon: '⛈️', theme: 'storm' },
};

const UNKNOWN: CodeInfo = { label: 'Нет данных', icon: '❔', theme: 'cloudy' };

export interface WeatherInfo {
  label: string;
  icon: string;
  theme: WeatherTheme;
}

export function getWeatherInfo(code: number, isDay = true): WeatherInfo {
  const info = CODES[code] ?? UNKNOWN;
  return {
    label: info.label,
    icon: isDay ? info.icon : (info.night ?? info.icon),
    theme: info.theme === 'clear' && !isDay ? 'night' : info.theme,
  };
}
