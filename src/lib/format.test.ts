import { describe, expect, it } from 'vitest';
import { escapeHtml, formatChange, formatValue, latestChange } from './format';

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

describe('escapeHtml', () => {
  it('HTML特殊文字を実体参照にする', () => {
    expect(escapeHtml('<a>&"')).toBe('&lt;a&gt;&amp;&quot;');
  });
});
