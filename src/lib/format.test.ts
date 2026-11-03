import { describe, expect, it } from 'vitest';
import {
  formatClock, formatDate, formatHourLabel, formatTemp, formatWeekday,
  hPaToMmHg, rangePosition, uvLabel, windDirection,
} from './format';

describe('formatTemp', () => {
  it('округляет и использует типографский минус', () => {
    expect(formatTemp(21.6)).toBe('22°');
    expect(formatTemp(-4.5)).toBe('−4°');
    expect(formatTemp(-12.2)).toBe('−12°');
    expect(formatTemp(0)).toBe('0°');
  });

  it('не показывает «−0°» и обрабатывает пустые значения', () => {
    expect(formatTemp(-0.4)).toBe('0°');
    expect(formatTemp(null)).toBe('—');
    expect(formatTemp(undefined)).toBe('—');
    expect(formatTemp(NaN)).toBe('—');
  });
});

describe('windDirection', () => {
  it('переводит градусы в стороны света', () => {
    expect(windDirection(0)).toBe('С');
    expect(windDirection(90)).toBe('В');
    expect(windDirection(180)).toBe('Ю');
    expect(windDirection(225)).toBe('ЮЗ');
    expect(windDirection(350)).toBe('С');
    expect(windDirection(360)).toBe('С');
    expect(windDirection(-90)).toBe('З');
    expect(windDirection(null)).toBe('');
  });
});

describe('давление', () => {
  it('нормальное давление ≈ 760 мм рт. ст.', () => {
    expect(hPaToMmHg(1013)).toBe(760);
    expect(hPaToMmHg(1000)).toBe(750);
  });
});

describe('время города', () => {
  it('берётся из строки, без сдвига часового пояса', () => {
    expect(formatClock('2026-10-05T14:30')).toBe('14:30');
    expect(formatHourLabel('2026-10-05T14:00', 0)).toBe('Сейчас');
    expect(formatHourLabel('2026-10-05T15:00', 1)).toBe('15:00');
  });

  it('formatWeekday: сегодня, завтра, затем дни недели', () => {
    expect(formatWeekday('2026-10-05', 0)).toBe('Сегодня');
    expect(formatWeekday('2026-10-06', 1)).toBe('Завтра');
    expect(formatWeekday('2026-10-07', 2)).toBe('Ср'); // 7 октября 2026 — среда
    expect(formatWeekday('2026-10-11', 6)).toBe('Вс');
  });

  it('formatDate выводит день и месяц по-русски', () => {
    expect(formatDate('2026-10-05T14:15')).toBe('5 октября');
  });
});

describe('uvLabel', () => {
  it('соответствует шкале ВОЗ', () => {
    expect(uvLabel(1)).toBe('Низкий');
    expect(uvLabel(4)).toBe('Умеренный');
    expect(uvLabel(7)).toBe('Высокий');
    expect(uvLabel(9)).toBe('Очень высокий');
    expect(uvLabel(12)).toBe('Экстремальный');
    expect(uvLabel(undefined)).toBe('Низкий');
  });
});

describe('rangePosition', () => {
  it('считает позицию полоски в процентах', () => {
    expect(rangePosition(0, 10, 0, 20)).toEqual({ left: 0, width: 50 });
    expect(rangePosition(10, 20, 0, 20)).toEqual({ left: 50, width: 50 });
  });

  it('не пропадает и не выходит за границы', () => {
    const same = rangePosition(5, 5, 5, 5); // нулевой диапазон недели — без NaN
    expect(Number.isFinite(same.left) && Number.isFinite(same.width)).toBe(true);

    const thin = rangePosition(20, 20, 0, 20);
    expect(thin.width).toBeGreaterThanOrEqual(6);
    expect(thin.left + thin.width).toBeLessThanOrEqual(100);
  });
});
