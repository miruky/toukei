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
import type { StatsTable } from './lib';

const APP_ID_KEY = 'toukei-app-id';
const STATS_ID_KEY = 'toukei-stats-id';

// ---- 同梱スナップショットのカード ----

const snapshotGrid = document.getElementById('snapshot-grid')!;

snapshotGrid.innerHTML = snapshotDatasets
  .map((dataset) => {
    const last = dataset.points[dataset.points.length - 1]!;
    const change = formatChange(latestChange(dataset.points));
    return (
      `<article class="card snapshot-card">` +
      `<h2>${escapeHtml(dataset.name)}</h2>` +
      `<p class="latest"><strong>${escapeHtml(formatValue(last.value, dataset.unit))}</strong>` +
      `<span class="latest-meta">${escapeHtml(last.time)}時点${change ? ` ・前回比 ${escapeHtml(change)}` : ''}</span></p>` +
      `<div class="chart-wrap">${renderLineChart([{ label: dataset.name, points: dataset.points }], dataset.unit)}</div>` +
      `<p class="source">${escapeHtml(dataset.source)}</p>` +
      `</article>`
    );
  })
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
