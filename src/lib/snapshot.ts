import type { SnapshotDataset } from './types';

// e-Stat収録統計の公表値を丸めた概数スナップショット。
// APIキーなしでもダッシュボードが成立するための同梱データで、
// 正確な値が必要なときはライブ取得か元統計を参照する。
const point = (time: string, value: number) => ({ time, order: time, value });

export const snapshotDatasets: SnapshotDataset[] = [
  {
    id: 'population',
    name: '総人口',
    unit: '万人',
    source: '国勢調査(総務省統計局)の概数',
    points: [
      point('1950', 8320),
      point('1955', 8930),
      point('1960', 9340),
      point('1965', 9830),
      point('1970', 10370),
      point('1975', 11190),
      point('1980', 11710),
      point('1985', 12100),
      point('1990', 12360),
      point('1995', 12560),
      point('2000', 12690),
      point('2005', 12780),
      point('2010', 12810),
      point('2015', 12710),
      point('2020', 12610),
    ],
  },
  {
    id: 'births',
    name: '出生数',
    unit: '万人',
    source: '人口動態統計(厚生労働省)の概数',
    points: [
      point('1950', 234),
      point('1960', 161),
      point('1970', 193),
      point('1980', 158),
      point('1990', 122),
      point('2000', 119),
      point('2010', 107),
      point('2015', 101),
      point('2020', 84),
      point('2023', 73),
    ],
  },
  {
    id: 'unemployment',
    name: '完全失業率',
    unit: '%',
    source: '労働力調査(総務省統計局)の概数',
    points: [
      point('1990', 2.1),
      point('1995', 3.2),
      point('2000', 4.7),
      point('2002', 5.4),
      point('2005', 4.4),
      point('2009', 5.1),
      point('2013', 4.0),
      point('2017', 2.8),
      point('2019', 2.4),
      point('2020', 2.8),
      point('2023', 2.6),
    ],
  },
  {
    id: 'cpi',
    name: '消費者物価指数(総合)',
    unit: '2020年=100',
    source: '消費者物価指数(総務省統計局)の概数',
    points: [
      point('1990', 92.1),
      point('1995', 96.5),
      point('2000', 97.5),
      point('2005', 96.5),
      point('2010', 96.4),
      point('2015', 98.6),
      point('2020', 100.0),
      point('2021', 99.8),
      point('2022', 102.3),
      point('2023', 105.6),
      point('2024', 108.5),
    ],
  },
];
