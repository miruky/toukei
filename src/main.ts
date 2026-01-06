import './style.css';
import {
  escapeHtml,
  formatChange,
  formatValue,
  latestChange,
  parseStatsData,
  renderLineChart,
  snapshotDatasets,
  statsDataUrl,
} from './lib';
import type { SeriesPoint, StatsTable } from './lib';

const APP_ID_KEY = 'toukei-app-id';
const STATS_ID_KEY = 'toukei-stats-id';

// ---- 同梱スナップショットの指標 ----

const snapshotGrid = document.getElementById('snapshot-grid')!;

/** 直近の変化に応じた方向の矢印SVGと、増減のクラス名 */
function trend(change: { diff: number; rate: number } | null): { svg: string; cls: string } {
  if (change === null || change.diff === 0) {
    return {
      svg: '<svg class="trend-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      cls: '',
    };
  }
  const up = change.diff > 0;
  const d = up ? 'M2 8 6 4l4 4' : 'M2 4 6 8l4-4';
  return {
    svg: `<svg class="trend-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cls: up ? 'up' : 'down',
  };
}

function indicatorMarkup(
  name: string,
  unit: string,
  source: string,
  points: SeriesPoint[],
): string {
  const last = points[points.length - 1]!;
  const change = latestChange(points);
  const { svg, cls } = trend(change);
  const changeText = formatChange(change);
  const changeRow = changeText
    ? `<p class="indicator-change ${cls}">${svg}<span>${escapeHtml(changeText)} ・ 前回比</span></p>`
    : '';
  return (
    `<article class="indicator" data-reveal>` +
    `<p class="indicator-name">${escapeHtml(name)}</p>` +
    `<p class="indicator-value"><span class="num">${escapeHtml(formatValue(last.value, ''))}</span>` +
    `<span class="unit">${escapeHtml(unit)}</span></p>` +
    changeRow +
    `<div class="chart-wrap">${renderLineChart([{ label: name, points }], unit)}</div>` +
    `<p class="source">${escapeHtml(last.time)}時点 ・ ${escapeHtml(source)}</p>` +
    `</article>`
  );
}

snapshotGrid.innerHTML = snapshotDatasets
  .map((d) => indicatorMarkup(d.name, d.unit, d.source, d.points))
  .join('');

// ---- e-Statライブ取得 ----

const liveForm = document.getElementById('live-form') as HTMLFormElement;
const appIdInput = document.getElementById('app-id') as HTMLInputElement;
const statsIdInput = document.getElementById('stats-data-id') as HTMLInputElement;
const liveResult = document.getElementById('live-result')!;

appIdInput.value = localStorage.getItem(APP_ID_KEY) ?? '';
statsIdInput.value = localStorage.getItem(STATS_ID_KEY) ?? '';

function renderTable(table: StatsTable): void {
  const shown = table.series.slice(0, 6);
  const truncated = table.series.length > shown.length;
  const legend = shown
    .map(
      (s, i) =>
        `<li><span class="legend-chip s${i}"></span>${escapeHtml(s.label)}(${s.points.length}点)</li>`,
    )
    .join('');
  liveResult.innerHTML =
    `<h3>${escapeHtml(table.title)}</h3>` +
    `<p class="live-meta">${escapeHtml(table.source)} ・ 全${table.totalCount.toLocaleString('ja-JP')}件` +
    `${table.unit ? ` ・ 単位: ${escapeHtml(table.unit)}` : ''}</p>` +
    `<ul class="legend">${legend}</ul>` +
    (truncated
      ? `<p class="live-meta">系列が多いため先頭6系列のみ描画しています。cdCat01などの絞り込みは今後の課題です。</p>`
      : '') +
    `<div class="chart-wrap">${renderLineChart(table.series, table.unit)}</div>`;
}

liveForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const appId = appIdInput.value.trim();
  const statsDataId = statsIdInput.value.trim();
  if (!appId || !statsDataId) return;
  liveResult.innerHTML = '<p class="status">取得中...</p>';
  void (async () => {
    try {
      const res = await fetch(statsDataUrl(appId, statsDataId));
      if (!res.ok) throw new Error(`取得に失敗 (${res.status})`);
      const table = parseStatsData(await res.json());
      localStorage.setItem(APP_ID_KEY, appId);
      localStorage.setItem(STATS_ID_KEY, statsDataId);
      renderTable(table);
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得に失敗しました';
      liveResult.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
    }
  })();
});

// ---- 配色テーマ ----

const THEME_KEY = 'toukei-theme';
const themeToggle = document.getElementById('theme-toggle')!;

function applyTheme(theme: string | null): void {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

themeToggle.addEventListener('click', () => {
  const current =
    document.documentElement.getAttribute('data-theme') ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(localStorage.getItem(THEME_KEY));

// ---- スクロール出現(reduced-motionでは即表示) ----

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealEls = [...document.querySelectorAll('[data-reveal]')];
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
  );
  for (const el of revealEls) io.observe(el);
} else {
  for (const el of revealEls) el.classList.add('is-visible');
}
