import { describe, expect, it } from 'vitest';
import { escapeHtml, formatChange, formatValue, latestChange, seriesStats } from './format';

const pts = (...values: number[]) =>
  values.map((value, i) => ({ time: String(2020 + i), order: String(2020 + i), value }));

describe('formatValue', () => {
  it('桁区切りと単位を付ける', () => {
    expect(formatValue(12610, '万人')).toBe('12,610 万人');
    expect(formatValue(2.6, '%')).toBe('2.6 %');
    expect(formatValue(100, '')).toBe('100');
  });
});

describe('latestChange / formatChange', () => {
  it('直近2点の差分と変化率を求める', () => {
    const change = latestChange(pts(100, 110));
    expect(change).toEqual({ diff: 10, rate: 0.1 });
    expect(formatChange(change)).toBe('+10(+10.0%)');
  });

  it('減少はマイナス表記になる', () => {
    expect(formatChange(latestChange(pts(110, 100)))).toBe('-10(-9.1%)');
  });

  it('1点以下では変化なし', () => {
    expect(latestChange(pts(100))).toBeNull();
    expect(formatChange(null)).toBe('');
  });
});

describe('seriesStats', () => {
  it('最小・最大・平均・最新を求める', () => {
    expect(seriesStats(pts(100, 120, 80, 110))).toEqual({
      min: 80,
      max: 120,
      mean: 102.5,
      latest: 110,
    });
  });

  it('1点でも成り立つ', () => {
    expect(seriesStats(pts(42))).toEqual({ min: 42, max: 42, mean: 42, latest: 42 });
  });

  it('空配列はnull', () => {
    expect(seriesStats([])).toBeNull();
  });
});

describe('escapeHtml', () => {
  it('HTML特殊文字を実体参照にする', () => {
    expect(escapeHtml('<a>&"')).toBe('&lt;a&gt;&amp;&quot;');
  });
});
