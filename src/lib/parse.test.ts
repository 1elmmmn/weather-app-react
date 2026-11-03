import { describe, expect, it } from 'vitest';
import { DEFAULT_PLACE, MAX_FAVORITES, parseFavorites, parsePlace, parseTheme, parseUnits } from './parse';

const kazan = { name: 'Казань', region: 'Татарстан', country: 'Россия', latitude: 55.79, longitude: 49.12 };

describe('parsePlace', () => {
  it('принимает корректное место', () => {
    expect(parsePlace(kazan)).toEqual(kazan);
  });

  it('достраивает отсутствующие необязательные поля', () => {
    expect(parsePlace({ name: 'Х', latitude: 1, longitude: 2 })).toEqual({
      name: 'Х', region: '', country: '', latitude: 1, longitude: 2,
    });
  });

  it.each([
    ['null', null],
    ['строка', 'Москва'],
    ['имя не строка', { name: 5, latitude: 1, longitude: 2 }],
    ['координаты строками', { name: 'Х', latitude: '1', longitude: '2' }],
    ['NaN', { name: 'Х', latitude: NaN, longitude: 2 }],
  ])('мусор (%s) заменяется местом по умолчанию', (_, value) => {
    expect(parsePlace(value)).toEqual(DEFAULT_PLACE);
  });
});

describe('parseFavorites', () => {
  it('отбрасывает некорректные элементы', () => {
    expect(parseFavorites([kazan, null, { name: 'Х' }, 7])).toEqual([kazan]);
  });

  it('не принимает не-массив и ограничивает длину', () => {
    expect(parseFavorites({ kazan })).toEqual([]);
    expect(parseFavorites(Array.from({ length: 20 }, () => kazan))).toHaveLength(MAX_FAVORITES);
  });
});

describe('parseUnits и parseTheme', () => {
  it('допускают только известные значения', () => {
    expect(parseUnits('imperial')).toBe('imperial');
    expect(parseUnits('kelvin')).toBe('metric');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('blue')).toBeNull();
    expect(parseTheme(undefined)).toBeNull();
  });
});
