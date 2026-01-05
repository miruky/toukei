/** 時系列の1点。timeは表示用ラベル、orderは並び替え用のキー */
export interface SeriesPoint {
  time: string;
  order: string;
  value: number;
}

/** 可視化の単位となる1系列 */
export interface Series {
  label: string;
  points: SeriesPoint[];
}

/** getStatsData 1表分を整形した結果 */
export interface StatsTable {
  title: string;
  unit: string;
  /** 統計の出典(政府統計名・提供組織) */
  source: string;
  series: Series[];
  /** APIが返した総データ件数 */
  totalCount: number;
}

/** 同梱スナップショットのデータセット */
export interface SnapshotDataset {
  id: string;
  name: string;
  unit: string;
  /** 元の統計と注記 */
  source: string;
  points: SeriesPoint[];
}
