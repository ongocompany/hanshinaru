#!/usr/bin/env node
/**
 * build_korean_hansi_ocr_queue.js
 *
 * 목적:
 * - 현재 텍스트 수집 파일럿에서 아직 직접 본문을 못 확보한 보드 후보를 OCR 큐로 변환한다.
 * - AI Hub 고서 한자 OCR 데이터(603)를 학습/평가용 트랙으로 붙일 대상을 우선순위화한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_ocr_queue.js
 */

const fs = require('fs');
const path = require('path');

const BOARD_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.json');
const PILOT_REPORT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-text-collection-pilot.report.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-ocr-queue.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-ocr-queue.v1.tsv');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, 'utf8');
}

function sourceHintsForAuthor(authorKo) {
  if (authorKo === '최치원') {
    return {
      preferredSourceFamilies: ['동문선', '고운집', '계원필경집'],
      preferredAcquisition: 'KORCIS bib -> 소장처 원문/PDF -> OCR',
      ocrRationale: '직접 열리는 텍스트는 적고, 시선집/문집 수록 위치를 따라 이미지/PDF OCR로 넘어가는 편이 빠름'
    };
  }
  if (authorKo === '정지상') {
    return {
      preferredSourceFamilies: ['동문선', '동경잡기', '정사간집'],
      preferredAcquisition: 'KORCIS bib -> 동문선/동경잡기 원문 이미지/PDF -> OCR',
      ocrRationale: '직접 텍스트 접근이 가장 약한 축이라 OCR 보조가 사실상 필수'
    };
  }
  if (authorKo === '허난설헌') {
    return {
      preferredSourceFamilies: ['난설헌집'],
      preferredAcquisition: '난설헌집 하위 작품 또는 기준본 이미지/PDF -> OCR',
      ocrRationale: '저자 페이지 링크는 많지만 보드 후보와 정확히 일치하지 않아 문집 기준 OCR 보정이 유효'
    };
  }

  return {
    preferredSourceFamilies: [],
    preferredAcquisition: '원문 이미지/PDF -> OCR',
    ocrRationale: '실텍스트 부재'
  };
}

function buildRows(board, pilotReport) {
  const rows = [];
  const unresolved = pilotReport.unresolvedBoardTargets || {};

  for (const entry of board.entries || []) {
    const authorKo = entry.authorKo;
    const targets = unresolved[authorKo] || [];
    if (targets.length === 0) continue;

    const hints = sourceHintsForAuthor(authorKo);
    const collectionTitle = entry.collectionWork?.primaryCollectionTitle || '';

    for (const target of targets) {
      rows.push({
        queueId: `OCR-${authorKo}-${target}`.replace(/\s+/g, '-'),
        authorKo,
        authorHanja: entry.authorHanja,
        targetTitle: target,
        collectionTitle,
        sourceTrack: entry.sourceTrack,
        korcisSearchUrl: entry.collectionWork?.korcisSearchUrl || '',
        encyKeywordUrl: entry.collectionWork?.encyKeywordUrl || '',
        preferredSourceFamilies: hints.preferredSourceFamilies.join(', '),
        preferredAcquisition: hints.preferredAcquisition,
        ocrBootstrapDataset: 'AI Hub 603 고서 한자 인식 OCR 데이터',
        ocrBootstrapRole: '모델 bootstrap / fine-tune / evaluation',
        ocrRationale: hints.ocrRationale,
        status: 'queued'
      });
    }
  }

  return rows;
}

function toTsv(rows) {
  const header = [
    'queueId',
    'authorKo',
    'authorHanja',
    'targetTitle',
    'collectionTitle',
    'sourceTrack',
    'korcisSearchUrl',
    'encyKeywordUrl',
    'preferredSourceFamilies',
    'preferredAcquisition',
    'ocrBootstrapDataset',
    'ocrBootstrapRole',
    'ocrRationale',
    'status'
  ];

  const lines = [header.join('\t')];
  for (const row of rows) {
    lines.push(header.map((key) => String(row[key] ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const board = readJson(BOARD_JSON);
  const pilotReport = readJson(PILOT_REPORT_JSON);
  const rows = buildRows(board, pilotReport);

  const out = {
    version: '2026-04-21.v1',
    basedOnBoard: 'korean-hansi-priority-11-board.v1.json',
    basedOnPilotReport: 'korean-hansi-text-collection-pilot.report.v1.json',
    queuePurpose: '직접 텍스트 미확보 보드 후보의 이미지/PDF OCR 우선순위 큐',
    queueCount: rows.length,
    rows
  };

  writeJson(OUT_JSON, out);
  writeText(OUT_TSV, toTsv(rows));

  console.log(`OCR queue rows: ${rows.length}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
