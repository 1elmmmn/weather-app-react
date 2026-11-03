import { useEffect, useState } from 'react';
import { CurrentWeather } from './components/CurrentWeather';
import { DailyForecast } from './components/DailyForecast';
import { ErrorCard } from './components/ErrorCard';
import { Favorites } from './components/Favorites';
import { Header } from './components/Header';
import { HourlyForecast } from './components/HourlyForecast';
import { Skeleton } from './components/Skeleton';
import { WeatherDetails } from './components/WeatherDetails';
import { useForecast } from './hooks/useForecast';
import { useGeolocation } from './hooks/useGeolocation';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { formatTemp } from './lib/format';
import { placeId } from './lib/model';
import { MAX_FAVORITES, parseFavorites, parsePlace, parseUnits } from './lib/parse';
import { getWeatherInfo } from './lib/weatherCodes';
import type { Place } from './types';

export default function App() {
  const [place, setPlace] = useLocalStorage('place', parsePlace);
  const [units, setUnits] = useLocalStorage('units', parseUnits);
  const [favorites, setFavorites] = useLocalStorage('favorites', parseFavorites);
  const { toggleTheme } = useTheme();
  const [notice, setNotice] = useState('');

  const { state, reload } = useForecast(place, units);

  const selectPlace = (next: Place) => {
    setNotice('');
    setPlace(next);
  };
  const geo = useGeolocation(selectPlace);

  const isFavorite = favorites.some((fav) => placeId(fav) === placeId(place));

  function toggleFavorite() {
    if (isFavorite) {
      setFavorites(favorites.filter((fav) => placeId(fav) !== placeId(place)));
      setNotice(`${place.name} убран из избранного`);
    } else if (favorites.length >= MAX_FAVORITES) {
      setNotice(`В избранном может быть не больше ${MAX_FAVORITES} городов`);
    } else {
      setFavorites([...favorites, place]);
      setNotice(`${place.name} добавлен в избранное`);
    }
  }

  // Фон страницы и заголовок вкладки зависят от погоды.
  const loaded = state.status === 'success' ? state.data.current : null;
  useEffect(() => {
    if (!loaded) return;
    document.body.dataset.weather = getWeatherInfo(loaded.code, loaded.isDay).theme;
    document.title = `${formatTemp(loaded.temp)} ${place.name} — Погода`;
  }, [loaded, place.name]);

  // Для скринридеров: что сейчас происходит.
  const liveMessage =
    notice ||
    (state.status === 'loading'
      ? `Загружаем прогноз для города ${place.name}…`
      : state.status === 'error'
        ? 'Не удалось загрузить прогноз'
        : `${place.name}: ${formatTemp(state.data.current.temp)}, ${getWeatherInfo(state.data.current.code, state.data.current.isDay).label}`);

  return (
    <>
      <a className="skip-link" href="#main">Перейти к прогнозу</a>

      <Header
        units={units}
        locating={geo.pending}
        onSelectPlace={selectPlace}
        onLocate={geo.locate}
        onUnitsChange={setUnits}
        onToggleTheme={toggleTheme}
      />

      <main id="main" className="container" tabIndex={-1}>
        <Favorites
          favorites={favorites}
          activeId={placeId(place)}
          onSelect={selectPlace}
          onRemove={(fav) => setFavorites(favorites.filter((f) => placeId(f) !== placeId(fav)))}
        />

        <p className="sr-only" role="status" aria-live="polite">{liveMessage}</p>

        {geo.error && (
          <ErrorCard title="Не удалось определить местоположение" message={geo.error} onRetry={geo.locate} />
        )}

        <div className="content" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && <Skeleton />}
          {state.status === 'error' && <ErrorCard message={state.message} onRetry={reload} />}
          {state.status === 'success' && (
            <>
              <CurrentWeather
                place={place}
                units={units}
                current={state.data.current}
                today={state.data.daily[0]!}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
              <HourlyForecast hourly={state.data.hourly} />
              <div className="grid">
                <DailyForecast daily={state.data.daily} />
                <WeatherDetails current={state.data.current} today={state.data.daily[0]!} units={units} />
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        Данные погоды:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a>
      </footer>
    </>
  );
}
