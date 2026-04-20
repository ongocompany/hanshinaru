#!/usr/bin/env node
/**
 * assess_korean_hansi_pipeline_readiness.js
 *
 * 목적:
 * - priority-11 실행 보드를 읽어서 현재 파이프라인 실행 가능 단계를 판정한다.
 * - dry-run / 수집 파이프라인 / 번역 파이프라인의 실행 시점을 게이트 기반으로 출력한다.
 *
 * 사용법:
 *   node scripts/assess_korean_hansi_pipeline_readiness.js
 */

const fs = require('fs');
const path = require('path');

const BOARD_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-pipeline-readiness.v1.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function hasChecklist(entry, keys) {
  return keys.every((key) => entry.progressChecklist?.[key] === true);
}

function main() {
  const board = readJson(BOARD_JSON);
  const entries = board.entries || [];

  const seedReadyAuthors = entries.filter((entry) =>
    hasChecklist(entry, [
      'authorProfileVerified',
      'primaryCollectionVerified',
      'encyChecked',
      'firstFivePoemsListed'
    ])
  );

  const collectionReadyAuthors = entries.filter((entry) =>
    hasChecklist(entry, [
      'authorProfileVerified',
      'primaryCollectionVerified',
      'encyChecked',
      'firstFivePoemsListed',
      'korcisChecked'
    ])
  );

  const ingestReadyAuthors = entries.filter((entry) =>
    hasChecklist(entry, [
      'authorProfileVerified',
      'primaryCollectionVerified',
      'encyChecked',
      'firstFivePoemsListed',
      'korcisChecked',
      'sourcePolicyAssigned',
      'rightsRiskReviewed'
    ])
  );

  const seedReadyPoemCount = seedReadyAuthors.reduce((sum, entry) => sum + (entry.poemCandidateWork?.candidateCount || 0), 0);
  const collectionReadyPoemCount = collectionReadyAuthors.reduce((sum, entry) => sum + (entry.poemCandidateWork?.candidateCount || 0), 0);
  const ingestReadyPoemCount = ingestReadyAuthors.reduce((sum, entry) => sum + (entry.poemCandidateWork?.candidateCount || 0), 0);

  const gates = {
    researchManifestDryRun: {
      condition: 'seed-ready authors >= 3 and candidate poems >= 15',
      passed: seedReadyAuthors.length >= 3 && seedReadyPoemCount >= 15,
      current: {
        authors: seedReadyAuthors.length,
        poems: seedReadyPoemCount
      }
    },
    collectionMetadataDryRun: {
      condition: 'collection-ready authors >= 3 and candidate poems >= 15',
      passed: collectionReadyAuthors.length >= 3 && collectionReadyPoemCount >= 15,
      current: {
        authors: collectionReadyAuthors.length,
        poems: collectionReadyPoemCount
      }
    },
    ingestPilotRun: {
      condition: 'ingest-ready authors >= 3 and candidate poems >= 15',
      passed: ingestReadyAuthors.length >= 3 && ingestReadyPoemCount >= 15,
      current: {
        authors: ingestReadyAuthors.length,
        poems: ingestReadyPoemCount
      }
    },
    ownedTranslationPilotRun: {
      condition: 'ingest pilot run passed + 15 poem ingest completed and manually sampled',
      passed: false,
      current: {
        authors: ingestReadyAuthors.length,
        poems: ingestReadyPoemCount
      }
    }
  };

  let recommendation = '아직 full ingest/translation pipeline 시점이 아님';
  let recommendedNow = 'research manifest dry-run';
  let reason = '최치원·정지상·허난설헌 3명에서 후보 15수가 확보되어 조사 시드 manifest는 만들 수 있으나, KORCIS 확인과 권리 검토가 끝나지 않음';

  if (gates.ingestPilotRun.passed) {
    recommendation = '15수 기준 ingest pilot run 가능';
    recommendedNow = 'ingest pilot run';
    reason = '최소 3명 x 5수에 대해 문집/권리 검토까지 완료됨';
  } else if (gates.collectionMetadataDryRun.passed) {
    recommendation = '수집 메타데이터 dry-run 가능, full ingest는 아직 보류';
    recommendedNow = 'collection metadata dry-run';
    reason = 'KORCIS 확인까지 완료되어 문집/수록 위치 검증은 시작 가능하나, source policy 지정과 rights review가 아직 부족함';
  } else if (gates.researchManifestDryRun.passed) {
    recommendation = '조사 manifest dry-run은 지금 가능';
    recommendedNow = 'research manifest dry-run';
    reason = '후보작 15수는 확보되었으므로 조사 번들/작업 큐를 생성할 수 있음';
  }

  const nextRequirements = [
    '최치원, 정지상, 허난설헌 3명에 대해 KORCIS 확인(korcisChecked=true)',
    '3명 모두 sourcePolicyAssigned=true',
    '3명 모두 rightsRiskReviewed=true',
    '3명 모두 candidateCount 5 유지',
    '그 다음 15수 ingest pilot run',
    'pilot 성공 후 owned translation pipeline 진입'
  ];

  const out = {
    version: '2026-04-20.v1',
    basedOnBoard: 'korean-hansi-priority-11-board.v1.json',
    summary: {
      totalAuthors: entries.length,
      seedReadyAuthors: seedReadyAuthors.map((entry) => entry.authorKo),
      collectionReadyAuthors: collectionReadyAuthors.map((entry) => entry.authorKo),
      ingestReadyAuthors: ingestReadyAuthors.map((entry) => entry.authorKo),
      seedReadyPoemCount,
      collectionReadyPoemCount,
      ingestReadyPoemCount
    },
    gates,
    recommendation,
    recommendedNow,
    reason,
    nextRequirements
  };

  writeJson(OUT_JSON, out);

  console.log(`Recommended now: ${recommendedNow}`);
  console.log(`Reason: ${reason}`);
  console.log(`Output: ${OUT_JSON}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
