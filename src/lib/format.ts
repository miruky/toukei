import type { SeriesPoint } from './types';

export function formatValue(value: number, unit: string): string {
  const text = Number.isInteger(value)
    ? value.toLocaleString('ja-JP')
    : value.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  return unit ? `${text} ${unit}` : text;
}

/** 直近2点の変化。データ1点以下なら null */
export function latestChange(points: SeriesPoint[]): { diff: number; rate: number } | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const diff = last.value - prev.value;
  return { diff, rate: prev.value === 0 ? 0 : diff / prev.value };
}

/** 系列の要約統計(最小・最大・平均・最新)。空配列なら null */
export function seriesStats(
  points: SeriesPoint[],
): { min: number; max: number; mean: number; latest: number } | null {
  if (points.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const p of points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
    sum += p.value;
  }
  return { min, max, mean: sum / points.length, latest: points[points.length - 1]!.value };
}

export function formatChange(change: { diff: number; rate: number } | null): string {
  if (!change) return '';
  const sign = change.diff > 0 ? '+' : '';
  const diff =
    Math.abs(change.diff) >= 100
      ? Math.round(change.diff).toLocaleString('ja-JP')
      : (Math.round(change.diff * 100) / 100).toString();
  return `${sign}${diff}(${sign}${(change.rate * 100).toFixed(1)}%)`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
