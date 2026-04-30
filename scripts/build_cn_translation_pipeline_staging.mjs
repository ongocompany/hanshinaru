#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { detectCategory, normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_RECORDS = resolve(ROOT, 'docs/spec/cn-translation-pipeline-staging.v1.json');
const OUT_REPORT = resolve(ROOT, 'docs/spec/cn-translation-pipeline-staging.report.v1.json');
const OUT_SQL_DIR = resolve(ROOT, 'docs/spec/cn-translation-pipeline-staging.jds-upsert');
const OUT_SQL_MANIFEST = resolve(OUT_SQL_DIR, 'manifest.json');
const SQL_CHUNK_SIZE = 80;

const sources = [
  {
    batch: 'pre-tang-first-tranche',
    path: 'docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json',
    records: readJson('docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json').records ?? [],
    select: () => true,
  },
  {
    batch: 'pre-tang-classic-index',
    path: 'docs/spec/cn-pre-tang-classic-index.extracted-records.v1.json',
    records: readJson('docs/spec/cn-pre-tang-classic-index.extracted-records.v1.json').records ?? [],
    select: () => true,
  },
  {
    batch: 'pre-tang-tao-yuanming',
    path: 'docs/spec/cn-pre-tang-high-yield.extracted-records.v1.json',
    records: readJson('docs/spec/cn-pre-tang-high-yield.extracted-records.v1.json').records ?? [],
    select: (record) => record.recordType === 'work' && record.sourceFamily === 'tao-yuanming',
  },
  {
    batch: 'song-yuan-ming-auto',
    path: 'docs/spec/cn-non-tang-candidate-records.v1.json',
    records: readJson('docs/spec/cn-non-tang-candidate-records.v1.json').records ?? [],
    select: (record) => record.extraction?.status === 'auto-extracted',
  },
];

const prepared = [];
const held = [];

for (const source of sources) {
  for (const record of source.records) {
    if (!source.select(record)) {
      held.push(heldRecord(source, record, 'not-selected-for-first-translation-pass'));
      continue;
    }
    const item = normalizeForTranslation(source, record);
    if (!item.bodyZh) {
      held.push(heldRecord(source, record, 'empty-body'));
      continue;
    }
    prepared.push(item);
  }
}

const unique = [];
const duplicateAliases = [];
const uniqueByText = new Map();
for (const item of prepared) {
  const key = translationKey(item);
  const existing = uniqueByText.get(key);
  if (existing) {
    existing.aliasRecordIds.push(item.sourceRecordId);
    duplicateAliases.push({
      duplicateRecordId: item.sourceRecordId,
      canonicalQueueId: existing.queueId,
      titleZh: item.titleZh,
      authorZh: item.authorZh,
      batch: item.batch,
    });
    continue;
  }
  uniqueByText.set(key, item);
  item.queueId = `CN-TR-${String(unique.length + 1).padStart(5, '0')}`;
  unique.push(item);
}

const generatedAt = new Date().toISOString();
const payload = {
  version: '2026-04-30.v1',
  batchId: 'cn-translation-pipeline-staging',
  generatedAt,
  decision: {
    translatorBackend: 'gemini',
    model: 'gemini-2.5-flash-lite',
    promptPath: 'pipeline/translate/prompts/v5_full.txt',
    reason: 'Existing JDS pipeline already supports Gemini/OpenAI-compatible API; Flash-Lite is the lowest-cost stable Google model suitable for high-volume first drafts.',
  },
  sources: sources.map(({ batch, path }) => ({ batch, path })),
  records: unique,
  duplicateAliases,
  held,
};
const report = {
  batchId: payload.batchId,
  generatedAt,
  summary: {
    sourceRecords: prepared.length + held.length,
    selectedRecords: prepared.length,
    translationQueue: unique.length,
    duplicateAliases: duplicateAliases.length,
    held: held.length,
    byEra: countBy(unique, (item) => item.eraSlug),
    byBatch: countBy(unique, (item) => item.batch),
    byStatus: countBy(unique, (item) => item.translationStatus),
    heldByBatch: countBy(held, (item) => item.batch),
    heldByReason: countBy(held, (item) => item.reason),
    heldByExtractionStatus: countBy(held, (item) => item.extractionStatus),
  },
  applyPolicy: [
    'SQL ends with ROLLBACK by default.',
    'Apply to JDS only after reviewing counts and switching ROLLBACK to COMMIT.',
    'Translation backend choice: Gemini gemini-2.5-flash-lite with JDS v5_full prompt for first-pass translation, reading, notes, and commentary.',
    'Records with non-Tang extraction status needs-review are held out of this first pass.',
  ],
};

writeJson(OUT_RECORDS, payload);
writeJson(OUT_REPORT, report);
const sqlParts = writeJdsSqlChunks(unique);

console.log(`wrote ${OUT_RECORDS}`);
console.log(`wrote ${OUT_REPORT}`);
console.log(`wrote ${OUT_SQL_DIR}`);
console.log(JSON.stringify(report.summary, null, 2));
console.log(JSON.stringify({ sqlParts: sqlParts.length }, null, 2));

function normalizeForTranslation(source, record) {
  const titleZh = normalizeChineseForHanshinaru(record.title?.zh ?? record.jdsCandidate?.poem?.title_zh ?? '').trim();
  const authorZh = normalizeChineseForHanshinaru(record.author?.zh ?? record.jdsCandidate?.poet?.name_zh ?? '佚名').trim();
  const bodyZh = normalizeBody(record.text?.poemZh ?? record.text?.textZh ?? record.jdsCandidate?.poem?.body_zh ?? '');
  const sourceRecordId = record.recordId ?? record.canonicalId ?? `${source.batch}-${prepared.length + 1}`;
  const eraSlug = record.eraSlug ?? eraSlugForEraPeriod(record.jdsCandidate?.poet?.era_period);
  const poetSlug = poetKeyFor(eraSlug, authorZh, record.jdsCandidate?.poet?.slug);
  const category = record.jdsCandidate?.poem?.category ?? detectCategory(bodyZh, { eraSlug });
  const sourceUrl = record.sourcePage?.sourceUrl
    ?? record.sourceWork?.sourceUrl
    ?? record.rights?.originalText?.sourceUrl
    ?? null;
  return {
    queueId: '',
    sourceRecordId,
    batch: source.batch,
    country: 'CN',
    eraSlug,
    eraPeriod: record.jdsCandidate?.poet?.era_period ?? eraPeriodFor(eraSlug),
    poetSlug,
    authorZh,
    authorKo: record.author?.ko ?? record.jdsCandidate?.poet?.name_ko ?? null,
    authorLife: record.author?.life ?? record.jdsCandidate?.poet?.life_raw ?? null,
    titleZh,
    titleKo: record.title?.ko ?? record.jdsCandidate?.poem?.title_ko ?? null,
    bodyZh,
    category,
    meter: record.jdsCandidate?.poem?.meter ?? null,
    sourceUrl,
    sourceKind: record.sourcePage?.kind ?? record.sourceWork?.collectionTitle ?? source.batch,
    reviewStatus: record.review?.status ?? record.extraction?.status ?? 'needs-review',
    reviewReasons: record.review?.reasons ?? record.extraction?.reviewReasons ?? [],
    translationStatus: 'parsed',
    quality: qualityFor(source.batch, record),
    aliasRecordIds: [sourceRecordId],
  };
}

function heldRecord(source, record, reason) {
  return {
    batch: source.batch,
    recordId: record.recordId ?? record.canonicalId ?? null,
    titleZh: record.title?.zh ?? record.jdsCandidate?.poem?.title_zh ?? null,
    authorZh: record.author?.zh ?? record.jdsCandidate?.poet?.name_zh ?? null,
    eraSlug: record.eraSlug ?? null,
    reason,
    extractionStatus: record.extraction?.status ?? null,
  };
}

function writeJdsSqlChunks(records) {
  rmSync(OUT_SQL_DIR, { recursive: true, force: true });
  mkdirSync(OUT_SQL_DIR, { recursive: true });
  const parts = [];
  const chunks = chunk(records, SQL_CHUNK_SIZE);
  chunks.forEach((items, index) => {
    const partNo = index + 1;
    const filename = `part-${String(partNo).padStart(3, '0')}.sql`;
    const path = resolve(OUT_SQL_DIR, filename);
    writeText(path, buildJdsSql(items, { partNo, totalParts: chunks.length }));
    parts.push({
      partNo,
      filename,
      records: items.length,
      queueStart: items[0]?.queueId ?? null,
      queueEnd: items.at(-1)?.queueId ?? null,
    });
  });
  writeJson(OUT_SQL_MANIFEST, {
    version: '2026-04-30.v1',
    batchId: 'cn-translation-pipeline-staging-jds-upsert',
    generatedAt,
    chunkSize: SQL_CHUNK_SIZE,
    parts,
  });
  return parts;
}

function buildJdsSql(records, { partNo, totalParts }) {
  const poets = dedupeBy(records.map((record) => ({
    slug: record.poetSlug,
    name_zh: record.authorZh,
    name_ko: record.authorKo,
    life_raw: record.authorLife,
    era_period: record.eraPeriod,
    country: record.country,
  })), (poet) => poet.slug);

  return `-- Generated by scripts/build_cn_translation_pipeline_staging.mjs
-- Part: ${partNo}/${totalParts}
-- Purpose: stage CN pre-Tang and Song/Yuan/Ming poems into the JDS translation pipeline.
-- Translator decision: JDS backend=gemini model=gemini-2.5-flash-lite prompt=pipeline/translate/prompts/v5_full.txt.
-- Safety: inserts only missing poet slug + title_zh + body_zh rows. Default ending is ROLLBACK.

BEGIN;

WITH input_poets(slug, name_zh, name_ko, life_raw, era_period, country) AS (
  VALUES
${poets.map((poet) => `    (${sqlValue(poet.slug)}, ${sqlValue(poet.name_zh)}, ${sqlValue(poet.name_ko)}, ${sqlValue(poet.life_raw)}, ${sqlValue(poet.era_period)}, ${sqlValue(poet.country)})`).join(',\n')}
)
INSERT INTO poets (title_id, name_zh, name_ko, life_raw, era_period, poem_count)
SELECT slug, name_zh, name_ko, life_raw, era_period, 0
FROM input_poets
ON CONFLICT (title_id) DO UPDATE SET
  name_zh = EXCLUDED.name_zh,
  name_ko = COALESCE(EXCLUDED.name_ko, poets.name_ko),
  life_raw = COALESCE(EXCLUDED.life_raw, poets.life_raw),
  era_period = EXCLUDED.era_period;

WITH input_poems(poet_slug, volume, title_zh, title_ko, category, meter, body_zh, status, quality, review_memo) AS (
  VALUES
${records.map((record) => `    (${sqlValue(record.poetSlug)}, 0, ${sqlValue(record.titleZh)}, ${sqlValue(record.titleKo)}, ${sqlValue(record.category)}, ${sqlValue(record.meter)}, ${sqlValue(record.bodyZh)}, 'parsed', ${sqlValue(record.quality)}, ${sqlValue(JSON.stringify({
    queue_id: record.queueId,
    source_record_id: record.sourceRecordId,
    alias_record_ids: record.aliasRecordIds,
    batch: record.batch,
    source_url: record.sourceUrl,
    review_status: record.reviewStatus,
    review_reasons: record.reviewReasons,
  }))})`).join(',\n')}
)
INSERT INTO poems (
  poet_id, poem_no, volume, title_zh, title_ko, category, meter, body_zh,
  is_notable, status, quality, review_memo
)
SELECT
  p.id,
  COALESCE(existing_poem_count.max_poem_no, 0)
    + row_number() OVER (PARTITION BY p.id ORDER BY ip.title_zh, ip.body_zh)::integer,
  ip.volume::integer, ip.title_zh, ip.title_ko, ip.category, ip.meter::integer, ip.body_zh,
  TRUE, ip.status, ip.quality, ip.review_memo
FROM input_poems ip
JOIN poets p ON p.title_id = ip.poet_slug
LEFT JOIN LATERAL (
  SELECT max(poem_no) AS max_poem_no
  FROM poems
  WHERE poet_id = p.id
) existing_poem_count ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM poems existing
  WHERE existing.poet_id = p.id
    AND existing.title_zh = ip.title_zh
    AND existing.body_zh = ip.body_zh
);

UPDATE poets p
SET poem_count = sub.cnt
FROM (
  SELECT poet_id, count(*)::integer AS cnt
  FROM poems
  WHERE poet_id IN (SELECT id FROM poets WHERE title_id IN (${poets.map((poet) => sqlValue(poet.slug)).join(', ')}))
  GROUP BY poet_id
) sub
WHERE p.id = sub.poet_id;

-- Review counts before COMMIT when applying manually:
SELECT quality, status, count(*) FROM poems WHERE quality IN (${[...new Set(records.map((record) => record.quality))].map(sqlValue).join(', ')}) GROUP BY quality, status ORDER BY quality, status;
SELECT p.era_period, count(pm.id) FROM poets p JOIN poems pm ON pm.poet_id = p.id WHERE p.title_id IN (${poets.map((poet) => sqlValue(poet.slug)).join(', ')}) GROUP BY p.era_period ORDER BY p.era_period;

ROLLBACK;
-- COMMIT;
`;
}

function qualityFor(batch, record) {
  if (batch === 'song-yuan-ming-auto') return 'cnnt-auto';
  if (record.sourceFamily === 'shijing') return 'cnpt-shijing';
  if (record.sourceFamily === 'chuci') return 'cnpt-chuci';
  if (record.sourceFamily === 'tao-yuanming') return 'cnpt-tao';
  return 'cnpt-comp';
}

function normalizeBody(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function translationKey(record) {
  return `${record.authorZh}|${record.titleZh}|${record.bodyZh.replace(/\s/g, '')}`;
}

function eraPeriodFor(eraSlug) {
  return {
    'pre-qin': '先秦',
    han: '兩漢',
    jin: '魏晉南北朝',
    song: '宋',
    yuan: '元',
    ming: '明',
    qing: '清',
  }[eraSlug] ?? eraSlug ?? null;
}

function eraSlugForEraPeriod(value) {
  return {
    宋: 'song',
    元: 'yuan',
    明: 'ming',
    清: 'qing',
  }[value] ?? null;
}

function dedupeBy(items, selector) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = selector(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function slugify(value) {
  return Array.from(String(value ?? ''))
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
}

function poetKeyFor(eraSlug, authorZh, preferred) {
  if (preferred && preferred.length <= 32) return preferred;
  const era = String(eraSlug ?? 'na').replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'na';
  return `cn${era}-${shortHash(`${eraSlug}|${authorZh}`)}`;
}

function shortHash(value) {
  return createHash('sha1').update(String(value)).digest('hex').slice(0, 16);
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function sqlValue(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
}

function writeJson(path, payload) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, value);
}
