#!/usr/bin/env node
/**
 * build_korean_hansi_jeong_jisang_tranche1.js
 *
 * 목적:
 * - 정지상 wave-1 첫 direct-text tranche를 공개 원문에서 생성한다.
 * - `東文選` 권9/권12/권19에서 정지상 저작 블록만 추출해 작품 입력 JSON과 리포트를 만든다.
 * - 작품 개별 페이지 exact-title보다 공개 권차본에서 실제로 열리는 direct-text 확보량을 우선한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_jeong_jisang_tranche1.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const AUTHOR_ZH = '鄭知常';
const AUTHOR_KO = '정지상';
const RAW_CACHE_DIR = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche1-raw');
const OUT_INPUT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche1.input.v1.json');
const OUT_REPORT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche1.report.v1.json');

const VOLUMES = [
  {
    key: 'volume-9',
    juan: '卷九',
    collectionTitle: '東文選 卷九',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E4%B9%9D',
    rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E4%B9%9D&action=raw'
  },
  {
    key: 'volume-12',
    juan: '卷十二',
    collectionTitle: '東文選 卷十二',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%8D%81%E4%BA%8C',
    rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%8D%81%E4%BA%8C&action=raw'
  },
  {
    key: 'volume-19',
    juan: '卷十九',
    collectionTitle: '東文選 卷十九',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%8D%81%E4%B9%9D',
    rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E5%8D%81%E4%B9%9D&action=raw'
  }
];

const BOARD_TARGETS = ['送人', '新雪', '鄕宴致語', '栢律寺', '西樓'];
const HAN_RE = /[\u3400-\u9FFF]/;

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function cachePathFor(volume) {
  return path.join(RAW_CACHE_DIR, `${volume.key}.raw.txt`);
}

function fetchRaw(volume) {
  fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
  const cachePath = cachePathFor(volume);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8');
  }

  const out = execFileSync('curl', ['-sSL', '--connect-timeout', '5', '--max-time', '20', volume.rawUrl], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (!out || !out.trim()) {
    throw new Error(`${volume.collectionTitle} raw fetch returned empty response`);
  }
  fs.writeFileSync(cachePath, out, 'utf8');
  return out;
}

function stripTemplates(text) {
  return text
    .replace(/{{header2[\s\S]*?}}\n?/g, '')
    .replace(/{{right\|[^}]+}}\n?/g, '')
    .replace(/{{*?\|[^{}]*}}/g, '')
    .replace(/{{[^{}]*}}/g, '')
    .replace(/<sub>.*?<\/sub>/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1');
}

function normalizeTitle(title) {
  return stripTemplates(title)
    .replace(/[，、]/g, ' ')
    .replace(/[（）〈〉]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAuthor(value) {
  return stripTemplates(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPoemLines(body) {
  const exploded = [];

  for (const rawLine of stripTemplates(body).split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('==') || !HAN_RE.test(line)) continue;

    const parts = line
      .split(/[。？！；]/)
      .map((part) => part.replace(/[，、]/g, '').trim())
      .filter(Boolean);

    exploded.push(...parts);
  }

  return exploded;
}

function parseVolume(volume, raw) {
  const lines = raw.split('\n');
  const poems = [];
  let currentSection = '';
  let currentTitle = '';
  let currentBody = [];
  let currentAuthor = null;

  function flush() {
    if (!currentTitle) return;

    const bodyText = currentBody.join('\n');
    const authorMatch = bodyText.match(/^\s*{{right\|([^}]+)}}/m);
    if (authorMatch) {
      currentAuthor = normalizeAuthor(authorMatch[1]);
    }
    const authorForEntry = currentAuthor;
    const cleanedLines = cleanPoemLines(bodyText);

    if (authorForEntry === AUTHOR_ZH && cleanedLines.length > 0) {
      poems.push({
        title: normalizeTitle(currentTitle),
        poemZh: cleanedLines.join('\n'),
        section: currentSection,
        volumeKey: volume.key,
        juan: volume.juan,
        collectionTitle: volume.collectionTitle,
        sourceUrl: volume.sourceUrl
      });
    }

    currentTitle = '';
    currentBody = [];
  }

  for (const line of lines) {
    if (/^==[^=].*==$/u.test(line)) {
      flush();
      currentSection = normalizeTitle(line.replace(/^==|==$/g, ''));
      continue;
    }
    if (/^===.*===$/u.test(line)) {
      flush();
      currentTitle = line.replace(/^===|===$/g, '').trim();
      continue;
    }
    if (currentTitle) {
      currentBody.push(line);
    }
  }

  flush();
  return poems;
}

function inferForm(poemZh) {
  const lines = poemZh
    .split('\n')
    .map((line) => line.replace(/\s/g, '').trim())
    .filter(Boolean);

  if (lines.length === 0) return '미상';
  const normalizedLengths = lines.map((line) => {
    const length = line.length;
    if (length % 2 === 0) {
      const half = length / 2;
      if (half === 5 || half === 7) return half;
    }
    return length;
  });

  const lengths = [...new Set(normalizedLengths)];
  if (lengths.length !== 1) return '미상';

  if (lines.length === 1 && lengths[0] === 7) return '칠언절구-절편';
  if (lines.length === 1 && lengths[0] === 5) return '오언절구-절편';
  if (lines.length === 4 && lengths[0] === 5) return '오언절구';
  if (lines.length === 4 && lengths[0] === 7) return '칠언절구';
  if (lines.length === 2 && lengths[0] === 5) return '오언절구';
  if (lines.length === 2 && lengths[0] === 7) return '칠언절구';
  if (lines.length === 8 && lengths[0] === 5) return '오언율시';
  if (lines.length === 8 && lengths[0] === 7) return '칠언율시';
  if (lines.length === 4 && lengths[0] === 10) return '오언율시';
  if (lines.length === 4 && lengths[0] === 14) return '칠언율시';
  if (lines.length >= 5 && lengths[0] === 5) return '오언고시';
  if (lines.length >= 5 && lengths[0] === 7) return '칠언고시';
  return '미상';
}

function buildRecords(poems) {
  return poems.map((poem, index) => {
    const seq = String(index + 1).padStart(4, '0');
    return {
      poemId: `KHS-JEONG-W1-${seq}`,
      canonicalId: `KHS-CANON-JEONG-JISANG-W1-${seq}`,
      title: {
        zh: poem.title,
        ko: poem.title
      },
      author: {
        authorId: 'KAUTH-JEONG-JISANG',
        zh: AUTHOR_ZH,
        ko: AUTHOR_KO
      },
      era: {
        label: '고려 중기',
        startYear: 1100,
        endYear: 1135,
        confidence: 'medium'
      },
      genre: {
        broad: '한시',
        form: inferForm(poem.poemZh)
      },
      sourceWork: {
        collectionTitle: poem.collectionTitle,
        juan: poem.juan,
        entryTitle: poem.title,
        sourceUrl: poem.sourceUrl,
        sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
      },
      text: {
        poemZh: poem.poemZh,
        poemKoReading: null,
        poemKoGloss: null
      },
      legacyAssets: {
        translationKo: null,
        notes: [],
        commentaryKo: null
      },
      ownedAssets: {
        translationKoOwned: null,
        notesOwned: [],
        commentaryKoOwned: null
      },
      rights: {},
      commercialTransition: {
        isCommercialReady: false,
        blockingAssets: [],
        replacementRequired: []
      }
    };
  });
}

function buildReport(records) {
  const formCounts = {};
  const volumeCounts = {};
  const collectedTitles = new Set(records.map((record) => record.title.zh));

  for (const record of records) {
    const formKey = record.genre.form;
    formCounts[formKey] = (formCounts[formKey] || 0) + 1;
    const volumeKey = record.sourceWork.juan;
    volumeCounts[volumeKey] = (volumeCounts[volumeKey] || 0) + 1;
  }

  return {
    version: '2026-04-21.v1',
    batchId: 'korean-hansi-jeong-jisang-tranche1',
    purpose: '정지상 direct-text tranche 1 from 東文選 卷九/卷十二/卷十九',
    sourceCollections: VOLUMES.map((volume) => ({
      collectionTitle: volume.collectionTitle,
      juan: volume.juan,
      sourceUrl: volume.sourceUrl,
      sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
    })),
    totalCollected: records.length,
    formCounts,
    volumeCounts,
    matchedSeedTitles: BOARD_TARGETS.filter((title) => collectedTitles.has(title)),
    unresolvedSeedTitles: BOARD_TARGETS.filter((title) => !collectedTitles.has(title)),
    sourceValidationIssues: [
      '`東文選` 공개 권차본에서는 `送人`, `新雪`은 direct-text로 확인되지만 `鄕宴致語`, `栢律寺`, `西樓`는 이번 tranche 대상 권차에서 아직 직접 확보하지 못했다',
      '`卷十九`의 `西樓觀雪`, `西樓晚望`는 현재 저자 블록상 정지상이 아니라 다른 저작자 묶음에 속하므로 board target `西樓`로 오인 수집하지 않았다'
    ],
    notes: [
      '이번 tranche는 exact-title 완전일치보다 공개 원문 direct-text 확보량을 우선했다',
      '정지상은 작품 개별 페이지보다 `東文選` 권차본에서 연속 수집하는 쪽이 현재 더 안정적이다',
      '후속 tranche에서는 `東文選` 추가 권차와 `東京雜記` 계열을 병행해 `鄕宴致語`, `栢律寺`, `西樓` locator를 보강한다'
    ]
  };
}

function main() {
  const poems = [];
  for (const volume of VOLUMES) {
    const raw = fetchRaw(volume);
    poems.push(...parseVolume(volume, raw));
  }

  if (poems.length === 0) {
    throw new Error('정지상 tranche 1에서 수집된 작품이 없습니다.');
  }

  const records = buildRecords(poems);
  const report = buildReport(records);

  writeJson(OUT_INPUT, records);
  writeJson(OUT_REPORT, report);

  console.log(`Collected poems: ${records.length}`);
  console.log(`Input JSON: ${OUT_INPUT}`);
  console.log(`Report JSON: ${OUT_REPORT}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
