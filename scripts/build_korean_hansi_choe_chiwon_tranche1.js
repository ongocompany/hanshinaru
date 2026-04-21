#!/usr/bin/env node
/**
 * build_korean_hansi_choe_chiwon_tranche1.js
 *
 * 목적:
 * - 최치원 wave-1 첫 direct-text tranche를 실제 공개 원문에서 생성한다.
 * - `孤雲集/卷一`의 시(詩) 섹션을 기준으로 작품 단위 입력 JSON과 리포트를 만든다.
 * - 개별 작품 페이지보다 권차본을 기준본으로 잡아 author mismatch 같은 실전 이슈를 피한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_choe_chiwon_tranche1.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAW_URL = 'https://zh.wikisource.org/w/index.php?title=%E5%AD%A4%E9%9B%B2%E9%9B%86/%E5%8D%B7%E4%B8%80&action=raw';
const SOURCE_URL = 'https://zh.wikisource.org/wiki/%E5%AD%A4%E9%9B%B2%E9%9B%86/%E5%8D%B7%E4%B8%80';
const RAW_CACHE_DIR = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-choe-chiwon-tranche1-raw');
const RAW_CACHE_PATH = path.join(RAW_CACHE_DIR, 'gounjip-volume-1.raw.txt');
const OUT_INPUT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-choe-chiwon-tranche1.input.v1.json');
const OUT_REPORT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-choe-chiwon-tranche1.report.v1.json');

const HAN_RE = /[\u3400-\u9FFF]/;

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function fetchRaw() {
  fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
  if (fs.existsSync(RAW_CACHE_PATH)) {
    return fs.readFileSync(RAW_CACHE_PATH, 'utf8');
  }

  const out = execFileSync('curl', ['-sSL', '--connect-timeout', '5', '--max-time', '20', RAW_URL], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (!out || !out.trim()) {
    throw new Error('孤雲集/卷一 raw fetch returned empty response');
  }
  fs.writeFileSync(RAW_CACHE_PATH, out, 'utf8');
  return out;
}

function stripTemplates(text) {
  return text
    .replace(/{{ul\|([^{}|]+)}}/g, '$1')
    .replace(/{{\*\|[^{}]*}}/g, '')
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

function extractPoetrySection(raw) {
  const match = raw.match(/==詩==\n([\s\S]*?)\n==表==/);
  if (!match) {
    throw new Error('孤雲集/卷一에서 詩 섹션을 찾지 못했습니다.');
  }
  return match[1];
}

function parsePoems(section) {
  const parts = section.split(/^===/m).slice(1);
  const poems = [];

  for (const part of parts) {
    const endOfTitle = part.indexOf('===');
    if (endOfTitle === -1) continue;

    const rawTitle = part.slice(0, endOfTitle).trim();
    const title = normalizeTitle(rawTitle);
    const body = part.slice(endOfTitle + 3);

    const cleanedLines = stripTemplates(body)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('===') && !line.startsWith('==') && HAN_RE.test(line))
      .map((line) => line.replace(/[。？！；，]/g, ''))
      .filter(Boolean);

    if (!title || cleanedLines.length === 0) continue;

    poems.push({
      title,
      poemZh: cleanedLines.join('\n')
    });
  }

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
      poemId: `KHS-CHOE-W1-${seq}`,
      canonicalId: `KHS-CANON-CHOE-CHIWON-W1-${seq}`,
      title: {
        zh: poem.title,
        ko: poem.title
      },
      author: {
        authorId: 'KAUTH-CHOE-CHIWON',
        zh: '崔致遠',
        ko: '최치원'
      },
      era: {
        label: '신라 말',
        startYear: 857,
        endYear: 940,
        confidence: 'medium'
      },
      genre: {
        broad: '한시',
        form: inferForm(poem.poemZh)
      },
      sourceWork: {
        collectionTitle: '孤雲集 卷一',
        juan: '卷一',
        entryTitle: poem.title,
        sourceUrl: SOURCE_URL,
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
  for (const record of records) {
    const key = record.genre.form;
    formCounts[key] = (formCounts[key] || 0) + 1;
  }

  return {
    version: '2026-04-21.v1',
    batchId: 'korean-hansi-choe-chiwon-tranche1',
    purpose: '최치원 direct-text tranche 1 from 孤雲集 卷一',
    source: {
      collectionTitle: '孤雲集 卷一',
      sourceUrl: SOURCE_URL,
      sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
    },
    totalCollected: records.length,
    formCounts,
    sourceValidationIssues: [
      '개별 작품 페이지 `寓興`은 현재 위키문헌에서 權德輿로 연결되어 author mismatch가 있으므로 tranche 1 기준본에서 제외하고 `孤雲集/卷一`를 canonical source로 사용했다'
    ],
    notes: [
      '이번 tranche는 exact-title 정합성보다 공개 원문 direct-text 확보량을 우선했다',
      '권1만으로 최치원 시 다발이 확보되므로 wave-1 첫 실제 수집본으로 적합하다',
      '후속 tranche에서는 `孤雲集/卷二/卷三`, `桂苑筆耕集`, `東文選`, `三國史記`를 병행해 확장한다'
    ]
  };
}

function main() {
  const raw = fetchRaw();
  const poetrySection = extractPoetrySection(raw);
  const poems = parsePoems(poetrySection);
  if (poems.length === 0) {
    throw new Error('최치원 tranche 1에서 수집된 작품이 없습니다.');
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
