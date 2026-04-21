#!/usr/bin/env node
/**
 * build_korean_hansi_famous_authors_wave1_batch.js
 *
 * 목적:
 * - 유명 시인 중심 한국 한시 대량 수집 wave-1 실행 배치를 생성한다.
 * - exact-title 테스트보다 실제 대량 수집 진입을 우선하는 운영 기준을 고정한다.
 * - 직접 텍스트 우선, 막히면 OCR로 바로 전환하는 실전용 배치를 만든다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_famous_authors_wave1_batch.js
 */

const fs = require('fs');
const path = require('path');

const BOARD_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.json');
const PILOT_REPORT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-text-collection-pilot.report.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-famous-authors-wave1-batch.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-famous-authors-wave1-batch.v1.tsv');

const WAVE_1 = [
  {
    authorKo: '최치원',
    authorTier: 'core-canon',
    initialTargetWorks: 20,
    directTextFirstSources: [
      'Wikisource 개별 작품/문집 페이지',
      '東文選/三國史記 공개 원문 페이지',
      '공개 고전 원문 페이지 raw 캐시'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '계원필경 계열 판본 메타데이터'
    ],
    ocrFallbackSources: [
      '규장각 원문 이미지',
      '디지털장서각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '현재 direct-text 시드가 가장 많으므로 공개 원문 페이지를 먼저 넓게 긁고, 남는 결손만 collection locator와 OCR로 넘긴다',
    ocrEscalationTrigger: '공개 원문/문집 페이지에서 10건 이상 연속으로 추가 확보가 막히면 OCR lane으로 전환',
    batchSuccessMetric: '최소 20건 확보 또는 계원필경 계열 1개 판본의 유효 작품 묶음 수집 완료'
  },
  {
    authorKo: '정지상',
    authorTier: 'core-canon',
    initialTargetWorks: 15,
    directTextFirstSources: [
      'Wikisource 개별 작품 페이지',
      '東文選 공개 원문 페이지',
      '동경잡기 계열 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《동문선》·《동경잡기》 계열 메타데이터'
    ],
    ocrFallbackSources: [
      '동경잡기/정사간집 이미지·PDF',
      '규장각 원문 이미지',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '송인·신설처럼 바로 열린 공개 원문부터 넓히고, 이후 동문선/동경잡기 수록 위치를 따라 collection-first로 붙인다',
    ocrEscalationTrigger: '동문선/동경잡기 기준으로 exact-title 후보 5건 중 3건 이상이 direct-text에서 계속 막히면 OCR lane 병행',
    batchSuccessMetric: '최소 15건 확보 또는 동문선/동경잡기 한 축에서 연속 수집 가능한 작품 묶음 확보'
  },
  {
    authorKo: '이규보',
    authorTier: 'core-canon',
    initialTargetWorks: 30,
    directTextFirstSources: [
      'ITKC 원문 페이지',
      '공개 문집 TOC/원문 페이지',
      'Wikisource 수록 시 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《동국이상국집》 메타데이터'
    ],
    ocrFallbackSources: [
      '《동국이상국집》 원문 이미지',
      '디지털장서각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '대표 문집 단위로 바로 collection-first 수집에 들어가고, exact-title 정합성은 후순위로 둔다',
    ocrEscalationTrigger: '문집 TOC는 확인되는데 텍스트 추출이 안 되는 상태가 15건 이상 누적되면 OCR lane 추가',
    batchSuccessMetric: '최소 30건 확보 또는 《동국이상국집》 한 권차 슬라이스를 안정적으로 수집'
  },
  {
    authorKo: '이색',
    authorTier: 'core-canon',
    initialTargetWorks: 25,
    directTextFirstSources: [
      '목은집/목은시고 공개 원문 페이지',
      'ITKC 원문 페이지',
      'Wikisource 수록 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《목은집》·《목은시고》 메타데이터'
    ],
    ocrFallbackSources: [
      '목은집 계열 이미지·PDF',
      '규장각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: 'collection-first로 문집 한 축을 잡고, 공개 텍스트가 열리는 권차부터 연속 수집한다',
    ocrEscalationTrigger: '권차 단위로 메타데이터는 확인되지만 텍스트 추출 가능한 작품이 5건 미만이면 OCR 병행',
    batchSuccessMetric: '최소 25건 확보 또는 목은집 계열 한 슬라이스 연속 수집'
  },
  {
    authorKo: '이제현',
    authorTier: 'core-canon',
    initialTargetWorks: 20,
    directTextFirstSources: [
      '익재난고 공개 원문 페이지',
      'ITKC 원문 페이지',
      'Wikisource 수록 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《익재난고》 메타데이터'
    ],
    ocrFallbackSources: [
      '익재난고 이미지·PDF',
      '디지털장서각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '익재난고 계열을 collection-first로 열고, 소악부 포함 공개 텍스트 가용 작품을 묶음 수집한다',
    ocrEscalationTrigger: '공개 텍스트 연속 확보량이 10건 아래로 막히면 OCR lane 추가',
    batchSuccessMetric: '최소 20건 확보 또는 익재난고 한 묶음 안정 수집'
  },
  {
    authorKo: '정도전',
    authorTier: 'core-canon',
    initialTargetWorks: 20,
    directTextFirstSources: [
      '삼봉집 공개 원문 페이지',
      'ITKC 원문 페이지',
      'Wikisource 수록 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《삼봉집》 메타데이터'
    ],
    ocrFallbackSources: [
      '삼봉집 이미지·PDF',
      '규장각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '삼봉집 계열 collection-first로 들어가고, 정치 산문과 섞이더라도 한시 파트는 대량 확보를 우선한다',
    ocrEscalationTrigger: '문집은 열리는데 한시 텍스트 분리 실패가 반복되면 OCR 또는 후처리 파서 lane 추가',
    batchSuccessMetric: '최소 20건 확보 또는 삼봉집에서 한시 묶음 분리 성공'
  },
  {
    authorKo: '김종직',
    authorTier: 'core-canon',
    initialTargetWorks: 20,
    directTextFirstSources: [
      '점필재집 공개 원문 페이지',
      'ITKC 원문 페이지',
      'Wikisource 수록 공개 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《점필재집》 메타데이터'
    ],
    ocrFallbackSources: [
      '점필재집 이미지·PDF',
      '디지털장서각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '사림파 대표 문집 축으로 보고 collection-first 대량 수집을 시도한다',
    ocrEscalationTrigger: '문집 메타데이터는 충분한데 직접 텍스트 확보량이 10건 미만으로 막히면 OCR lane 추가',
    batchSuccessMetric: '최소 20건 확보 또는 점필재집에서 한시 축 1차 슬라이스 완료'
  },
  {
    authorKo: '허난설헌',
    authorTier: 'core-canon',
    initialTargetWorks: 20,
    directTextFirstSources: [
      '蘭雪軒詩集 공개 원문 페이지',
      '조선여류한시선집',
      'Wikisource 개별/문집 페이지'
    ],
    collectionMetadataSources: [
      'KORCIS',
      'EncyKorea',
      '《난설헌집》 메타데이터'
    ],
    ocrFallbackSources: [
      '난설헌집 이미지·PDF',
      '규장각',
      'AI Hub 603 OCR bootstrap'
    ],
    recommendedStartPoint: '현재 공개 원문 접근성이 가장 좋아서 direct-text-first로 양을 먼저 확보하고, 남는 결손만 OCR로 넘긴다',
    ocrEscalationTrigger: '기부독서강사처럼 exact-title 누락이 남더라도 전체 수집량이 20건 미만이면 OCR lane 병행',
    batchSuccessMetric: '최소 20건 확보 또는 난설헌시집 공개 원문 파트 1차 수집 완료'
  }
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

function tsvEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
}

function unique(values) {
  return [...new Set(values)];
}

function buildRows(board, pilotReport) {
  const entries = board.entries || [];
  const unresolvedByAuthor = pilotReport.unresolvedBoardTargets || {};
  const coverageByAuthor = pilotReport.boardCoverage || {};

  return WAVE_1.map((config, index) => {
    const entry = entries.find((item) => item.authorKo === config.authorKo);
    if (!entry) {
      throw new Error(`priority-11 board에서 작가를 찾지 못했습니다: ${config.authorKo}`);
    }

    const currentCoverage = coverageByAuthor[config.authorKo];
    const matchedTargets = unique(currentCoverage?.matchedTargets || []);
    const unresolvedSeedTitles = unique(
      unresolvedByAuthor[config.authorKo]
      || (entry.poemCandidateWork?.firstFivePoemCandidates || []).map((item) => item.titleHanja).filter(Boolean)
    );

    return {
      waveOrder: index + 1,
      authorKo: entry.authorKo,
      authorHanja: entry.authorHanja,
      timelineEra: entry.timelineEra,
      birthDeath: entry.birthDeath,
      authorTier: config.authorTier,
      primaryCollectionTitle: entry.collectionWork?.primaryCollectionTitle || '',
      sourceTrack: entry.sourceTrack || '',
      currentStage: entry.stage || '',
      currentStatus: entry.status || '',
      initialTargetWorks: config.initialTargetWorks,
      currentMatchedSeedTitles: matchedTargets,
      unresolvedSeedTitles,
      directTextFirstSources: config.directTextFirstSources,
      collectionMetadataSources: config.collectionMetadataSources,
      ocrFallbackSources: config.ocrFallbackSources,
      recommendedStartPoint: config.recommendedStartPoint,
      ocrEscalationTrigger: config.ocrEscalationTrigger,
      batchSuccessMetric: config.batchSuccessMetric,
      nextActionFromBoard: entry.nextAction || '',
      blockers: entry.blockers || [],
      notes: entry.notes || ''
    };
  });
}

function toTsv(rows) {
  const header = [
    'waveOrder',
    'authorKo',
    'authorHanja',
    'timelineEra',
    'birthDeath',
    'authorTier',
    'primaryCollectionTitle',
    'sourceTrack',
    'currentStage',
    'currentStatus',
    'initialTargetWorks',
    'currentMatchedSeedTitles',
    'unresolvedSeedTitles',
    'directTextFirstSources',
    'collectionMetadataSources',
    'ocrFallbackSources',
    'recommendedStartPoint',
    'ocrEscalationTrigger',
    'batchSuccessMetric',
    'nextActionFromBoard',
    'blockers',
    'notes'
  ];

  const lines = [header.join('\t')];
  for (const row of rows) {
    const values = header.map((key) => {
      const value = Array.isArray(row[key]) ? row[key].join(', ') : row[key];
      return tsvEscape(value);
    });
    lines.push(values.join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const board = readJson(BOARD_JSON);
  const pilotReport = readJson(PILOT_REPORT_JSON);
  const rows = buildRows(board, pilotReport);
  const totalInitialTargetWorks = rows.reduce((sum, row) => sum + row.initialTargetWorks, 0);

  const out = {
    version: '2026-04-21.v1',
    batchId: 'korean-hansi-famous-authors-wave1',
    basedOnBoard: 'korean-hansi-priority-11-board.v1.json',
    basedOnPilotReport: 'korean-hansi-text-collection-pilot.report.v1.json',
    purpose: '유명 시인 중심 한국 한시 대량 수집 실전 배치',
    operatingDecision: 'exact-title 파일럿은 동결하고, 유명 시인 문집/공개 원문 기준 대량 수집을 먼저 진행한다',
    executionPolicy: {
      collectionUnit: 'author -> collection slice -> works',
      directTextRule: '정확한 대표작 1수씩 완성하려고 멈추지 말고, 직접 열리는 텍스트를 먼저 많이 확보한다',
      ocrRule: '직접 텍스트 확보가 author batch 기준 임계치 아래로 막히면 collection image/PDF OCR lane을 즉시 병행한다',
      rightsRule: '권리 검토는 작품 1건마다 중단하지 않고 author batch 또는 collection slice 단위로 후처리한다',
      stopRule: 'exact-title 100% 일치를 수집 시작 조건으로 두지 않는다'
    },
    summary: {
      authorCount: rows.length,
      totalInitialTargetWorks,
      waveAuthors: rows.map((row) => row.authorKo)
    },
    rows
  };

  writeJson(OUT_JSON, out);
  writeText(OUT_TSV, toTsv(rows));

  console.log(`Wave-1 authors: ${rows.length}`);
  console.log(`Wave-1 initial target works: ${totalInitialTargetWorks}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
