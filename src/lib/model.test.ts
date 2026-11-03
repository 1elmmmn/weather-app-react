import { describe, expect, it } from 'vitest';
import { makeRawForecast } from '../test/fixtures';
import { normalizeForecast, pickHourly, placeId, placeSubtitle } from './model';

describe('placeId', () => {
  it('округляет координаты', () => {
    expect(placeId({ latitude: 55.7558, longitude: 37.6173 })).toBe('55.76,37.62');
    expect(placeId({ latitude: 55.7561, longitude: 37.6171 })).toBe(
      placeId({ latitude: 55.7558, longitude: 37.6173 }),
    );
  });
});

describe('placeSubtitle', () => {
  const base = { latitude: 0, longitude: 0 };

  it('не повторяет название города', () => {
    expect(placeSubtitle({ ...base, name: 'Москва', region: 'Москва', country: 'Россия' })).toBe('Россия');
    expect(placeSubtitle({ ...base, name: 'Казань', region: 'Татарстан', country: 'Россия' })).toBe('Татарстан, Россия');
    expect(placeSubtitle({ ...base, name: 'Х', region: '', country: '' })).toBe('');
  });
});

describe('pickHourly', () => {
  it('начинает с текущего часа и берёт 24 значения', () => {
    const { hourly, current } = makeRawForecast();
    const result = pickHourly(hourly, current.time, 24);

    expect(result).toHaveLength(24);
    expect(result[0]?.time).toBe('2026-10-05T14:00');
    expect(result[23]?.time).toBe('2026-10-06T13:00');
  });

  it('не выходит за пределы массива', () => {
    const { hourly } = makeRawForecast();
    expect(pickHourly(hourly, '2026-10-06T20:30', 24)).toHaveLength(4); // 20:00…23:00
  });

  it('если текущий час не найден, начинает с начала', () => {
    const { hourly } = makeRawForecast();
    const result = pickHourly(hourly, '2030-01-01T00:00', 3);
    expect(result[0]?.time).toBe('2026-10-05T00:00');
    expect(result).toHaveLength(3);
  });
});

describe('normalizeForecast', () => {
  it('приводит ответ API к модели интерфейса', () => {
    const data = normalizeForecast(makeRawForecast());

    expect(data.current).toMatchObject({ temp: 12.4, feelsLike: 10.1, isDay: true, windDir: 225 });
    expect(data.hourly).toHaveLength(24);
    expect(data.daily).toHaveLength(7);
    expect(data.daily[0]).toEqual({
      date: '2026-10-05',
      code: 61,
      max: 14,
      min: 4,
      sunrise: '2026-10-05T06:48',
      sunset: '2026-10-05T18:12',
      uv: 2.4,
      precip: 0,
    });
  });

  it('бросает ошибку на некорректном ответе', () => {
    expect(() => normalizeForecast(null)).toThrow(/неожиданный ответ/);
    expect(() => normalizeForecast({})).toThrow(/неожиданный ответ/);
    expect(() => normalizeForecast({ current: {}, hourly: {}, daily: {} })).toThrow(/неожиданный ответ/);
  });
});
