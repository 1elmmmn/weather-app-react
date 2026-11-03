import { UNITS } from '../lib/format';
import type { Place, UnitSystem } from '../types';
import { CitySearch } from './CitySearch';

interface Props {
  units: UnitSystem;
  locating: boolean;
  onSelectPlace: (place: Place) => void;
  onLocate: () => void;
  onUnitsChange: (units: UnitSystem) => void;
  onToggleTheme: () => void;
}

const UNIT_OPTIONS = Object.keys(UNITS) as UnitSystem[];

export function Header({ units, locating, onSelectPlace, onLocate, onUnitsChange, onToggleTheme }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span aria-hidden="true">🌤️</span>
        <span>Погода</span>
      </div>

      <CitySearch onSelect={onSelectPlace} />

      <div className="topbar__actions">
        <button
          type="button"
          className="icon-btn"
          aria-label="Определить моё местоположение"
          title="Моё местоположение"
          disabled={locating}
          onClick={onLocate}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
          </svg>
        </button>

        <div className="segmented" role="group" aria-label="Единицы измерения">
          {UNIT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === units}
              onClick={() => onUnitsChange(option)}
            >
              {UNITS[option].temp}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Переключить тему"
          title="Переключить тему"
          onClick={onToggleTheme}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
