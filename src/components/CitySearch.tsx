import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MIN_QUERY_LENGTH, useCitySearch } from '../hooks/useCitySearch';
import { searchCities } from '../lib/api';
import { placeId, placeSubtitle } from '../lib/model';
import type { Place } from '../types';

interface Props {
  onSelect: (place: Place) => void;
}

/** Поле поиска с подсказками по паттерну ARIA combobox. */
export function CitySearch({ onSelect }: Props) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const { places, failed, loading, settled } = useCitySearch(value);
  const expanded = open && value.trim().length >= MIN_QUERY_LENGTH;
  const activeIndex = active < places.length ? active : -1; // список мог стать короче
  const optionId = (index: number) => `${listId}-option-${index}`;

  function choose(place: Place) {
    setValue('');
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    onSelect(place);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && places.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((activeIndex + 1) % places.length);
    } else if (event.key === 'ArrowUp' && places.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((activeIndex - 1 + places.length) % places.length);
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      setOpen(false);
    }
  }

  /** Enter: выбрать подсвеченный вариант, иначе первый (если список ещё не пришёл — искать сразу). */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const chosen = places[activeIndex] ?? places[0];
    if (chosen) {
      choose(chosen);
      return;
    }
    if (value.trim().length < MIN_QUERY_LENGTH) return;
    try {
      const [first] = await searchCities(value);
      if (first) choose(first);
    } catch {
      /* ошибку покажет выпадающий список после обычного поиска */
    }
  }

  return (
    <form
      className="search"
      role="search"
      autoComplete="off"
      onSubmit={handleSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>Поиск города</label>
      <svg className="search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        className="search__input"
        type="search"
        placeholder="Найти город…"
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
        enterKeyHint="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {expanded && (
        <ul id={listId} className="suggestions" role="listbox" aria-label="Результаты поиска">
          {loading && <li className="suggestions__msg" role="presentation">Ищем…</li>}
          {failed && (
            <li className="suggestions__msg" role="presentation">
              Не удалось выполнить поиск. Попробуйте ещё раз.
            </li>
          )}
          {settled && !failed && places.length === 0 && (
            <li className="suggestions__msg" role="presentation">Ничего не найдено</li>
          )}
          {places.map((place, index) => (
            <li
              key={`${placeId(place)}-${index}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={`suggestions__item${index === activeIndex ? ' is-active' : ''}`}
              onMouseDown={(event) => event.preventDefault()} // не терять фокус input до click
              onClick={() => choose(place)}
            >
              <span className="suggestions__name">{place.name}</span>
              <span className="suggestions__sub">{placeSubtitle(place)}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
