import type { Series } from './types';

const W = 720;
const H = 260;
const PAD = { top: 20, right: 16, bottom: 36, left: 56 };

// 系列の塗り分け。CSS側でライト・ダークに追従する基準色
export const SERIES_CLASSES = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

function niceStep(range: number): number {
  const rough = range / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  for (const m of [1, 2, 5, 10]) {
    if (rough <= m * power) return m * power;
  }
  return 10 * power;
}

/**
 * 複数系列の折れ線チャートSVGを生成する純関数。
 * x軸は全系列の時間ラベルの和集合(出現順)で割り付ける。
 */
export function renderLineChart(series: Series[], unit = ''): string {
  const drawable = series.filter((s) => s.points.length > 0).slice(0, SERIES_CLASSES.length);
  if (drawable.length === 0) {
    return (
      `<svg class="toukei-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
      `role="img" aria-label="データなし">` +
      `<text class="chart-empty" x="${W / 2}" y="${H / 2}" text-anchor="middle">表示できるデータがありません</text></svg>`
    );
  }

  const timeOrder: string[] = [];
  const timeIndex = new Map<string, number>();
  for (const s of drawable) {
    for (const p of s.points) {
      if (!timeIndex.has(p.order)) {
        timeIndex.set(p.order, timeOrder.length);
        timeOrder.push(p.time);
      }
    }
  }
  const count = timeOrder.length;
  const values = drawable.flatMap((s) => s.points.map((p) => p.value));
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;

  const x = (i: number) =>
    count <= 1 ? W / 2 : PAD.left + (i * (W - PAD.left - PAD.right)) / (count - 1);
  const y = (v: number) => PAD.top + ((max - v) * (H - PAD.top - PAD.bottom)) / (max - min);

  const grid: string[] = [];
  const step = niceStep(max - min);
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) {
    const ty = y(t);
    const label =
      Math.abs(t) >= 10000 ? t.toLocaleString('ja-JP') : String(Math.round(t * 100) / 100);
    grid.push(
      `<line class="chart-grid" x1="${PAD.left}" y1="${ty.toFixed(1)}" x2="${W - PAD.right}" y2="${ty.toFixed(1)}"/>`,
      `<text class="chart-tick" x="${PAD.left - 8}" y="${(ty + 4).toFixed(1)}" text-anchor="end">${label}</text>`,
    );
  }

  // x軸ラベルは詰まらないよう最大8個に間引く
  const labelEvery = Math.max(1, Math.ceil(count / 8));
  const xLabels = timeOrder
    .map((label, i) =>
      i % labelEvery === 0 || i === count - 1
        ? `<text class="chart-date" x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${label}</text>`
        : '',
    )
    .join('');

  // 単一系列のときだけ線の下を薄く塗る。多系列だと面が重なって読みにくい
  const areaFill = drawable.length === 1;
  const baseline = H - PAD.bottom;
  const lines = drawable
    .map((s, si) => {
      const cls = SERIES_CLASSES[si]!;
      const coords = s.points.map(
        (p) => [x(timeIndex.get(p.order)!), y(p.value)] as [number, number],
      );
      const pts = coords.map(([cx, cy]) => `${cx.toFixed(1)},${cy.toFixed(1)}`).join(' ');
      const first = coords[0]!;
      const last = coords[coords.length - 1]!;
      const area =
        areaFill && coords.length > 1
          ? `<path class="chart-area ${cls}" d="M${first[0].toFixed(1)} ${baseline}` +
            coords.map(([cx, cy]) => `L${cx.toFixed(1)} ${cy.toFixed(1)}`).join('') +
            `L${last[0].toFixed(1)} ${baseline}Z"/>`
          : '';
      const dots = s.points
        .map(
          (p) =>
            `<circle class="chart-dot ${cls}" cx="${x(timeIndex.get(p.order)!).toFixed(1)}" ` +
            `cy="${y(p.value).toFixed(1)}" r="3"><title>${s.label} ${p.time}: ${p.value.toLocaleString('ja-JP')}${unit}</title></circle>`,
        )
        .join('');
      // 最新点を強調する淡いハロー(点の数には数えない別要素)
      const halo = `<circle class="chart-last ${cls}" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="5.5"/>`;
      return `${area}<polyline class="chart-line ${cls}" points="${pts}"/>${halo}${dots}`;
    })
    .join('');

  return (
    `<svg class="toukei-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `role="img" aria-label="${drawable.map((s) => s.label).join('・')}の推移">` +
    `<g>${grid.join('')}</g>${lines}<g>${xLabels}</g>` +
    `</svg>`
  );
}
