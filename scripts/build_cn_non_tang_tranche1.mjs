#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildRecord } from './lib/cn_wikisource_record_builder.mjs';
import { CN_NON_TANG_TRANCHE1_SEED } from './data/cn_non_tang_tranche1_seed.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.records.v1.json');
const REPORT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.report.v1.json');

const records = CN_NON_TANG_TRANCHE1_SEED.map(buildRecord);
const eraCounts = countBy(records, (record) => record.eraSlug);
const authorCounts = countBy(records, (record) => record.author.zh);
const statusCounts = countBy(records, (record) => record.jdsCandidate.poem.status);

const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-non-tang-tranche1',
  sourcePolicy: 'Wikisource first, Korean-style traditional Hanja normalized',
  generatedAt: new Date().toISOString(),
  records,
};

const report = {
  batchId: doc.batchId,
  generatedAt: doc.generatedAt,
  summary: {
    records: records.length,
    eras: eraCounts,
    authors: authorCounts,
    statuses: statusCounts,
    translatedOwned: records.filter((record) => record.translation.translationKoOwned).length,
  },
  nextActions: [
    '원문 URL을 한 번 더 raw/API로 검증한다.',
    'jds poets/poems upsert 스크립트를 별도 작성한다.',
    'Supabase hansi_curated_* 반영 전 data_pending 제거 범위를 결정한다.',
  ],
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(`wrote ${REPORT}`);
console.log(JSON.stringify(report.summary, null, 2));

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
