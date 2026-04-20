#!/usr/bin/env node
/**
 * build_korean_hansi_pilot_url_sheet.js
 *
 * 목적:
 * - 파일럿 50명 문서를 읽어 machine-readable URL 시트를 생성한다.
 * - local timeline 데이터로 한자명/생몰/대표작 힌트를 보강한다.
 * - 1차 수집용 KORCIS / EncyKorea URL을 자동 생성한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_pilot_url_sheet.js
 */

const fs = require('fs');
const path = require('path');

const PILOT_DOC = path.join(__dirname, '..', 'docs', 'research', '2026-04-20-korean-hansi-pilot-authors.md');
const TIMELINE_JSON = path.join(__dirname, '..', 'public', 'index', 'korean_timeline.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-pilot-50-url-sheet.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-pilot-50-url-sheet.v1.tsv');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function encodeQuery(value) {
  return encodeURIComponent(value);
}

function buildKorcisUrl(query) {
  return `https://www.nl.go.kr/korcis/search/simpleResultList.do?searchCondition=all&searchKeyword=${encodeQuery(query)}`;
}

function buildEncyKeywordUrl(authorKo, authorHanja) {
  const keyword = authorHanja && authorHanja !== '미상'
    ? `${authorKo}(${authorHanja})`
    : authorKo;
  return `https://encykorea.aks.ac.kr/Article/Keyword/${encodeQuery(keyword)}`;
}

function parsePilotAuthors(markdown) {
  const rows = [];
  let cohort = '';

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('## 2. A군')) cohort = 'A';
    else if (line.startsWith('## 3. B군')) cohort = 'B';
    else if (line.startsWith('## 4. C군')) cohort = 'C';
    else if (line.startsWith('## 5. D군')) cohort = 'D';

    if (!line.startsWith('|')) continue;
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 5) continue;
    const no = parts[1];
    const era = parts[2];
    const authorKo = parts[3];
    const reason = parts[4];
    if (!/^\d+$/.test(no)) continue;

    rows.push({
      no: Number(no),
      cohort,
      pilotEra: era,
      authorKo,
      reason
    });
  }

  return rows;
}

function makeTimelineIndex(timeline) {
  const byKo = new Map();

  for (const era of timeline.eras || []) {
    for (const poet of era.poets || []) {
      byKo.set(poet.name.ko, {
        timelineEra: era.name,
        authorHanja: poet.name.hanja || '',
        birthDeath: poet.birth_death || '',
        bio: poet.bio || '',
        fullPoems: poet.fullPoems || [],
        otherWorks: poet.otherWorks || []
      });
    }
  }

  return byKo;
}

function chooseRepresentative(local) {
  if (!local) {
    return {
      workTitleKo: '',
      workTitleHanja: '',
      sourceHint: '',
      fullPoemsCount: 0,
      otherWorksCount: 0
    };
  }

  const fullPoems = local.fullPoems || [];
  const otherWorks = local.otherWorks || [];

  if (fullPoems.length > 0) {
    const poem = fullPoems[0];
    return {
      workTitleKo: poem.title?.한글 || '',
      workTitleHanja: poem.title?.한자 || '',
      sourceHint: 'local fullPoems present',
      fullPoemsCount: fullPoems.length,
      otherWorksCount: otherWorks.length
    };
  }

  if (otherWorks.length > 0) {
    const work = otherWorks[0];
    return {
      workTitleKo: work.titleKo || '',
      workTitleHanja: work.titleHanja || '',
      sourceHint: work.source || '',
      fullPoemsCount: fullPoems.length,
      otherWorksCount: otherWorks.length
    };
  }

  return {
    workTitleKo: '',
    workTitleHanja: '',
    sourceHint: '',
    fullPoemsCount: 0,
    otherWorksCount: 0
  };
}

function buildRecords(pilotRows, timelineIndex) {
  return pilotRows.map((row) => {
    const local = timelineIndex.get(row.authorKo);
    const rep = chooseRepresentative(local);
    const authorHanja = local?.authorHanja || '';
    const korcisQuery = authorHanja && authorHanja !== '미상' ? `${row.authorKo} ${authorHanja}` : row.authorKo;

    return {
      no: row.no,
      cohort: row.cohort,
      pilotEra: row.pilotEra,
      timelineEra: local?.timelineEra || '',
      authorKo: row.authorKo,
      authorHanja,
      birthDeath: local?.birthDeath || '',
      selectionReason: row.reason,
      fullPoemsCount: rep.fullPoemsCount,
      otherWorksCount: rep.otherWorksCount,
      representativeWorkKo: rep.workTitleKo,
      representativeWorkHanja: rep.workTitleHanja,
      representativeSourceHint: rep.sourceHint,
      korcisSearchUrl: buildKorcisUrl(korcisQuery),
      encyKeywordUrl: buildEncyKeywordUrl(row.authorKo, authorHanja),
      preferredFirstAction: rep.fullPoemsCount > 0
        ? 'local fullPoems 기준 대표작 확인 후 KORCIS/EncyKorea로 출전 확장'
        : 'KORCIS로 저자/문집 탐색 후 representative source hint 대조',
      notes: rep.sourceHint || local?.bio || ''
    };
  });
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function toTsv(rows) {
  const header = [
    'no',
    'cohort',
    'pilotEra',
    'timelineEra',
    'authorKo',
    'authorHanja',
    'birthDeath',
    'selectionReason',
    'fullPoemsCount',
    'otherWorksCount',
    'representativeWorkKo',
    'representativeWorkHanja',
    'representativeSourceHint',
    'korcisSearchUrl',
    'encyKeywordUrl',
    'preferredFirstAction',
    'notes'
  ];

  const lines = [header.join('\t')];
  for (const row of rows) {
    const values = header.map((key) => String(row[key] ?? '').replace(/\t/g, ' ').replace(/\n/g, ' '));
    lines.push(values.join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const markdown = readText(PILOT_DOC);
  const timeline = readJson(TIMELINE_JSON);
  const pilotRows = parsePilotAuthors(markdown);
  const timelineIndex = makeTimelineIndex(timeline);
  const records = buildRecords(pilotRows, timelineIndex);

  writeJson(OUT_JSON, records);
  fs.writeFileSync(OUT_TSV, toTsv(records), 'utf8');

  console.log(`Pilot authors parsed: ${pilotRows.length}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
