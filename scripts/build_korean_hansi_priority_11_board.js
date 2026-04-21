#!/usr/bin/env node
/**
 * build_korean_hansi_priority_11_board.js
 *
 * 목적:
 * - 우선 수집 11명 배치를 실제 작업 보드 형태로 변환한다.
 * - 작가별 상태, 문집 확인, 첫 5수 후보, 권리 검토, 다음 액션을 관리할 수 있는 JSON/TSV를 생성한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_priority_11_board.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-batch.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.tsv');

const AUTHOR_OVERRIDES = {
  '최치원': {
    status: 'researching',
    stage: 'rights-review',
    progressChecklist: {
      authorProfileVerified: true,
      primaryCollectionVerified: true,
      korcisChecked: true,
      encyChecked: true,
      sourcePolicyAssigned: false,
      firstFivePoemsListed: true,
      rightsRiskReviewed: false
    },
    collectionWork: {
      primaryCollectionTitle: '《계원필경집》',
      collectionVerified: true,
      collectionSearchNotes: '한국민족문화대백과 최치원 항목에서 《계원필경집》을 현전하는 한국 최고 문집으로 확인. KORCIS OpenAPI author 검색에서 桂苑筆耕.1-4(REC_KEY 101180342, 국립중앙도서관, DOC_YN Y), 桂苑筆耕集(REC_KEY 101423104, 국립중앙도서관, ABS_YN Y), 桂苑筆耕集.卷6-20(REC_KEY 101630823, 계명대학교 동산도서관) 등을 확인.'
    },
    poemCandidateWork: {
      firstFivePoemCandidates: [
        {
          titleKo: '추야우중',
          titleHanja: '秋夜雨中',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0057881'
        },
        {
          titleKo: '제가야산',
          titleHanja: '題伽倻山',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0051220'
        },
        {
          titleKo: '등윤주자화사',
          titleHanja: '登潤州慈和寺',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0017150'
        },
        {
          titleKo: '강남녀',
          titleHanja: '江南女',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0001014'
        },
        {
          titleKo: '향악잡영',
          titleHanja: '鄕樂雜詠',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0062945'
        }
      ]
    },
    rightsWork: {
      sourcePolicyStatus: 'identified',
      sourcePolicyId: 'SRC-KORCIS-METADATA',
      commercialRiskStatus: 'review-needed',
      replacementNeededBeforeCommercial: false,
      rightsNotes: 'KORCIS는 메타데이터/소장처 확인용으로 확정. 실제 원문 텍스트와 이미지의 재사용 조건은 최종 소장처 또는 연계 원문 기준으로 추가 검토 필요.'
    },
    nextAction: '계원필경 계열 판본 중 표준 기준본을 하나 정하고, 5수의 실제 수록 위치를 권/책 기준으로 고정한 뒤 source policy와 rights review를 붙인다',
    notes: 'EncyKorea와 KORCIS로 1차 확인 완료'
  },
  '정지상': {
    status: 'researching',
    stage: 'rights-review',
    progressChecklist: {
      authorProfileVerified: true,
      primaryCollectionVerified: true,
      korcisChecked: true,
      encyChecked: true,
      sourcePolicyAssigned: false,
      firstFivePoemsListed: true,
      rightsRiskReviewed: false
    },
    collectionWork: {
      primaryCollectionTitle: '《동문선》·《동경잡기》 계열',
      collectionVerified: true,
      collectionSearchNotes: '한국민족문화대백과 정지상 항목에서 작품군이 『동문선』, 『동경잡기』, 『정사간집』에 전한다고 재확인. KORCIS 간략검색에서 author 검색(정지상)은 진양정씨세보 계열로 오염되지만, collection title 검색으로 東文選은 REC_KEY 101123898(국립중앙도서관), 101704573(동국대학교 중앙도서관), 302583837(고려대학교 도서관) 등을 확인했고, 東京雜記는 REC_KEY 303272456(University of Washington), 101466332(국립중앙도서관), 101784194(영남대학교 도서관) 등을 확인했다. 반면 鄭司諫集 direct title 검색은 결과 0건, 작품명 direct 검색(送人, 栢律寺)도 결과 0건이어서 현 단계에서는 collection-level KORCIS 확인까지만 완료한 것으로 본다.'
    },
    poemCandidateWork: {
      firstFivePoemCandidates: [
        {
          titleKo: '송인',
          titleHanja: '送人',
          evidence: '한국민족문화대백과 작품 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0014214'
        },
        {
          titleKo: '신설',
          titleHanja: '新雪',
          evidence: '한국민족문화대백과 정지상 항목의 작품 언급',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0050946'
        },
        {
          titleKo: '향연치어',
          titleHanja: '鄕宴致語',
          evidence: '한국민족문화대백과 정지상 항목의 작품 언급',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0050946'
        },
        {
          titleKo: '백률사',
          titleHanja: '栢律寺',
          evidence: '한국민족문화대백과 정지상 항목의 작품 언급',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0050946'
        },
        {
          titleKo: '서루',
          titleHanja: '西樓',
          evidence: '한국민족문화대백과 정지상 항목의 작품 언급',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0050946'
        }
      ]
    },
    rightsWork: {
      sourcePolicyStatus: 'identified',
      sourcePolicyId: 'SRC-KORCIS-METADATA',
      commercialRiskStatus: 'review-needed',
      replacementNeededBeforeCommercial: false,
      rightsNotes: '정지상은 KORCIS에서 문집 단위 소재 확인까지 완료했다. 다만 현재 확보한 것은 metadata track이므로, 실제 ingest 전에는 동문선/동경잡기 기준본을 정하고 작품별 수록 위치와 원문 제공 주체의 재사용 조건을 추가 검토해야 한다.'
    },
    nextAction: '동문선/동경잡기 기준본 1~2종을 정하고 5수의 실제 수록 위치를 권·책 기준으로 고정한 뒤, metadata track source policy와 rights review를 붙인다. 정사간집 direct bib는 별도 탐색으로 남긴다',
    blockers: [
      '정사간집 direct KORCIS bib unresolved',
      '5수 poem-level locator not fixed'
    ],
    notes: 'EncyKorea와 KORCIS collection title 검색으로 동문선/동경잡기 계열까지는 확인 완료',
    updatedAt: '2026-04-21 05:34'
  },
  '허난설헌': {
    status: 'researching',
    stage: 'rights-review',
    progressChecklist: {
      authorProfileVerified: true,
      primaryCollectionVerified: true,
      korcisChecked: true,
      encyChecked: true,
      sourcePolicyAssigned: false,
      firstFivePoemsListed: true,
      rightsRiskReviewed: false
    },
    collectionWork: {
      primaryCollectionTitle: '《난설헌집》',
      collectionVerified: true,
      collectionSearchNotes: '한국민족문화대백과 허난설헌 항목과 난설헌집 항목에서 대표작과 시 수(210수)를 확인. KORCIS OpenAPI author 검색에서 난설헌집(REC_KEY 101467826, 국립중앙도서관, DOC_YN Y TOC_YN Y ABS_YN Y), 난설헌시(REC_KEY 101467815, 국립중앙도서관, DOC_YN Y TOC_YN Y ABS_YN Y), 난설헌집 필사본/규장각 소장본(REC_KEY 103435266 등)을 확인.'
    },
    poemCandidateWork: {
      firstFivePoemCandidates: [
        {
          titleKo: '송하곡적갑산',
          titleHanja: '送荷谷謫甲山',
          evidence: '한국민족문화대백과 허난설헌 항목의 작품세계',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0063034'
        },
        {
          titleKo: '기부독서강사',
          titleHanja: '寄夫讀書江舍',
          evidence: '한국민족문화대백과 허난설헌 항목의 작품세계',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0063034'
        },
        {
          titleKo: '곡자',
          titleHanja: '哭子',
          evidence: '한국민족문화대백과 허난설헌 항목 및 난설헌집 항목',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0063034'
        },
        {
          titleKo: '견흥',
          titleHanja: '遣興',
          evidence: '한국민족문화대백과 허난설헌 항목의 작품세계',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0063034'
        },
        {
          titleKo: '빈녀음',
          titleHanja: '貧女吟',
          evidence: '한국민족문화대백과 허난설헌 항목의 작품세계',
          sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0063034'
        }
      ]
    },
    rightsWork: {
      sourcePolicyStatus: 'identified',
      sourcePolicyId: 'SRC-KORCIS-METADATA',
      commercialRiskStatus: 'review-needed',
      replacementNeededBeforeCommercial: false,
      rightsNotes: 'KORCIS에서 국립중앙도서관/규장각 계열 수록본과 원문 여부를 확인. 실제 ingest 전에 원문 제공 주체별 재사용 조건을 추가 검토해야 함.'
    },
    nextAction: '난설헌집 계열 중 국립중앙도서관 원문/목차 제공본을 우선 기준본으로 잡고, 5수의 수록 위치를 판본별로 고정한 뒤 source policy와 rights review를 붙인다',
    notes: 'EncyKorea와 KORCIS로 1차 확인 완료'
  }
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function classifySourceTrack(sourceHint) {
  const hint = sourceHint || '';
  if (hint.includes('《') || hint.includes('집') || hint.includes('전집') || hint.includes('시고')) {
    return 'collection-first';
  }
  if (hint.includes('local fullPoems present')) {
    return 'local-seed-first';
  }
  return 'metadata-first';
}

function makeBoardEntry(author) {
  const sourceTrack = classifySourceTrack(author.representativeSourceHint);
  const entry = {
    batchOrder: author.batchOrder,
    authorKo: author.authorKo,
    authorHanja: author.authorHanja,
    timelineEra: author.timelineEra,
    birthDeath: author.birthDeath,
    sourceTrack,
    collectionPriority: author.collectionPriority,
    status: 'queued',
    stage: 'author-verification',
    progressChecklist: {
      authorProfileVerified: false,
      primaryCollectionVerified: false,
      korcisChecked: false,
      encyChecked: false,
      sourcePolicyAssigned: false,
      firstFivePoemsListed: false,
      rightsRiskReviewed: false
    },
    collectionWork: {
      primaryCollectionTitle: author.representativeSourceHint || '',
      collectionVerified: false,
      collectionSearchNotes: '',
      korcisSearchUrl: author.korcisSearchUrl,
      encyKeywordUrl: author.encyKeywordUrl
    },
    poemCandidateWork: {
      representativeWorkKo: author.representativeWorkKo,
      representativeWorkHanja: author.representativeWorkHanja,
      firstFivePoemCandidates: [],
      candidateCount: 0
    },
    rightsWork: {
      sourcePolicyStatus: 'pending',
      sourcePolicyId: '',
      commercialRiskStatus: 'pending',
      replacementNeededBeforeCommercial: false,
      rightsNotes: ''
    },
    nextAction: author.preferredFirstAction,
    blockers: [],
    targetOutputs: author.targetOutputs,
    notes: author.notes || '',
    updatedAt: null
  };

  const override = AUTHOR_OVERRIDES[author.authorKo];
  if (!override) {
    return entry;
  }

  if (override.status) entry.status = override.status;
  if (override.stage) entry.stage = override.stage;
  if (override.progressChecklist) {
    entry.progressChecklist = {
      ...entry.progressChecklist,
      ...override.progressChecklist
    };
  }
  if (override.collectionWork) {
    entry.collectionWork = {
      ...entry.collectionWork,
      ...override.collectionWork
    };
  }
  if (override.poemCandidateWork) {
    const firstFivePoemCandidates = override.poemCandidateWork.firstFivePoemCandidates || [];
    entry.poemCandidateWork = {
      ...entry.poemCandidateWork,
      ...override.poemCandidateWork,
      candidateCount: firstFivePoemCandidates.length || entry.poemCandidateWork.candidateCount
    };
  }
  if (override.rightsWork) {
    entry.rightsWork = {
      ...entry.rightsWork,
      ...override.rightsWork
    };
  }
  if (override.nextAction) entry.nextAction = override.nextAction;
  if (override.blockers) entry.blockers = override.blockers;
  if (override.notes) entry.notes = override.notes;
  entry.updatedAt = override.updatedAt || '2026-04-20 18:20';

  return entry;
}

function toTsv(entries) {
  const header = [
    'batchOrder',
    'authorKo',
    'authorHanja',
    'timelineEra',
    'birthDeath',
    'sourceTrack',
    'collectionPriority',
    'status',
    'stage',
    'authorProfileVerified',
    'primaryCollectionVerified',
    'korcisChecked',
    'encyChecked',
    'sourcePolicyAssigned',
    'firstFivePoemsListed',
    'rightsRiskReviewed',
    'primaryCollectionTitle',
    'representativeWorkKo',
    'representativeWorkHanja',
    'candidateCount',
    'sourcePolicyStatus',
    'commercialRiskStatus',
    'replacementNeededBeforeCommercial',
    'korcisSearchUrl',
    'encyKeywordUrl',
    'nextAction',
    'blockers',
    'notes',
    'updatedAt'
  ];

  const lines = [header.join('\t')];
  for (const entry of entries) {
    const row = [
      entry.batchOrder,
      entry.authorKo,
      entry.authorHanja,
      entry.timelineEra,
      entry.birthDeath,
      entry.sourceTrack,
      entry.collectionPriority,
      entry.status,
      entry.stage,
      entry.progressChecklist.authorProfileVerified,
      entry.progressChecklist.primaryCollectionVerified,
      entry.progressChecklist.korcisChecked,
      entry.progressChecklist.encyChecked,
      entry.progressChecklist.sourcePolicyAssigned,
      entry.progressChecklist.firstFivePoemsListed,
      entry.progressChecklist.rightsRiskReviewed,
      entry.collectionWork.primaryCollectionTitle,
      entry.poemCandidateWork.representativeWorkKo,
      entry.poemCandidateWork.representativeWorkHanja,
      entry.poemCandidateWork.candidateCount,
      entry.rightsWork.sourcePolicyStatus,
      entry.rightsWork.commercialRiskStatus,
      entry.rightsWork.replacementNeededBeforeCommercial,
      entry.collectionWork.korcisSearchUrl,
      entry.collectionWork.encyKeywordUrl,
      entry.nextAction,
      entry.blockers.join(', '),
      entry.notes,
      entry.updatedAt || ''
    ].map((value) => String(value ?? '').replace(/\t/g, ' ').replace(/\n/g, ' '));
    lines.push(row.join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const input = readJson(INPUT_JSON);
  const authors = input.authors || [];
  const entries = authors.map(makeBoardEntry);

  const out = {
    version: '2026-04-20.v1',
    boardId: 'korean-hansi-priority-11-board',
    purpose: '한국 한시 우선 수집 11명 실행 보드',
    statusGuide: {
      values: ['queued', 'researching', 'collecting', 'rights-review', 'done', 'blocked'],
      stageValues: ['author-verification', 'collection-check', 'poem-candidate-list', 'rights-review', 'ready-for-ingest', 'complete']
    },
    entries
  };

  writeJson(OUT_JSON, out);
  writeText(OUT_TSV, toTsv(entries));

  console.log(`Board entries: ${entries.length}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
