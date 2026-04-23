#!/usr/bin/env node
/**
 * build_korean_classics_tokyo_zakki_review_queue.js
 *
 * 목적:
 * - `東京雜記` 전권 묶음에서 추가 검수가 필요한 항목만 따로 추린다.
 * - 작품 본문 복원과 저자 표기 정리를 다음 단계 작업 큐로 고정한다.
 *
 * 사용법:
 *   node scripts/build_korean_classics_tokyo_zakki_review_queue.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLE_PATH = path.join(ROOT, 'docs', 'spec', 'korean-classics-tokyo-zakki-collection-bundle.v1.json');
const OUT_PATH = path.join(ROOT, 'docs', 'spec', 'korean-classics-tokyo-zakki-review-queue.v1.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function isNonPersonCandidate(label) {
  if (!label) return false;
  if (label.length <= 4) return true;
  return /祓禊|七詠|十二詠|歌$/.test(label);
}

function main() {
  const bundle = readJson(BUNDLE_PATH);

  const mediumWorks = bundle.poemBlocks
    .filter((block) => block.harvestPolicy.confidence !== 'high')
    .map((block) => ({
      harvestId: block.harvestId,
      volume: block.volume,
      section: block.section,
      sourceEntryTitle: block.sourceEntryTitle || null,
      displayLabelZh: block.displayLabelZh,
      normalizedAuthorZh: block.authorNormalization.normalizedAuthorZh,
      issue: '본문 복원 추가 검수',
      note: block.harvestPolicy.rationale,
      previewZh: block.textZh.split('\n').slice(0, 3).join(' / ')
    }));

  const lowAuthorLabels = bundle.poemBlocks
    .filter((block) => block.authorNormalization.confidence === 'low')
    .map((block) => ({
      harvestId: block.harvestId,
      volume: block.volume,
      section: block.section,
      sourceEntryTitle: block.sourceEntryTitle || null,
      rawLabelZh: block.authorNormalization.rawLabelZh,
      normalizedAuthorZh: block.authorNormalization.normalizedAuthorZh,
      displayLabelZh: block.displayLabelZh,
      issue: '저자 표기 정리 필요',
      likelyNonPersonLabel: isNonPersonCandidate(block.authorNormalization.rawLabelZh),
      previewZh: block.textZh.split('\n').slice(0, 2).join(' / ')
    }));

  const queue = {
    version: '2026-04-24.v1',
    queueId: 'korean-classics-tokyo-zakki-review-queue',
    basedOn: path.basename(BUNDLE_PATH),
    purpose: '東京雜記 전권 수집 결과 중 본문 복원과 저자 정리가 필요한 항목만 별도 추린다',
    summary: {
      mediumWorkCount: mediumWorks.length,
      lowAuthorLabelCount: lowAuthorLabels.length,
      likelyNonPersonLabelCount: lowAuthorLabels.filter((item) => item.likelyNonPersonLabel).length
    },
    mediumWorks,
    lowAuthorLabels
  };

  writeJson(OUT_PATH, queue);

  console.log(
    JSON.stringify(
      {
        outPath: OUT_PATH,
        summary: queue.summary
      },
      null,
      2
    )
  );
}

main();
