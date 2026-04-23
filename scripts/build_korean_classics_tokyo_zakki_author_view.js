#!/usr/bin/env node
/**
 * build_korean_classics_tokyo_zakki_author_view.js
 *
 * 목적:
 * - `東京雜記` 전권 묶음을 시인 중심 보기로 재구성한다.
 * - 보수 정리된 저자 기준으로 작품 수, 권차 분포, 원표기 분포를 빠르게 확인할 수 있게 한다.
 *
 * 사용법:
 *   node scripts/build_korean_classics_tokyo_zakki_author_view.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLE_PATH = path.join(ROOT, 'docs', 'spec', 'korean-classics-tokyo-zakki-collection-bundle.v1.json');
const OUT_PATH = path.join(ROOT, 'docs', 'spec', 'korean-classics-tokyo-zakki-author-view.v1.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function addCount(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function sortCounts(map, locale = 'zh-Hant') {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale));
}

function groupByAuthor(poemBlocks) {
  const grouped = new Map();

  for (const block of poemBlocks) {
    const normalized = block.authorNormalization?.normalizedAuthorZh || '미상';
    if (!grouped.has(normalized)) {
      grouped.set(normalized, {
        normalizedAuthorZh: normalized,
        workCount: 0,
        rawLabels: new Map(),
        volumes: new Map(),
        sections: new Map(),
        forms: new Map(),
        confidence: new Map(),
        works: []
      });
    }

    const bucket = grouped.get(normalized);
    bucket.workCount += 1;
    addCount(bucket.rawLabels, block.authorNormalization?.rawLabelZh || block.authorZh || block.titleHintZh || '미상');
    addCount(bucket.volumes, `卷${block.volume}`);
    addCount(bucket.sections, `${block.volume}:${block.section}`);
    addCount(bucket.forms, block.inferredForm || '미상');
    addCount(bucket.confidence, block.harvestPolicy?.confidence || '미상');
    bucket.works.push({
      harvestId: block.harvestId,
      volume: block.volume,
      section: block.section,
      sourceEntryTitle: block.sourceEntryTitle || null,
      displayLabelZh: block.displayLabelZh,
      rawAuthorZh: block.authorNormalization?.rawLabelZh || block.authorZh || block.titleHintZh || null,
      titlePrefixZh: block.authorNormalization?.titlePrefixZh || null,
      lineCount: block.lineCount,
      inferredForm: block.inferredForm,
      confidence: block.harvestPolicy?.confidence || '미상',
      documentEntryId: block.documentEntryId,
      previewZh: block.textZh.split('\n').slice(0, 2).join(' / ')
    });
  }

  return [...grouped.values()]
    .map((bucket) => ({
      normalizedAuthorZh: bucket.normalizedAuthorZh,
      workCount: bucket.workCount,
      rawLabelSummary: sortCounts(bucket.rawLabels),
      volumeSummary: sortCounts(bucket.volumes, 'ko'),
      sectionSummary: sortCounts(bucket.sections, 'ko'),
      formSummary: sortCounts(bucket.forms, 'ko'),
      confidenceSummary: sortCounts(bucket.confidence, 'ko'),
      works: bucket.works.sort((a, b) =>
        a.volume - b.volume ||
        (a.section || '').localeCompare(b.section || '', 'zh-Hant') ||
        (a.sourceEntryTitle || '').localeCompare(b.sourceEntryTitle || '', 'zh-Hant') ||
        a.displayLabelZh.localeCompare(b.displayLabelZh, 'zh-Hant')
      )
    }))
    .sort((a, b) => b.workCount - a.workCount || a.normalizedAuthorZh.localeCompare(b.normalizedAuthorZh, 'zh-Hant'));
}

function main() {
  const bundle = readJson(BUNDLE_PATH);
  const authors = groupByAuthor(bundle.poemBlocks);

  const authorView = {
    version: '2026-04-24.v1',
    collectionId: 'korean-classics-tokyo-zakki-author-view',
    basedOn: path.basename(BUNDLE_PATH),
    purpose: '東京雜記 전권 시문 후보를 정리된 시인 기준으로 재배열한다',
    summary: {
      normalizedAuthorCount: authors.length,
      totalWorkCount: authors.reduce((sum, author) => sum + author.workCount, 0),
      topAuthors: authors.slice(0, 15).map((author) => ({
        normalizedAuthorZh: author.normalizedAuthorZh,
        workCount: author.workCount
      }))
    },
    authors
  };

  writeJson(OUT_PATH, authorView);

  console.log(
    JSON.stringify(
      {
        outPath: OUT_PATH,
        normalizedAuthorCount: authorView.summary.normalizedAuthorCount,
        totalWorkCount: authorView.summary.totalWorkCount,
        topAuthors: authorView.summary.topAuthors.slice(0, 10)
      },
      null,
      2
    )
  );
}

main();
