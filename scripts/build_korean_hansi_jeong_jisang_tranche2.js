#!/usr/bin/env node
/**
 * build_korean_hansi_jeong_jisang_tranche2.js
 *
 * 목적:
 * - 정지상 wave-1 두 번째 direct-text tranche를 공개 원문에서 생성한다.
 * - `東文選 卷一百四`의 `冊王太子御宴致語`와 `新增東國輿地勝覽 卷021`의 `柏栗寺`를 수집한다.
 * - board seed `西樓`는 exact-title direct-text는 미확정으로 남기되, documented alias 규칙으로
 *   `栢栗寺西樓` / `柏栗寺` 수록시와 연결 가능한지까지 함께 기록한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_jeong_jisang_tranche2.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const AUTHOR_ZH = '鄭知常';
const AUTHOR_KO = '정지상';
const RAW_CACHE_DIR = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche2-raw');
const OUT_INPUT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche2.input.v1.json');
const OUT_REPORT = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche2.report.v1.json');

const SOURCES = {
  DONGMUN_104: {
    key: 'dongmun-104',
    collectionTitle: '東文選 卷一百四',
    juan: '卷一百四',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E4%B8%80%E7%99%BE%E5%9B%9B',
    rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E6%9D%B1%E6%96%87%E9%81%B8/%E5%8D%B7%E4%B8%80%E7%99%BE%E5%9B%9B&action=raw'
  },
  YEOJI_21: {
    key: 'yeoji-21',
    collectionTitle: '新增東國輿地勝覽 卷021',
    juan: '卷021',
    sourceUrl: 'https://zh.wikisource.org/zh/%E6%96%B0%E5%A2%9E%E6%9D%B1%E5%9C%8B%E8%BC%BF%E5%9C%B0%E5%8B%9D%E8%A6%BD/%E5%8D%B7021',
    rawUrl: 'https://zh.wikisource.org/w/index.php?title=%E6%96%B0%E5%A2%9E%E6%9D%B1%E5%9C%8B%E8%BC%BF%E5%9C%B0%E5%8B%9D%E8%A6%BD/%E5%8D%B7021&action=raw'
  }
};

const DOCUMENTED_ALIAS_RESOLUTIONS = [
  {
    seedTitle: '西樓',
    resolvedViaRecordTitle: '栢律寺',
    normalizedSourceTitle: '柏栗寺',
    aliasTitle: '栢栗寺西樓',
    resolutionPolicy: 'documented-alias',
    evidence: [
      {
        sourceType: 'primary',
        sourceTitle: '東京雜記 卷二',
        sourceUrl: 'https://zh.wikisource.org/zh-hant/%E6%9D%B1%E4%BA%AC%E9%9B%9C%E8%A8%98/%E5%8D%B7%E4%BA%8C',
        note: '`栢栗寺` 항목 아래 `全思敬西樓記`와 정지상 시 전문이 연속으로 실려 있어 `西樓` tower context와 같은 작품권역임을 보여준다'
      },
      {
        sourceType: 'primary',
        sourceTitle: '新增東國輿地勝覽 卷021',
        sourceUrl: SOURCES.YEOJI_21.sourceUrl,
        note: '동일 시가 `柏栗寺` 항목 아래 그대로 전하며, `西樓`는 절의 누정 맥락으로 보존된다'
      },
      {
        sourceType: 'secondary',
        sourceTitle: '茶事典籍을 通해 본 宋과 高麗의 茶文化 考察',
        sourceUrl: 'https://repository.sungshin.ac.kr/bitstream/2025.oak/2839/2/%E8%8C%B6%E4%BA%8B%E5%85%B8%E7%B1%8D%EC%9D%84%20%E9%80%9A%ED%95%B4%20%EB%B3%B8%20%E5%AE%8B%EA%B3%BC%20%E9%AB%98%E9%BA%97%EC%9D%98%20%EF%A7%BE%E6%96%87%E5%8C%96%20%E8%80%83%E5%AF%9F.pdf',
        note: '표 7에서 정지상의 작품명을 `栢栗寺西樓`로 적어 후대 연구에서 documented alias로 유통됨을 보여준다'
      }
    ]
  }
];

const HAN_RE = /[\u3400-\u9FFF]/;

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function cachePathFor(source) {
  return path.join(RAW_CACHE_DIR, `${source.key}.raw.txt`);
}

function fetchRaw(source) {
  fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
  const cachePath = cachePathFor(source);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8');
  }

  const out = execFileSync('curl', ['-sSL', '--connect-timeout', '5', '--max-time', '20', source.rawUrl], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (!out || !out.trim()) {
    throw new Error(`${source.collectionTitle} raw fetch returned empty response`);
  }
  fs.writeFileSync(cachePath, out, 'utf8');
  return out;
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function stripTemplates(text) {
  return normalizeNewlines(text)
    .replace(/{{header2[\s\S]*?}}\n?/g, '')
    .replace(/{{right\|[^}]+}}\n?/g, '')
    .replace(/{{ul\|([^}]+)}}/g, '$1')
    .replace(/{{另\|([^|}]+)\|[^}]+}}/g, '$1')
    .replace(/{{\*\|[^}]+}}/g, '')
    .replace(/{{[^{}]*}}/g, '')
    .replace(/<sub>.*?<\/sub>/g, '')
    .replace(/<ref[^>]*>.*?<\/ref>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1');
}

function collapseBlankLines(text) {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function splitSentences(text, delimiterRe) {
  return text
    .split(delimiterRe)
    .map((line) => line.replace(/[，。？！]/g, '').trim())
    .filter(Boolean);
}

function inferForm(poemZh) {
  const lines = poemZh
    .split('\n')
    .map((line) => line.replace(/\s/g, '').trim())
    .filter((line) => HAN_RE.test(line));

  if (lines.length === 0) return '미상';
  const lengths = [...new Set(lines.map((line) => line.length))];
  if (lengths.length !== 1) return '미상';

  if (lines.length === 1 && lengths[0] === 7) return '칠언절구-절편';
  if (lines.length === 1 && lengths[0] === 5) return '오언절구-절편';
  if (lines.length === 4 && lengths[0] === 5) return '오언절구';
  if (lines.length === 4 && lengths[0] === 7) return '칠언절구';
  if (lines.length === 8 && lengths[0] === 5) return '오언율시';
  if (lines.length === 8 && lengths[0] === 7) return '칠언율시';
  if (lines.length >= 5 && lengths[0] === 5) return '오언고시';
  if (lines.length >= 5 && lengths[0] === 7) return '칠언고시';
  return '미상';
}

function extractHyangyeonChieo(raw) {
  const clean = collapseBlankLines(stripTemplates(raw));
  const match = clean.match(/===冊王太子御宴致語===\n([\s\S]*?)\n===/);
  if (!match) {
    throw new Error('東文選 卷一百四에서 冊王太子御宴致語 블록을 찾지 못했습니다.');
  }

  const lines = match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error('冊王太子御宴致語 본문이 예상보다 짧습니다.');
  }

  const prose = lines[0];
  const closingVerse = splitSentences(lines.slice(1).join('\n'), /[。]/);

  return {
    titleZh: '鄕宴致語',
    titleKo: '향연치어',
    genreForm: '致語',
    source: SOURCES.DONGMUN_104,
    sourceEntryTitle: '冊王太子御宴致語',
    poemZh: [prose, ...closingVerse].join('\n')
  };
}

function extractBaekryulsa(raw) {
  const normalizedRaw = normalizeNewlines(raw);
  if (!/====柏栗寺====/.test(normalizedRaw)) {
    throw new Error('新增東國輿地勝覽 卷021에서 柏栗寺 섹션을 찾지 못했습니다.');
  }

  const poemMatch = normalizedRaw.match(/○\{\{ul\|鄭知常}}詩：([\s\S]*?)\n\n○\{\{ul\|朴孝修}}詩：/);
  if (!poemMatch) {
    throw new Error('新增東國輿地勝覽 卷021에서 鄭知常 柏栗寺 본문을 찾지 못했습니다.');
  }

  const poemLines = splitSentences(stripTemplates(poemMatch[1]), /[，。？！]/);
  const poemZh = poemLines.join('\n');

  return {
    titleZh: '栢律寺',
    titleKo: '백률사',
    genreForm: inferForm(poemZh),
    source: SOURCES.YEOJI_21,
    sourceEntryTitle: '柏栗寺',
    poemZh
  };
}

function buildRecord(entry, index) {
  const seq = String(index + 1).padStart(4, '0');
  return {
    poemId: `KHS-JEONG-W1-T2-${seq}`,
    canonicalId: `KHS-CANON-JEONG-JISANG-W1-T2-${seq}`,
    title: {
      zh: entry.titleZh,
      ko: entry.titleKo
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
      form: entry.genreForm
    },
    sourceWork: {
      collectionTitle: entry.source.collectionTitle,
      juan: entry.source.juan,
      entryTitle: entry.sourceEntryTitle,
      sourceUrl: entry.source.sourceUrl,
      sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
    },
    text: {
      poemZh: entry.poemZh,
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
}

function buildReport(records) {
  const formCounts = {};
  const matchedSeedTitles = ['鄕宴致語', '栢律寺'];
  const aliasResolvedSeedTitles = DOCUMENTED_ALIAS_RESOLUTIONS.map((item) => item.seedTitle);

  for (const record of records) {
    const key = record.genre.form;
    formCounts[key] = (formCounts[key] || 0) + 1;
  }

  return {
    version: '2026-04-22.v1',
    batchId: 'korean-hansi-jeong-jisang-tranche2',
    purpose: '정지상 direct-text tranche 2 from 東文選 卷一百四 / 新增東國輿地勝覽 卷021',
    sourceCollections: Object.values(SOURCES).map((source) => ({
      collectionTitle: source.collectionTitle,
      juan: source.juan,
      sourceUrl: source.sourceUrl,
      sourcePolicyId: 'SRC-WIKISOURCE-TEXT'
    })),
    totalCollected: records.length,
    formCounts,
    matchedSeedTitles,
    aliasResolvedSeedTitles,
    documentedAliasResolutions: DOCUMENTED_ALIAS_RESOLUTIONS,
    unresolvedSeedTitles: [],
    sourceValidationIssues: [
      '`東文選 卷一百四`의 `冊王太子御宴致語`를 board seed `鄕宴致語`의 direct-text locator로 채택했다',
      '`新增東國輿地勝覽 卷021`의 `柏栗寺`를 board seed `栢律寺`의 이체자 표기 direct-text locator로 채택했다',
      '`東文選 卷十九`의 `西樓觀雪`, `西樓晚望`는 `金克己` 저작 블록에 있으므로 board seed `西樓`의 exact-title locator로 채택하지 않았다',
      '`東京雜記 卷二` / `新增東國輿地勝覽 卷021`의 `栢栗寺` 수록시와 후대 표기 `栢栗寺西樓`를 근거로 `西樓`는 documented alias 규칙으로 해소했다'
    ],
    notes: [
      '이번 tranche는 공개 원문에서 직접 열리는 seed title 보강에 집중했다',
      '`鄕宴致語`는 시 본문이 아니라 `致語` 본문과 말미 `口號`를 함께 보존했다',
      '정지상 wave-1 seed 5건은 이제 4건 direct-text + 1건 documented alias(`西樓` -> `栢栗寺西樓`) 규칙으로 모두 해소했다'
    ]
  };
}

function main() {
  const hyangyeon = extractHyangyeonChieo(fetchRaw(SOURCES.DONGMUN_104));
  const baekryulsa = extractBaekryulsa(fetchRaw(SOURCES.YEOJI_21));
  const records = [hyangyeon, baekryulsa].map(buildRecord);
  const report = buildReport(records);

  writeJson(OUT_INPUT, records);
  writeJson(OUT_REPORT, report);

  console.log(`Collected records: ${records.length}`);
  console.log(`Wrote: ${OUT_INPUT}`);
  console.log(`Wrote: ${OUT_REPORT}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
