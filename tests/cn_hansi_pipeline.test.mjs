import assert from 'node:assert/strict';
import test from 'node:test';

import { detectCategory, normalizeChineseForHanshinaru } from '../scripts/lib/cn_hansi_text_normalizer.mjs';
import { buildParseApiUrl, extractWikisourceTitle } from '../scripts/lib/cn_wikisource_api.mjs';
import { buildRecord } from '../scripts/lib/cn_wikisource_record_builder.mjs';

test('normalizes simplified and non-Korean variants to Hanshinaru Hanja style', () => {
  assert.equal(
    normalizeChineseForHanshinaru('汉诗 长乐 归来 万里 五言絕句'),
    '漢詩 長樂 歸來 萬里 五言絶句',
  );
});

test('detects Korean-style category label for jueju', () => {
  assert.equal(
    detectCategory('大風起兮雲飛揚\n威加海內兮歸故鄉\n安得猛士兮守四方'),
    null,
  );
  assert.equal(
    detectCategory('力拔山兮氣蓋世\n時不利兮騅不逝\n騅不逝兮可奈何\n虞兮虞兮奈若何'),
    null,
  );
  assert.equal(
    detectCategory('床前明月光\n疑是地上霜\n舉頭望明月\n低頭思故鄉'),
    '五言絶句',
  );
  assert.equal(
    detectCategory('煮豆燃豆萁\n豆在釜中泣\n本是同根生\n相煎何太急', { eraSlug: 'wei-jin' }),
    '五言古詩',
  );
});

test('builds a site-db friendly CN Wikisource record', () => {
  const record = buildRecord({
    recordId: 'CN-TEST-0001',
    canonicalId: 'CN-CANON-HAN-DAFENGGE',
    eraSlug: 'qian-han',
    eraPeriod: '兩漢',
    titleZh: '大风歌',
    titleKo: '대풍가',
    authorId: 'CN-AUTHOR-LIU-BANG',
    authorZh: '刘邦',
    authorKo: '유방',
    authorLife: 'BCE 256~BCE 195',
    authorSlug: 'liu-bang',
    collectionTitle: '古诗源',
    sourceUrl: 'https://zh.wikisource.org/wiki/古詩源',
    bodyZh: '大风起兮云飞扬\n威加海内兮归故乡\n安得猛士兮守四方',
    translationKoOwned: '큰 바람이 일고 구름이 날아오르네.',
  });

  assert.equal(record.title.zh, '大風歌');
  assert.equal(record.author.zh, '劉邦');
  assert.equal(record.sourceWork.collectionTitle, '古詩源');
  assert.equal(record.text.poemZh, '大風起兮雲飛揚\n威加海內兮歸故鄉\n安得猛士兮守四方');
  assert.equal(record.jdsCandidate.poet.country, 'CN');
  assert.equal(record.jdsCandidate.poem.status, 'translated');
  assert.equal(record.rights.originalText.sourcePolicyId, 'SRC-ZH-WIKISOURCE-TEXT');
});

test('builds stable Chinese Wikisource API URLs from source pages', () => {
  const title = extractWikisourceTitle('https://zh.wikisource.org/wiki/%E5%8F%A4%E8%A9%A9%E6%BA%90');
  assert.equal(title, '古詩源');

  const apiUrl = buildParseApiUrl(title);
  assert.equal(apiUrl.origin, 'https://zh.wikisource.org');
  assert.equal(apiUrl.pathname, '/w/api.php');
  assert.equal(apiUrl.searchParams.get('action'), 'parse');
  assert.equal(apiUrl.searchParams.get('page'), '古詩源');
  assert.equal(apiUrl.searchParams.get('formatversion'), '2');
});
