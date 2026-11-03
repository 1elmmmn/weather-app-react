import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, makeRawForecast } from '../test/fixtures';
import { ApiError, getForecast, reverseGeocode, searchCities } from './api';

const moscow = { latitude: 55.7558, longitude: 37.6173 };

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => handler(String(input)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const urlOf = (fetchMock: ReturnType<typeof mockFetch>, call = 0) => new URL(String(fetchMock.mock.calls[call]?.[0]));

describe('searchCities', () => {
  it('не ходит в сеть при коротком запросе', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}));
    expect(await searchCities('м')).toEqual([]);
    expect(await searchCities('   ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('формирует запрос и нормализует результат', async () => {
    const fetchMock = mockFetch(() => jsonResponse({
      results: [
        { name: 'Москва', admin1: 'Москва', country: 'Россия', latitude: 55.75, longitude: 37.62 },
        { name: 'Moscow', latitude: 46.73, longitude: -117 },
      ],
    }));

    const cities = await searchCities('  Москва ');
    const url = urlOf(fetchMock);

    expect(url.hostname).toBe('geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('Москва');
    expect(url.searchParams.get('language')).toBe('ru');
    expect(cities[0]).toEqual({ name: 'Москва', region: 'Москва', country: 'Россия', latitude: 55.75, longitude: 37.62 });
    expect(cities[1]?.region).toBe('');
  });

  it('возвращает [] если ничего не найдено', async () => {
    mockFetch(() => jsonResponse({ generationtime_ms: 0.4 })); // API не присылает results
    expect(await searchCities('ыыыыы')).toEqual([]);
  });
});

describe('getForecast', () => {
  it('передаёт координаты и единицы измерения', async () => {
    const fetchMock = mockFetch(() => jsonResponse(makeRawForecast()));
    await getForecast(moscow, 'imperial');
    const url = urlOf(fetchMock);

    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('55.7558');
    expect(url.searchParams.get('longitude')).toBe('37.6173');
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(url.searchParams.get('wind_speed_unit')).toBe('mph');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('7');
  });

  it('возвращает нормализованную модель', async () => {
    mockFetch(() => jsonResponse(makeRawForecast()));
    const data = await getForecast(moscow, 'metric');
    expect(data.daily).toHaveLength(7);
    expect(data.hourly).toHaveLength(24);
    expect(data.current.temp).toBe(12.4);
  });

  it('кэширует ответ, но отдельно для каждых единиц', async () => {
    const fetchMock = mockFetch(() => jsonResponse(makeRawForecast()));

    await getForecast(moscow, 'metric');
    await getForecast(moscow, 'metric');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await getForecast(moscow, 'imperial');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('HTTP-ошибка превращается в ApiError со статусом', async () => {
    mockFetch(() => jsonResponse({}, 503));
    await expect(getForecast(moscow, 'metric')).rejects.toMatchObject({ name: 'ApiError', status: 503 });
  });

  it('ошибка в ответе не попадает в кэш', async () => {
    mockFetch(() => jsonResponse({}, 500));
    await expect(getForecast(moscow, 'metric')).rejects.toBeInstanceOf(ApiError);

    mockFetch(() => jsonResponse(makeRawForecast()));
    expect((await getForecast(moscow, 'metric')).daily).toHaveLength(7);
  });

  it('сетевой сбой превращается в понятный ApiError', async () => {
    mockFetch(() => { throw new TypeError('Failed to fetch'); });
    await expect(getForecast(moscow, 'metric')).rejects.toThrow(/соединения/);
  });

  it('AbortError пробрасывается как есть и не считается ошибкой сервиса', async () => {
    mockFetch(() => { throw new DOMException('Aborted', 'AbortError'); });
    await expect(getForecast(moscow, 'metric')).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('reverseGeocode', () => {
  it('возвращает null при ошибке, а не бросает исключение', async () => {
    mockFetch(() => jsonResponse({}, 500));
    expect(await reverseGeocode(55.75, 37.62)).toBeNull();
  });

  it('достаёт город из ответа', async () => {
    mockFetch(() => jsonResponse({ city: 'Казань', principalSubdivision: 'Татарстан', countryName: 'Россия' }));
    expect(await reverseGeocode(55.79, 49.12)).toEqual({ name: 'Казань', region: 'Татарстан', country: 'Россия' });
  });
});
