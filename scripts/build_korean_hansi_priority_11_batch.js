#!/usr/bin/env node
/**
 * build_korean_hansi_priority_11_batch.js
 *
 * 목적:
 * - 파일럿 50명 URL 시트에서 한국 한시 우선 수집용 11명 배치를 생성한다.
 * - 시가/가사 중심 인물은 제외하고, 문집/한시 수집에 바로 들어갈 작가군을 뽑는다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_priority_11_batch.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-pilot-50-url-sheet.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-batch.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-batch.v1.tsv');

const PRIORITY_11 = [
  '최치원',
  '정지상',
  '이규보',
  '이색',
  '이제현',
  '정도전',
  '김종직',
  '이숭인',
  '허난설헌',
  '김정희',
  '황현'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function classifyCollectionPriority(sourceHint) {
  const hint = sourceHint || '';
  if (hint.includes('《')) return 'high';
  if (hint.includes('local fullPoems present')) return 'medium';
  return 'medium';
}

function buildFirstAction(row) {
  if (row.authorKo === '최치원') {
    return 'local 대표작 확인 후 《계원필경》/《全唐詩》 기준으로 KORCIS에서 문집과 전본 위치를 확장';
  }
  if (row.fullPoemsCount > 0) {
    return 'local 대표작 원문을 기준표본으로 삼고 KORCIS와 EncyKorea에서 문집/작품 설명을 확장';
  }
  return '대표 문집명을 기준으로 KORCIS 검색 -> 문집 판본/소장처 확인 -> EncyKorea에서 작가/작품 메타데이터 보강';
}

function buildTargetOutputs(row) {
  return [
    'author profile verified',
    'primary collection identified',
    'first 5 poems candidate list',
    'source policy tag assigned',
    'commercial transition risk noted'
  ];
}

function buildRows(inputRows) {
  const selected = [];
  for (const name of PRIORITY_11) {
    const row = inputRows.find((item) => item.authorKo === name);
    if (!row) {
      throw new Error(`파일럿 URL 시트에서 작가를 찾지 못했습니다: ${name}`);
    }
    selected.push({
      batchOrder: selected.length + 1,
      authorKo: row.authorKo,
      authorHanja: row.authorHanja,
      timelineEra: row.timelineEra,
      birthDeath: row.birthDeath,
      cohort: row.cohort,
      selectionReason: row.selectionReason,
      representativeWorkKo: row.representativeWorkKo,
      representativeWorkHanja: row.representativeWorkHanja,
      representativeSourceHint: row.representativeSourceHint,
      collectionPriority: classifyCollectionPriority(row.representativeSourceHint),
      korcisSearchUrl: row.korcisSearchUrl,
      encyKeywordUrl: row.encyKeywordUrl,
      preferredFirstAction: buildFirstAction(row),
      targetOutputs: buildTargetOutputs(row),
      notes: row.notes
    });
  }
  return selected;
}

function toTsv(rows) {
  const header = [
    'batchOrder',
    'authorKo',
    'authorHanja',
    'timelineEra',
    'birthDeath',
    'cohort',
    'selectionReason',
    'representativeWorkKo',
    'representativeWorkHanja',
    'representativeSourceHint',
    'collectionPriority',
    'korcisSearchUrl',
    'encyKeywordUrl',
    'preferredFirstAction',
    'targetOutputs',
    'notes'
  ];

  const lines = [header.join('\t')];
  for (const row of rows) {
    const values = header.map((key) => {
      const value = Array.isArray(row[key]) ? row[key].join(', ') : row[key];
      return String(value ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ');
    });
    lines.push(values.join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const inputRows = readJson(INPUT_JSON);
  const authors = buildRows(inputRows);
  const output = {
    version: '2026-04-20.v1',
    batchId: 'korean-hansi-priority-11',
    purpose: '한국 한시 문집 기반 우선 수집 배치',
    note: '시가/가사 중심 항목은 제외하고 문집 기반 한문 시문 수집에 바로 들어갈 수 있는 작가군만 선별',
    authors
  };

  writeJson(OUT_JSON, output);
  writeText(OUT_TSV, toTsv(authors));

  console.log(`Priority batch size: ${authors.length}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
