import { describe, expect, it } from 'vitest';
import { renderLineChart } from './chart';
import { snapshotDatasets } from './snapshot';
import type { Series } from './types';

const series = (label: string, values: [string, number][]): Series => ({
  label,
  points: values.map(([time, value]) => ({ time, order: time, value })),
});

describe('renderLineChart', () => {
  it('スケーラブルなSVG(viewBox指定)を返す', () => {
    const svg = renderLineChart([
      series('A', [
        ['2020', 10],
        ['2021', 12],
      ]),
    ]);
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 720 260"/);
    expect(svg).not.toMatch(/^<svg [^>]*width=/);
    expect(svg).toContain('aria-label="Aの推移"');
  });

  it('系列ごとに折れ線と点を塗り分ける', () => {
    const svg = renderLineChart([
      series('男', [
        ['2020', 100],
        ['2021', 90],
      ]),
      series('女', [
        ['2020', 110],
        ['2021', 105],
      ]),
    ]);
    expect(svg.match(/chart-line s0/g)).toHaveLength(1);
    expect(svg.match(/chart-line s1/g)).toHaveLength(1);
    expect(svg.match(/class="chart-dot/g)).toHaveLength(4);
  });

  it('点のtitleに系列名・時点・単位入りの値が入る', () => {
    const svg = renderLineChart([series('総人口', [['2020', 12610]])], '万人');
    expect(svg).toContain('<title>総人口 2020: 12,610万人</title>');
  });

  it('値が一定でも0除算せず描ける', () => {
    const svg = renderLineChart([
      series('一定', [
        ['2020', 5],
        ['2021', 5],
      ]),
    ]);
    expect(svg).toContain('chart-line');
  });

  it('時点が多いときはx軸ラベルを間引く', () => {
    const many = series(
      '長期',
      Array.from({ length: 30 }, (_, i) => [`${1991 + i}`, i] as [string, number]),
    );
    const svg = renderLineChart([many]);
    const labels = svg.match(/class="chart-date"/g) ?? [];
    expect(labels.length).toBeLessThanOrEqual(9);
  });

  it('空のデータは空状態の表示になる', () => {
    expect(renderLineChart([])).toContain('表示できるデータがありません');
    expect(renderLineChart([series('空', [])])).toContain('表示できるデータがありません');
  });

  it('同梱スナップショットはすべて描画できる', () => {
    for (const dataset of snapshotDatasets) {
      const svg = renderLineChart([{ label: dataset.name, points: dataset.points }], dataset.unit);
      expect(svg, dataset.id).toContain('chart-line');
    }
  });
});
