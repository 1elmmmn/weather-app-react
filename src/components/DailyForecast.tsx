import { formatTemp, formatWeekday, rangePosition } from '../lib/format';
import { getWeatherInfo } from '../lib/weatherCodes';
import type { DailyPoint } from '../types';

export function DailyForecast({ daily }: { daily: DailyPoint[] }) {
  const weekMin = Math.min(...daily.map((day) => day.min));
  const weekMax = Math.max(...daily.map((day) => day.max));

  return (
    <section className="card" aria-labelledby="daily-title">
      <h2 id="daily-title" className="card__title">Прогноз на 7 дней</h2>
      <ul className="daily">
        {daily.map((day, index) => {
          const info = getWeatherInfo(day.code, true);
          const { left, width } = rangePosition(day.min, day.max, weekMin, weekMax);
          return (
            <li key={day.date} className="daily__item">
              <span className="daily__day">{formatWeekday(day.date, index)}</span>
              <span className="daily__icon" role="img" aria-label={info.label}>{info.icon}</span>
              <span className="daily__precip">{day.precip != null && day.precip >= 20 ? `${day.precip}%` : ''}</span>
              <span className="daily__min">{formatTemp(day.min)}</span>
              <span className="range" aria-hidden="true">
                <span className="range__fill" style={{ left: `${left}%`, width: `${width}%` }} />
              </span>
              <span className="daily__max">{formatTemp(day.max)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
