import { UNITS, formatClock, formatTemp, hPaToMmHg, uvLabel, windDirection } from '../lib/format';
import type { CurrentWeather, DailyPoint, UnitSystem } from '../types';

interface Props {
  current: CurrentWeather;
  today: DailyPoint;
  units: UnitSystem;
}

interface Tile {
  label: string;
  value: string;
  hint?: string;
}

export function WeatherDetails({ current, today, units }: Props) {
  const tiles: Tile[] = [
    { label: 'Ощущается как', value: formatTemp(current.feelsLike) },
    { label: 'Влажность', value: `${Math.round(current.humidity)}%` },
    {
      label: 'Ветер',
      value: `${Math.round(current.windSpeed)} ${UNITS[units].speed}`,
      hint: windDirection(current.windDir),
    },
    { label: 'Давление', value: `${hPaToMmHg(current.pressure)} мм рт. ст.` },
    { label: 'УФ-индекс', value: String(Math.round(today.uv ?? 0)), hint: uvLabel(today.uv) },
    { label: 'Осадки', value: `${today.precip ?? 0}%`, hint: 'вероятность' },
    { label: 'Восход', value: formatClock(today.sunrise) },
    { label: 'Закат', value: formatClock(today.sunset) },
  ];

  return (
    <section className="card" aria-labelledby="details-title">
      <h2 id="details-title" className="card__title">Подробнее</h2>
      <dl className="details">
        {tiles.map(({ label, value, hint }) => (
          <div key={label} className="details__tile">
            <dt>{label}</dt>
            <dd>
              {value}
              {hint && <span className="details__hint">{hint}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
