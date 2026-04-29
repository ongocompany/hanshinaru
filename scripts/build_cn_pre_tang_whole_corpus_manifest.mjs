#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CN_PRE_TANG_WHOLE_CORPUS_MANIFEST } from './data/cn_pre_tang_whole_corpus_manifest.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const MANIFEST_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json');
const REPORT_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-whole-corpus-manifest.report.v1.json');

const generatedAt = new Date().toISOString();
const volumes = buildVolumes(CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.eras);
const byEra = Object.fromEntries(
  CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.eras.map((era) => [era.eraSlug, era.volumeCount]),
);
const firstTrancheVolumes = volumes.filter((volume) =>
  CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.extractionPlan.firstTrancheEraSlugs.includes(volume.eraSlug),
);

const manifest = {
  ...CN_PRE_TANG_WHOLE_CORPUS_MANIFEST,
  generatedAt,
  volumes,
};

const report = {
  batchId: 'cn-pre-tang-whole-corpus-manifest',
  generatedAt,
  sourceWorkTitleZh: CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.sourceWork.titleZh,
  summary: {
    eras: CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.eras.length,
    volumes: volumes.length,
    expectedVolumes: 135,
    firstTrancheVolumes: firstTrancheVolumes.length,
    byEra,
  },
  validation: validateManifest(volumes, byEra),
  nextActions: [
    'Use this manifest as the fixed volume scaffold before any DB upsert.',
    'Start dump/source lookup with pre-qin and han volumes only.',
    'Keep 詩經 and 楚辭 as separate collection families.',
    'Attach raw source, normalized record, review queue, and dry-run counts before import.',
  ],
};

writeJson(MANIFEST_OUT, manifest);
writeJson(REPORT_OUT, report);

console.log(`wrote ${MANIFEST_OUT}`);
console.log(`wrote ${REPORT_OUT}`);
console.log(JSON.stringify(report.summary, null, 2));
if (!report.validation.ok) {
  console.error(JSON.stringify(report.validation, null, 2));
  process.exitCode = 1;
}

function buildVolumes(eras) {
  return eras.flatMap((era) =>
    Array.from({ length: era.volumeCount }, (_, index) => {
      const volumeNumberWithinEra = index + 1;
      return {
        volumeId: `CN-PRETANG-${era.eraSlug.toUpperCase()}-${String(volumeNumberWithinEra).padStart(2, '0')}`,
        sourceWorkTitleZh: CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.sourceWork.titleZh,
        eraSlug: era.eraSlug,
        eraNameZh: era.eraNameZh,
        displayEraZh: era.displayEraZh ?? era.eraNameZh,
        collectionFamily: era.collectionFamily,
        volumeNumberWithinEra,
        volumeTitleZh: `${era.volumePrefixZh}卷${toChineseNumber(volumeNumberWithinEra)}`,
        firstPassPolicy: era.firstPassPolicy,
        lookupStatus: CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.extractionPlan.firstTrancheEraSlugs.includes(
          era.eraSlug,
        )
          ? 'first-tranche'
          : 'planned',
        sourceLookupCandidates: buildSourceLookupCandidates(era, volumeNumberWithinEra),
        notes: era.notes,
      };
    }),
  );
}

function buildSourceLookupCandidates(era, volumeNumberWithinEra) {
  const sourceTitle = CN_PRE_TANG_WHOLE_CORPUS_MANIFEST.sourceWork.titleZh;
  const volumeTitleZh = `${era.volumePrefixZh}卷${toChineseNumber(volumeNumberWithinEra)}`;
  return [
    {
      source: 'zh-wikisource',
      title: `${sourceTitle}/${volumeTitleZh}`,
      status: 'needs-dump-lookup',
    },
    {
      source: 'zh-wikisource',
      title: volumeTitleZh,
      status: 'needs-dump-lookup',
    },
    {
      source: 'companion-source',
      title: era.eraSlug === 'pre-qin' ? '古詩源' : null,
      status: era.eraSlug === 'pre-qin' ? 'fallback-candidate' : 'not-applicable',
    },
  ].filter((candidate) => candidate.title);
}

function validateManifest(volumes, byEra) {
  const expectedByEra = {
    'pre-qin': 7,
    han: 12,
    wei: 12,
    jin: 21,
    'liu-song': 12,
    qi: 7,
    liang: 30,
    'northern-wei': 4,
    'northern-qi': 4,
    'northern-zhou': 6,
    chen: 10,
    sui: 10,
  };
  const errors = [];
  const total = volumes.length;
  if (total !== 135) errors.push(`expected 135 volumes, got ${total}`);
  for (const [eraSlug, expected] of Object.entries(expectedByEra)) {
    if (byEra[eraSlug] !== expected) {
      errors.push(`expected ${eraSlug} volumeCount ${expected}, got ${byEra[eraSlug] ?? 0}`);
    }
  }
  const ids = new Set(volumes.map((volume) => volume.volumeId));
  if (ids.size !== volumes.length) errors.push('volumeId values are not unique');
  return {
    ok: errors.length === 0,
    errors,
  };
}

function writeJson(path, payload) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function toChineseNumber(value) {
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (value <= 10) return value === 10 ? '十' : digits[value];
  if (value < 20) return `十${digits[value - 10]}`;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return `${digits[tens]}十${digits[ones]}`;
}
