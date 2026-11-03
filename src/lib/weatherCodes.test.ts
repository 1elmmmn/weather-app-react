import { describe, expect, it } from 'vitest';
import { getWeatherInfo } from './weatherCodes';

describe('getWeatherInfo', () => {
  it('известный код возвращает подпись, иконку и тему', () => {
    const info = getWeatherInfo(63, true);
    expect(info.label).toBe('Дождь');
    expect(info.theme).toBe('rain');
    expect(info.icon).toBeTruthy();
  });

  it('ночью ясная погода получает ночную иконку и тему', () => {
    const day = getWeatherInfo(0, true);
    const night = getWeatherInfo(0, false);
    expect(day.theme).toBe('clear');
    expect(night.theme).toBe('night');
    expect(night.icon).not.toBe(day.icon);
  });

  it('для кодов без ночной иконки используется дневная', () => {
    expect(getWeatherInfo(95, false).icon).toBe(getWeatherInfo(95, true).icon);
    expect(getWeatherInfo(95, false).theme).toBe('storm');
  });

  it('неизвестный код не ломает интерфейс', () => {
    const info = getWeatherInfo(12345);
    expect(info.label).toBe('Нет данных');
    expect(info.theme).toBe('cloudy');
  });
});
