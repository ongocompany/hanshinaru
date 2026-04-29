#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildCandidateRecord, buildReviewQueueItem } from './lib/cn_wikisource_candidate_extractor.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(
  ROOT,
  process.env.CN_NON_TANG_CANDIDATE_PAGES ?? 'docs/spec/cn-non-tang-candidate-pages.dump.raw.v1.json',
);
const RECORDS_OUT = resolve(ROOT, 'docs/spec/cn-non-tang-candidate-records.v1.json');
const REVIEW_OUT = resolve(ROOT, 'docs/spec/cn-non-tang-review-queue.v1.json');
const REPORT_OUT = resolve(ROOT, 'docs/spec/cn-non-tang-candidate-records.report.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const records = raw.pages.map(buildCandidateRecord);
const reviewQueue = records.map(buildReviewQueueItem);
const report = {
  batchId: 'cn-non-tang-category-candidates',
  generatedAt: new Date().toISOString(),
  source: INPUT,
  summary: {
    pages: raw.pages.length,
    records: records.length,
    autoExtracted: records.filter((record) => record.extraction.status === 'auto-extracted').length,
    needsReview: records.filter((record) => record.extraction.status !== 'auto-extracted').length,
    totalLines: records.reduce((sum, record) => sum + record.extraction.lineCount, 0),
    byEra: countBy(records, (record) => record.eraSlug),
    byAuthor: countBy(records, (record) => record.author.zh),
  },
  reviewPolicy: [
    '이 산출물은 DB 반영 전 검토 큐다.',
    '위키문헌 HTML에서 자동 추출한 본문이므로 제목/주석/중복 줄 섞임을 사람이 확인한다.',
    '검토 완료 전에는 번역 상태를 만들지 않는다.',
  ],
};

writeJson(RECORDS_OUT, {
  version: '2026-04-30.v1',
  batchId: report.batchId,
  sourcePolicy: 'Chinese Wikisource category candidate pages, Korean-style Hanja normalized',
  generatedAt: report.generatedAt,
  records,
});
writeJson(REVIEW_OUT, {
  version: '2026-04-30.v1',
  batchId: report.batchId,
  generatedAt: report.generatedAt,
  queue: reviewQueue,
});
writeJson(REPORT_OUT, report);

console.log(`wrote ${RECORDS_OUT}`);
console.log(`wrote ${REVIEW_OUT}`);
console.log(`wrote ${REPORT_OUT}`);
console.log(JSON.stringify(report.summary, null, 2));

function writeJson(path, payload) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
