import { describe, expect, it } from 'vitest';
import { parseStatsData, statsDataUrl } from './estat';

// getStatsData(3.0)の公開仕様に沿ったレスポンス。
// 要素が1件のとき配列にならない癖(CLASS等)を意図的に含める。
const okResponse = {
  GET_STATS_DATA: {
    RESULT: { STATUS: 0, ERROR_MSG: '正常に終了しました。' },
    STATISTICAL_DATA: {
      RESULT_INF: { TOTAL_NUMBER: 6 },
      TABLE_INF: {
        TITLE: { $: '年次別人口', '@no': '1' },
        STAT_NAME: { $: '人口推計', '@code': '00200524' },
        GOV_ORG: { $: '総務省', '@code': '00200' },
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            '@id': 'cat01',
            '@name': '男女別',
            CLASS: [
              { '@code': '001', '@name': '男' },
              { '@code': '002', '@name': '女' },
            ],
          },
          {
            '@id': 'area',
            '@name': '地域',
            CLASS: { '@code': '00000', '@name': '全国' },
          },
          {
            '@id': 'time',
            '@name': '時間軸',
            CLASS: [
              { '@code': '2020000000', '@name': '2020年' },
              { '@code': '2021000000', '@name': '2021年' },
              { '@code': '2022000000', '@name': '2022年' },
            ],
          },
        ],
      },
      DATA_INF: {
        VALUE: [
          { '@cat01': '001', '@area': '00000', '@time': '2021000000', '@unit': '千人', $: '61019' },
          { '@cat01': '001', '@area': '00000', '@time': '2020000000', '@unit': '千人', $: '61350' },
          { '@cat01': '002', '@area': '00000', '@time': '2020000000', '@unit': '千人', $: '64797' },
          { '@cat01': '002', '@area': '00000', '@time': '2021000000', '@unit': '千人', $: '64483' },
          { '@cat01': '001', '@area': '00000', '@time': '2022000000', '@unit': '千人', $: '60758' },
          { '@cat01': '002', '@area': '00000', '@time': '2022000000', '@unit': '千人', $: '***' },
        ],
      },
    },
  },
};

describe('statsDataUrl', () => {
  it('appIdと統計表IDからURLを組み立てる', () => {
    const url = statsDataUrl('MYKEY', '0003448237');
    expect(url).toContain('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?');
    expect(url).toContain('appId=MYKEY');
    expect(url).toContain('statsDataId=0003448237');
    expect(url).toContain('limit=1000');
  });

  it('絞り込みパラメータを引き渡せる', () => {
    const url = statsDataUrl('K', 'X', { limit: 50, cdCat01: '001' });
    expect(url).toContain('limit=50');
    expect(url).toContain('cdCat01=001');
  });
});

describe('parseStatsData', () => {
  const table = parseStatsData(okResponse);

  it('表題・出典・単位・件数を取り出す', () => {
    expect(table.title).toBe('年次別人口');
    expect(table.source).toBe('人口推計 / 総務省');
    expect(table.unit).toBe('千人');
    expect(table.totalCount).toBe(6);
  });

  it('時間軸以外の分類の組み合わせを系列にする', () => {
    expect(table.series.map((s) => s.label)).toEqual(['男 / 全国', '女 / 全国']);
  });

  it('系列内は時間コード順に並び、時間ラベルは名前に解決される', () => {
    const male = table.series[0]!;
    expect(male.points.map((p) => p.time)).toEqual(['2020年', '2021年', '2022年']);
    expect(male.points.map((p) => p.value)).toEqual([61350, 61019, 60758]);
  });

  it('数値でない値(秘匿の***など)は捨てる', () => {
    const female = table.series[1]!;
    expect(female.points).toHaveLength(2);
  });

  it('APIエラーはERROR_MSGの内容で例外にする', () => {
    const error = {
      GET_STATS_DATA: { RESULT: { STATUS: 100, ERROR_MSG: '認証に失敗しました。' } },
    };
    expect(() => parseStatsData(error)).toThrow('認証に失敗しました。');
  });

  it('想定外の形は例外にする', () => {
    expect(() => parseStatsData(null)).toThrow('形式');
    expect(() => parseStatsData({ GET_STATS_DATA: { RESULT: { STATUS: 0 } } })).toThrow(
      'STATISTICAL_DATA',
    );
  });
});
