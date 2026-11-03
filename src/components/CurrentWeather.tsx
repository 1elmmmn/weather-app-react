import { UNITS, formatClock, formatDate, formatTemp } from '../lib/format';
import { placeSubtitle } from '../lib/model';
import { getWeatherInfo } from '../lib/weatherCodes';
import type { CurrentWeather as Current, DailyPoint, Place, UnitSystem } from '../types';

interface Props {
  place: Place;
  units: UnitSystem;
  current: Current;
  today: DailyPoint;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function CurrentWeather({ place, units, current, today, isFavorite, onToggleFavorite }: Props) {
  const info = getWeatherInfo(current.code, current.isDay);
  const meta = [placeSubtitle(place), `${formatDate(current.time)}, ${formatClock(current.time)}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="card hero" aria-labelledby="place-name">
      <div className="hero__head">
        <div>
          <h1 id="place-name" className="hero__place">{place.name}</h1>
          <p className="hero__meta">{meta}</p>
        </div>
        <button
          type="button"
          className="fav-btn"
          aria-pressed={isFavorite}
          title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          onClick={onToggleFavorite}
        >
          <span aria-hidden="true">★</span>
          <span className="sr-only">Избранное</span>
        </button>
      </div>

      <div className="hero__main">
        <span className="hero__icon" aria-hidden="true">{info.icon}</span>
        <p className="hero__temp">
          <span className="sr-only">Температура </span>
          {formatTemp(current.temp)}
          <span className="hero__unit">{UNITS[units].temp.replace('°', '')}</span>
        </p>
        <div className="hero__text">
          <p className="hero__label">{info.label}</p>
          <p className="hero__sub">Ощущается как {formatTemp(current.feelsLike)}</p>
          <p className="hero__sub">Макс. {formatTemp(today.max)} · мин. {formatTemp(today.min)}</p>
        </div>
      </div>
    </section>
  );
}
