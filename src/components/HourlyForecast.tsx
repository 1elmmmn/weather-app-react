import { formatHourLabel, formatTemp } from '../lib/format';
import { getWeatherInfo } from '../lib/weatherCodes';
import type { HourlyPoint } from '../types';

export function HourlyForecast({ hourly }: { hourly: HourlyPoint[] }) {
  return (
    <section className="card" aria-labelledby="hourly-title">
      <h2 id="hourly-title" className="card__title">Почасовой прогноз</h2>
      <ol className="hourly">
        {hourly.map((hour, index) => {
          const info = getWeatherInfo(hour.code, hour.isDay);
          return (
            <li key={hour.time} className="hourly__item">
              <span className="hourly__time">{formatHourLabel(hour.time, index)}</span>
              <span className="hourly__icon" role="img" aria-label={info.label}>{info.icon}</span>
              <span className="hourly__temp">{formatTemp(hour.temp)}</span>
              <span className="hourly__precip">{hour.precip != null && hour.precip >= 20 ? `${hour.precip}%` : ''}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
