import type { Series, SeriesPoint, StatsTable } from './types';

const API_BASE = 'https://api.e-stat.go.jp/rest/3.0/app/json';

export interface StatsDataParams {
  /** 取得件数の上限。既定は1000 */
  limit?: number;
  /** 追加の絞り込み(cdCat01 など)をそのままクエリへ渡す */
  [key: string]: string | number | undefined;
}

/** getStatsData のURLを組み立てる。appIdは利用者自身のものを使う */
export function statsDataUrl(
  appId: string,
  statsDataId: string,
  params: StatsDataParams = {},
): string {
  const query = new URLSearchParams({ appId, statsDataId, limit: String(params.limit ?? 1000) });
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'limit' && value !== undefined) query.set(key, String(value));
  }
  return `${API_BASE}/getStatsData?${query.toString()}`;
}

// e-StatのJSONは要素が1件のとき配列にならないため、常に配列へそろえる
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

interface ClassItem {
  '@code': string;
  '@name': string;
}

interface ClassObj {
  '@id': string;
  '@name': string;
  CLASS: ClassItem | ClassItem[];
}

interface RawValue {
  [key: string]: string | undefined;
  $?: string;
}

/**
 * getStatsData のレスポンスを系列の集合へ整形する。
 * 時間軸(@time)を横軸に、それ以外の分類の組み合わせを系列名にする。
 */
export function parseStatsData(raw: unknown): StatsTable {
  const root = (raw as { GET_STATS_DATA?: Record<string, unknown> })?.GET_STATS_DATA;
  if (!root) throw new Error('e-Statのレスポンス形式が想定と異なる');
  const result = root.RESULT as { STATUS?: number; ERROR_MSG?: string } | undefined;
  if (!result || result.STATUS !== 0) {
    throw new Error(result?.ERROR_MSG ?? 'e-Stat APIがエラーを返した');
  }
  const data = root.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!data) throw new Error('STATISTICAL_DATAが含まれていない');

  const tableInf = data.TABLE_INF as Record<string, unknown> | undefined;
  const titleRaw = tableInf?.TITLE as { $?: string } | string | undefined;
  const title =
    typeof titleRaw === 'string'
      ? titleRaw
      : (titleRaw?.$ ?? String(tableInf?.STATISTICS_NAME ?? '無題の統計表'));
  const statName = (tableInf?.STAT_NAME as { $?: string } | undefined)?.$ ?? '';
  const orgName = (tableInf?.GOV_ORG as { $?: string } | undefined)?.$ ?? '';
  const source = [statName, orgName].filter(Boolean).join(' / ');

  const classInf = data.CLASS_INF as { CLASS_OBJ?: ClassObj | ClassObj[] } | undefined;
  const classObjs = asArray(classInf?.CLASS_OBJ);
  const nameOf = new Map<string, Map<string, string>>();
  for (const obj of classObjs) {
    const table = new Map<string, string>();
    for (const cls of asArray(obj.CLASS)) table.set(cls['@code'], cls['@name']);
    nameOf.set(obj['@id'], table);
  }
  const resolve = (id: string, code: string) => nameOf.get(id)?.get(code) ?? code;

  const dataInf = data.DATA_INF as { VALUE?: RawValue | RawValue[] } | undefined;
  const values = asArray(dataInf?.VALUE);
  const resultInf = data.RESULT_INF as { TOTAL_NUMBER?: number } | undefined;

  let unit = '';
  const seriesMap = new Map<string, Series>();
  for (const value of values) {
    const numeric = Number(value.$);
    if (!Number.isFinite(numeric)) continue;
    if (!unit && value['@unit']) unit = value['@unit'];
    const timeCode = value['@time'] ?? '';
    // 時間と単位以外の属性(@cat01、@areaなど)の名前を結合して系列名にする
    const labelParts: string[] = [];
    for (const [key, code] of Object.entries(value)) {
      if (key === '$' || key === '@time' || key === '@unit' || code === undefined) continue;
      labelParts.push(resolve(key.slice(1), code));
    }
    const label = labelParts.join(' / ') || '値';
    const point: SeriesPoint = {
      time: resolve('time', timeCode),
      order: timeCode,
      value: numeric,
    };
    const series = seriesMap.get(label);
    if (series) series.points.push(point);
    else seriesMap.set(label, { label, points: [point] });
  }

  const series = [...seriesMap.values()].map((s) => ({
    ...s,
    points: [...s.points].sort((a, b) => a.order.localeCompare(b.order)),
  }));

  return {
    title,
    unit,
    source,
    series,
    totalCount: resultInf?.TOTAL_NUMBER ?? values.length,
  };
}
