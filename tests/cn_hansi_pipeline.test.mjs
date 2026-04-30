import assert from 'node:assert/strict';
import test from 'node:test';

import { detectCategory, normalizeChineseForHanshinaru } from '../scripts/lib/cn_hansi_text_normalizer.mjs';
import { buildCuratedDryRun } from '../scripts/lib/cn_curated_payload_builder.mjs';
import { buildPreTangDryRun } from '../scripts/lib/cn_pre_tang_db_payload_builder.mjs';
import { buildParseApiUrl, buildWikisourcePageUrl, extractWikisourceTitle } from '../scripts/lib/cn_wikisource_api.mjs';
import { buildCandidateRecord, extractCandidatePoemBody } from '../scripts/lib/cn_wikisource_candidate_extractor.mjs';
import { buildRecord } from '../scripts/lib/cn_wikisource_record_builder.mjs';

test('normalizes simplified and non-Korean variants to Hanshinaru Hanja style', () => {
  assert.equal(
    normalizeChineseForHanshinaru('汉诗 长乐 归来 万里 五言絕句'),
    '漢詩 長樂 歸來 萬里 五言絶句',
  );
  assert.equal(normalizeChineseForHanshinaru('登岳阳楼 欧阳玄'), '登嶽陽樓 歐陽玄');
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
  assert.equal(
    buildWikisourcePageUrl('七夕 (楊樸)'),
    'https://zh.wikisource.org/wiki/%E4%B8%83%E5%A4%95_(%E6%A5%8A%E6%A8%B8)',
  );
});

test('extracts candidate poem text from Wikisource HTML noise', () => {
  const html = `
    <table><tr><td>導航雜訊</td></tr></table>
    <div><p>未會牽牛意若何，須邀織女弄金梭。</p>
    <p>年年乞與人間巧，不道人間巧已多。</p></div>
    <div class="printfooter">取自維基文庫</div>
  `;
  assert.equal(
    extractCandidatePoemBody(html),
    '未會牽牛意若何，\n須邀織女弄金梭。\n年年乞與人間巧，\n不道人間巧已多。',
  );

  const record = buildCandidateRecord({
    eraSlug: 'song',
    pageid: 158917,
    rawTitle: '七夕 (楊樸)',
    normalizedTitle: '七夕',
    authorHint: '楊樸',
    categoryTitle: 'Category:宋詩',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E4%B8%83%E5%A4%95_(%E6%A5%8A%E6%A8%B8)',
    fetchStatus: 'ok',
    html,
  }, 0);

  assert.equal(record.author.zh, '楊樸');
  assert.equal(record.text.poemZh.includes('导航'), false);
  assert.equal(record.jdsCandidate.poem.category, '七言絶句');
  assert.equal(record.extraction.status, 'auto-extracted');
});

test('splits unpunctuated joined regulated verse lines conservatively', () => {
  const html = `
    <poem>
    無花無酒過清明興味蕭然似野僧
    昨日鄰家乞新火曉窓分與讀書燈
    </poem>
  `;

  assert.equal(
    extractCandidatePoemBody(html),
    '無花無酒過清明\n興味蕭然似野僧\n昨日鄰家乞新火\n曉窓分與讀書燈',
  );
});

test('drops Wikisource section headings from candidate poem text', () => {
  assert.equal(
    extractCandidatePoemBody('<div>===其一===</div><poem>梅雪爭春未肯降騷人擱筆費評章</poem>'),
    '梅雪爭春未肯降\n騷人擱筆費評章',
  );
});

test('builds Supabase curated dry-run payloads with provisional ids', () => {
  const raw = {
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
    commentaryKoOwned: '짧은 제왕시다.',
  };
  const first = buildRecord(raw);
  const second = buildRecord({
    ...raw,
    recordId: 'CN-TEST-0002',
    canonicalId: 'CN-CANON-HAN-DAFENGGE-2',
    titleZh: '大风歌 二',
    titleKo: '대풍가 2',
  });

  const dryRun = buildCuratedDryRun([first, second]);
  assert.equal(dryRun.summary.poets, 1);
  assert.equal(dryRun.summary.poems, 2);
  assert.equal(dryRun.curatedPoets[0].jds_id, -900001);
  assert.equal(dryRun.curatedPoems[0].poet_jds_id, -900001);
  assert.equal(dryRun.curatedPoems[0].body_zh.includes('风'), false);
});

test('builds pre-Tang source witness dry-run payloads without translation claims', () => {
  const dryRun = buildPreTangDryRun([
    {
      recordId: 'CN-PRETANG-CACHED-HAN-TEST',
      country: 'CN',
      eraSlug: 'han',
      title: { zh: '大風歌', ko: null },
      author: { zh: '劉邦', ko: null, life: 'BCE 256~BCE 195' },
      sourcePage: {
        title: '大風歌 (劉邦)',
        sourceUrl: 'https://zh.wikisource.org/wiki/大風歌_(劉邦)',
        section: '卷二漢詩',
        kind: 'gushiyuan-linked-dump-page',
      },
      text: {
        poemZh: '大風起兮{{另|雲|云}}飛揚\n威加海內兮歸故鄉\n安得猛士兮守四方',
        lineCount: 3,
        charCount: 26,
      },
      review: {
        status: 'needs-review',
        reasons: ['gushiyuan-linked-dump-page'],
      },
    },
  ]);

  assert.equal(dryRun.summary.records, 1);
  assert.equal(dryRun.summary.poets, 1);
  assert.equal(dryRun.summary.poems, 1);
  assert.equal(dryRun.curatedPoets[0].slug, 'cn-pretang-5289-90a6');
  assert.equal(dryRun.curatedPoems[0].status, 'parsed');
  assert.equal(dryRun.curatedPoems[0].quality, 'cn-pretang1');
  assert.equal(dryRun.curatedPoems[0].translation_ko, null);
  assert.equal(dryRun.curatedPoems[0].source_record_id, 'CN-PRETANG-CACHED-HAN-TEST');
  assert.equal(dryRun.curatedPoems[0].body_zh.includes('{{'), false);
  assert.match(dryRun.curatedPoems[0].body_zh, /大風起兮雲飛揚/);
});
