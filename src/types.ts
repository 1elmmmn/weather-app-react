export type UnitSystem = 'metric' | 'imperial';
export type Theme = 'light' | 'dark';
export type WeatherTheme = 'clear' | 'night' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place extends Coordinates {
  name: string;
  region: string;
  country: string;
}

export interface CurrentWeather {
  /** Местное время города без смещения: «2026-10-05T14:15». */
  time: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  isDay: boolean;
  code: number;
  windSpeed: number;
  windDir: number;
  pressure: number;
}

export interface HourlyPoint {
  time: string;
  temp: number;
  code: number;
  isDay: boolean;
  precip: number | null;
}

export interface DailyPoint {
  date: string;
  code: number;
  max: number;
  min: number;
  sunrise: string;
  sunset: string;
  uv: number | null;
  precip: number | null;
}

export interface Forecast {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}
