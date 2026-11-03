import { placeId } from '../lib/model';
import type { Place } from '../types';

interface Props {
  favorites: Place[];
  activeId: string;
  onSelect: (place: Place) => void;
  onRemove: (place: Place) => void;
}

export function Favorites({ favorites, activeId, onSelect, onRemove }: Props) {
  if (favorites.length === 0) return null;

  return (
    <nav className="favorites" aria-label="Избранные города">
      <ul className="chips">
        {favorites.map((place) => {
          const active = placeId(place) === activeId;
          return (
            <li key={placeId(place)} className={`chip${active ? ' is-active' : ''}`}>
              <button
                type="button"
                className="chip__main"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(place)}
              >
                {place.name}
              </button>
              <button
                type="button"
                className="chip__remove"
                aria-label={`Убрать ${place.name} из избранного`}
                onClick={() => onRemove(place)}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
