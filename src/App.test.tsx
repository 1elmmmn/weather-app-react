import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { jsonResponse, makeRawForecast } from './test/fixtures';

const KAZAN = { name: 'Казань', admin1: 'Татарстан', country: 'Россия', latitude: 55.79, longitude: 49.12 };
const EVIL = { name: '<img src=x onerror=alert(1)>', country: 'Хакерляндия', latitude: 1, longitude: 2 };

/** Подставляет fetch для трёх сервисов; возвращает инструменты для проверок. */
function mockApi() {
  const urls: string[] = [];
  let forecastStatus = 200;

  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    if (url.includes('geocoding-api')) return jsonResponse({ results: [KAZAN, EVIL] });
    if (url.includes('bigdatacloud')) return jsonResponse({ city: 'Казань', principalSubdivision: 'Татарстан', countryName: 'Россия' });
    return jsonResponse(makeRawForecast(), forecastStatus);
  }));

  return { urls, setForecastStatus: (status: number) => { forecastStatus = status; } };
}

const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

describe('App', () => {
  it('показывает прогноз для Москвы по умолчанию', async () => {
    mockApi();
    render(<App />);

    expect(await heading('Москва')).toBeInTheDocument();
    expect(screen.getByText('Пасмурно')).toBeInTheDocument();
    expect(screen.getByText(/5 октября, 14:15/)).toBeInTheDocument();

    expect(within(screen.getByRole('region', { name: 'Почасовой прогноз' })).getAllByRole('listitem')).toHaveLength(24);
    expect(within(screen.getByRole('region', { name: 'Прогноз на 7 дней' })).getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText('756 мм рт. ст.')).toBeInTheDocument();
    expect(document.body.dataset.weather).toBe('cloudy');
    expect(document.title).toBe('12° Москва — Погода');
  });

  it('показывает скелетон во время загрузки', () => {
    mockApi();
    const { container } = render(<App />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
    expect(container.querySelector('.content')).toHaveAttribute('aria-busy', 'true');
  });

  it('ищет город, показывает подсказки и выбирает с клавиатуры', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await heading('Москва');

    const input = screen.getByRole('combobox', { name: 'Поиск города' });
    await user.type(input, 'каз');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowDown}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id);

    await user.keyboard('{Enter}');
    expect(await heading('Казань')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('выбирает город кликом по подсказке', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await heading('Москва');

    await user.type(screen.getByRole('combobox'), 'каз');
    await user.click((await screen.findAllByRole('option'))[0]!);

    expect(await heading('Казань')).toBeInTheDocument();
  });

  it('не интерпретирует HTML из ответа API', async () => {
    mockApi();
    const user = userEvent.setup();
    const { container } = render(<App />);
    await heading('Москва');

    await user.type(screen.getByRole('combobox'), 'каз');
    const options = await screen.findAllByRole('option');

    expect(options[1]).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(container.querySelector('img')).toBeNull();
  });

  it('сообщает, если ничего не найдено', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('combobox'), 'ыыы');
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('добавляет город в избранное, сохраняет и удаляет', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await heading('Москва');

    const star = screen.getByRole('button', { name: 'Избранное' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    await user.click(star);

    expect(star).toHaveAttribute('aria-pressed', 'true');
    const favorites = screen.getByRole('navigation', { name: 'Избранные города' });
    expect(within(favorites).getByRole('button', { name: 'Москва' })).toHaveAttribute('aria-current', 'true');
    expect(JSON.parse(localStorage.getItem('weather-app:favorites') ?? '[]')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Убрать Москва из избранного' }));
    expect(screen.queryByRole('navigation', { name: 'Избранные города' })).not.toBeInTheDocument();
    expect(star).toHaveAttribute('aria-pressed', 'false');
  });

  it('переключает единицы измерения и перезагружает прогноз', async () => {
    const api = mockApi();
    const user = userEvent.setup();
    render(<App />);
    await heading('Москва');

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    await heading('Москва');
    expect(api.urls.at(-1)).toMatch(/temperature_unit=fahrenheit/);
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(localStorage.getItem('weather-app:units')).toBe('"imperial"');
  });

  it('показывает ошибку и позволяет повторить запрос', async () => {
    const api = mockApi();
    api.setForecastStatus(503);
    const user = userEvent.setup();
    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Не удалось загрузить прогноз');
    expect(alert).toHaveTextContent('503');

    api.setForecastStatus(200);
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(await heading('Москва')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('восстанавливает последний город из localStorage', async () => {
    mockApi();
    localStorage.setItem('weather-app:place', JSON.stringify({
      name: 'Казань', region: 'Татарстан', country: 'Россия', latitude: 55.79, longitude: 49.12,
    }));
    render(<App />);
    expect(await heading('Казань')).toBeInTheDocument();
  });

  it('игнорирует испорченные данные в localStorage', async () => {
    mockApi();
    localStorage.setItem('weather-app:place', JSON.stringify({ name: 5, latitude: 'x' }));
    localStorage.setItem('weather-app:favorites', '{не json');
    localStorage.setItem('weather-app:units', '"kelvin"');
    render(<App />);

    expect(await heading('Москва')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('переключает тему и запоминает выбор', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await heading('Москва');

    // Системная тема в тестах тёмная, поэтому первое нажатие включает светлую.
    await user.click(screen.getByRole('button', { name: 'Переключить тему' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('weather-app:theme')).toBe('"light"');

    await user.click(screen.getByRole('button', { name: 'Переключить тему' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  describe('геолокация', () => {
    it('определяет город по координатам', async () => {
      mockApi();
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (ok: PositionCallback) =>
            ok({ coords: { latitude: 55.79, longitude: 49.12 } } as GeolocationPosition),
        },
      });
      const user = userEvent.setup();
      render(<App />);
      await heading('Москва');

      await user.click(screen.getByRole('button', { name: 'Определить моё местоположение' }));
      expect(await heading('Казань')).toBeInTheDocument();
    });

    it('объясняет, что делать при отказе в доступе', async () => {
      mockApi();
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) =>
            fail({ code: 1 } as GeolocationPositionError),
        },
      });
      const user = userEvent.setup();
      render(<App />);
      await heading('Москва');

      await user.click(screen.getByRole('button', { name: 'Определить моё местоположение' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Доступ к геолокации запрещён');
      // прогноз при этом остаётся на экране
      expect(screen.getByRole('heading', { level: 1, name: 'Москва' })).toBeInTheDocument();
    });
  });
});
