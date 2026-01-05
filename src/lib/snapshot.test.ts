import { describe, expect, it } from 'vitest';
import { snapshotDatasets } from './snapshot';

describe('同梱スナップショット', () => {
  it('4つの指標を持ち、idが一意', () => {
    expect(snapshotDatasets).toHaveLength(4);
    expect(new Set(snapshotDatasets.map((d) => d.id)).size).toBe(4);
  });

  it('各データセットは時系列順で2点以上、出典が書かれている', () => {
    for (const dataset of snapshotDatasets) {
      expect(dataset.points.length, dataset.id).toBeGreaterThanOrEqual(2);
      expect(dataset.source, dataset.id).toContain('概数');
      const orders = dataset.points.map((p) => p.order);
      expect([...orders].sort(), dataset.id).toEqual(orders);
    }
  });

  it('実勢の概形を持つ(人口ピークと近年の出生減)', () => {
    const population = snapshotDatasets.find((d) => d.id === 'population')!;
    const peak = population.points.reduce((a, b) => (b.value > a.value ? b : a));
    expect(peak.time).toBe('2010');
    const births = snapshotDatasets.find((d) => d.id === 'births')!;
    const last = births.points[births.points.length - 1]!;
    expect(last.value).toBeLessThan(100);
  });
});
