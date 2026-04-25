#!/usr/bin/env node
/**
 * build_korean_poet_chronology_catalog.js
 *
 * 목적:
 * - `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`를
 *   시인 catalog와 작품 catalog로 분리한다.
 * - 이미 확보된 한국 한시 direct-text records를 작품 catalog에 매핑한다.
 * - 기준본은 docs/spec에, 사이트에서 fetch 가능한 mirror는 public/index에 저장한다.
 *
 * 사용법:
 *   node scripts/build_korean_poet_chronology_catalog.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEED_DOC = path.join(ROOT, 'docs', 'research', '2026-04-25-korean-poet-chronology-seed-catalog.md');
const WAVE_BATCH = path.join(ROOT, 'docs', 'spec', 'korean-hansi-famous-authors-wave1-batch.v1.json');
const TIMELINE = path.join(ROOT, 'public', 'index', 'korean_timeline.json');
const RECORD_FILES = [
  path.join(ROOT, 'docs', 'spec', 'korean-hansi-choe-chiwon-tranche1.records.v1.json'),
  path.join(ROOT, 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche1.records.v1.json'),
  path.join(ROOT, 'docs', 'spec', 'korean-hansi-jeong-jisang-tranche2.records.v1.json')
];

const OUT_POETS = path.join(ROOT, 'docs', 'spec', 'korean-poets-chronology.v1.json');
const OUT_POEMS = path.join(ROOT, 'docs', 'spec', 'korean-poems-chronology.v1.json');
const OUT_PUBLIC_POETS = path.join(ROOT, 'public', 'index', 'korean_poets_chronology.v1.json');
const OUT_PUBLIC_POEMS = path.join(ROOT, 'public', 'index', 'korean_poems_chronology.v1.json');

const AUTHOR_ID_OVERRIDES = {
  '최치원': 'KAUTH-CHOE-CHIWON',
  '정지상': 'KAUTH-JEONG-JISANG',
  '허난설헌': 'KAUTH-HEO-NANSEOLHEON'
};

const ROMAN_SLUG_OVERRIDES = {
  '최치원': 'choe-chiwon',
  '박인량': 'bak-inryang',
  '김부식': 'kim-busik',
  '정지상': 'jeong-jisang',
  '이규보': 'yi-gyubo',
  '김극기': 'kim-geukgi',
  '이인로': 'yi-inro',
  '이제현': 'yi-jehyeon',
  '이색': 'yi-saek',
  '정몽주': 'jeong-mongju',
  '정도전': 'jeong-dojeon',
  '권근': 'gwon-geun',
  '김시습': 'kim-siseup',
  '서거정': 'seo-geojeong',
  '김종직': 'kim-jongjik',
  '이황': 'yi-hwang',
  '이이': 'yi-i',
  '정철': 'jeong-cheol',
  '권필': 'gwon-pil',
  '허난설헌': 'heo-nanseolheon',
  '허균': 'heo-gyun',
  '박지원': 'bak-jiwon',
  '이덕무': 'yi-deokmu',
  '정약용': 'jeong-yagyong',
  '김정희': 'kim-jeonghui',
  '황현': 'hwang-hyeon',
  '김택영': 'kim-taekyeong',
  '신위': 'sin-wi'
};

const GENRE_HINTS = [
  { pattern: /향가|祭亡妹歌|兜率歌|讚耆婆郞歌|安民歌|遇賊歌|彗星歌|怨歌|處容歌|普賢十願歌/u, broad: '고유시가', form: '향가', track: 'native-form' },
  { pattern: /고려가요|鄭瓜亭曲/u, broad: '고유시가', form: '고려가요', track: 'native-form' },
  { pattern: /시조|丹心歌|묏버들/u, broad: '고유시가', form: '시조', track: 'native-form' },
  { pattern: /가사|關東別曲|사미인곡/u, broad: '고유시가', form: '가사', track: 'native-form' },
  { pattern: /설화|花王戒/u, broad: '고전시문', form: '설화/교훈 시문', track: 'context-work' },
  { pattern: /致語/u, broad: '한시', form: '치어', track: 'hansi-direct-text' }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function stripBackticks(value) {
  return value.replace(/`/g, '').trim();
}

function extractName(raw) {
  const match = raw.match(/^(.+?)\((.+?)\)$/u);
  if (!match) {
    return { ko: raw.trim(), hanja: null };
  }
  return { ko: match[1].trim(), hanja: match[2].trim() };
}

function slugifyAuthor(nameKo) {
  if (ROMAN_SLUG_OVERRIDES[nameKo]) return ROMAN_SLUG_OVERRIDES[nameKo];
  return nameKo
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || `author-${Buffer.from(nameKo).toString('hex').slice(0, 8)}`;
}

function authorIdFor(nameKo) {
  return AUTHOR_ID_OVERRIDES[nameKo] || `KAUTH-${slugifyAuthor(nameKo).toUpperCase().replace(/-/g, '-')}`;
}

function parseBirthDeath(value) {
  const nums = [...value.matchAll(/\d{3,4}/g)].map((m) => Number(m[0]));
  return {
    raw: value,
    birth: nums[0] || null,
    death: nums[1] || null,
    uncertain: /미상|\?|활동|이후|전환기/u.test(value)
  };
}

function parseWorkCandidates(value) {
  const cleaned = stripBackticks(value);
  return cleaned
    .split(/,|、|，|;/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^《|》$/g, '').trim())
    .filter(Boolean);
}

function inferGenre(authorRow, title) {
  const haystack = `${title} ${authorRow.sourceHint} ${authorRow.notes}`;
  const hint = GENRE_HINTS.find((item) => item.pattern.test(haystack));
  if (hint) {
    return { broad: hint.broad, form: hint.form, track: hint.track };
  }
  return { broad: '한시', form: '미확정', track: 'hansi-candidate' };
}

function extractTableRows(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return [];
  const rest = markdown.slice(start);
  const next = rest.slice(1).search(/\n## /u);
  const section = next === -1 ? rest : rest.slice(0, next + 1);
  return section
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .slice(1)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length > 0);
}

function buildSeedAuthors() {
  const markdown = fs.readFileSync(SEED_DOC, 'utf8');
  const v1Priority = new Map();

  for (const cells of extractTableRows(markdown, 'V1 우선 작가군')) {
    const [priority, poet] = cells;
    const { ko } = extractName(stripBackticks(poet));
    v1Priority.set(ko, Number(priority));
  }

  return extractTableRows(markdown, '전체 seed catalog').map((cells, index) => {
    const [tier, poet, era, life, notes, sourceHint, works] = cells.map(stripBackticks);
    const name = extractName(poet);
    const authorId = authorIdFor(name.ko);
    const candidates = parseWorkCandidates(works);
    return {
      authorId,
      slug: slugifyAuthor(name.ko),
      name,
      era: { label: era },
      life: parseBirthDeath(life),
      collectionTier: tier,
      v1Priority: v1Priority.get(name.ko) || null,
      chronologyOrder: index + 1,
      notes,
      sourceHint,
      candidateWorkTitles: candidates,
      collectionPlan: {
        phase: v1Priority.has(name.ko) ? 'V1' : tier === 'A' ? 'V1-candidate' : tier === 'B' ? 'V2-candidate' : tier === 'C' ? 'native-form-review' : 'hold',
        preferredMode: tier === 'C' ? 'genre-specific-source-review' : 'author-collection-tranche',
        needsOwnedTranslation: true,
        needsSourceUrlVerification: true
      }
    };
  });
}

function loadTimelineIndex() {
  const index = new Map();
  const timeline = readJson(TIMELINE);
  for (const era of timeline.eras || []) {
    for (const poet of era.poets || []) {
      if (!poet.name?.ko) continue;
      index.set(poet.name.ko, {
        timelineEraId: era.id,
        timelineEraName: era.name,
        bio: poet.bio || null,
        bioDetail: poet.bio_detail || null,
        localFullPoems: poet.fullPoems || [],
        localOtherWorks: poet.otherWorks || []
      });
    }
  }
  return index;
}

function loadWaveIndex() {
  const index = new Map();
  if (!fs.existsSync(WAVE_BATCH)) return index;
  const wave = readJson(WAVE_BATCH);
  for (const row of wave.rows || []) {
    index.set(row.authorKo, {
      waveOrder: row.waveOrder,
      primaryCollectionTitle: row.primaryCollectionTitle,
      currentStatus: row.currentStatus,
      directTextCollectedWorks: row.directTextCollectedWorks,
      latestDirectTextBatchIds: row.latestDirectTextBatchIds || [],
      currentMatchedSeedTitles: row.currentMatchedSeedTitles || [],
      unresolvedSeedTitles: row.unresolvedSeedTitles || [],
      recommendedStartPoint: row.recommendedStartPoint || null
    });
  }
  return index;
}

function loadDirectRecords() {
  const records = [];
  for (const filePath of RECORD_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const data = readJson(filePath);
    for (const record of data) {
      records.push({
        ...record,
        ingest: {
          sourceFile: path.relative(ROOT, filePath),
          readiness: 'direct-text-collected',
          targetDb: 'poems'
        }
      });
    }
  }
  return records;
}

function dedupeDirectRecords(records) {
  const byCanonicalWork = new Map();

  for (const record of records) {
    const key = `${record.author.ko}::${record.title.zh || record.title.ko}`;
    const previous = byCanonicalWork.get(key);
    if (!previous) {
      byCanonicalWork.set(key, {
        ...record,
        ingest: {
          ...record.ingest,
          sourceFiles: [record.ingest.sourceFile]
        }
      });
      continue;
    }

    const sourceFiles = new Set(previous.ingest.sourceFiles || [previous.ingest.sourceFile]);
    sourceFiles.add(record.ingest.sourceFile);
    const sourceVariants = previous.sourceVariants || [];
    sourceVariants.push({
      poemId: record.poemId,
      canonicalId: record.canonicalId,
      sourceWork: record.sourceWork,
      ingest: record.ingest
    });

    byCanonicalWork.set(key, {
      ...previous,
      sourceVariants,
      ingest: {
        ...previous.ingest,
        sourceFiles: [...sourceFiles],
        duplicateSourceCount: sourceVariants.length
      }
    });
  }

  return [...byCanonicalWork.values()];
}

function buildCandidatePoems(author) {
  return author.candidateWorkTitles.map((title, index) => {
    const genre = inferGenre(author, title);
    const seq = String(index + 1).padStart(3, '0');
    return {
      poemId: `KPOEM-CAND-${author.slug.toUpperCase()}-${seq}`,
      canonicalId: `KPOEM-CANON-${author.slug.toUpperCase()}-${seq}`,
      title: {
        zh: /[\u3400-\u9FFF]/u.test(title) ? title : null,
        ko: title
      },
      author: {
        authorId: author.authorId,
        zh: author.name.hanja,
        ko: author.name.ko
      },
      era: author.era,
      genre,
      sourceWork: {
        collectionTitle: author.sourceHint || null,
        sourceUrl: null,
        sourcePolicyId: null,
        verificationStatus: 'needs-source-url'
      },
      text: {
        poemZh: null,
        poemKoReading: null,
        poemKoGloss: null
      },
      assets: {
        translationKo: null,
        commentaryKo: null,
        ownedTranslationNeeded: true
      },
      rights: {
        originalText: {
          status: 'candidate',
          publicDisplayAllowedNow: false,
          commercialAllowedNow: false
        },
        translation: {
          status: 'owned-translation-needed',
          publicDisplayAllowedNow: false,
          commercialAllowedNow: false
        }
      },
      ingest: {
        readiness: 'candidate-only',
        targetDb: 'poems',
        sourceFile: path.relative(ROOT, SEED_DOC)
      }
    };
  });
}

function normalizeDirectRecord(record) {
  return {
    ...record,
    ingest: {
      ...record.ingest,
      targetDb: 'poems',
      readiness: 'direct-text-collected',
      ownedTranslationNeeded: true
    }
  };
}

function main() {
  const timelineIndex = loadTimelineIndex();
  const waveIndex = loadWaveIndex();
  const directRecords = dedupeDirectRecords(loadDirectRecords());
  const directByAuthor = new Map();
  for (const record of directRecords) {
    const list = directByAuthor.get(record.author.ko) || [];
    list.push(record);
    directByAuthor.set(record.author.ko, list);
  }

  const authors = buildSeedAuthors().map((author) => {
    const timeline = timelineIndex.get(author.name.ko) || {};
    const wave = waveIndex.get(author.name.ko) || null;
    const direct = directByAuthor.get(author.name.ko) || [];
    return {
      ...author,
      timeline,
      wave,
      stats: {
        candidateWorkCount: author.candidateWorkTitles.length,
        directTextCollectedWorks: direct.length,
        localTimelineFullPoems: (timeline.localFullPoems || []).length,
        localTimelineOtherWorks: (timeline.localOtherWorks || []).length
      }
    };
  });

  const directPoems = directRecords.map(normalizeDirectRecord);
  const directKeys = new Set(directPoems.map((poem) => `${poem.author.ko}::${poem.title.zh || poem.title.ko}`));
  const candidatePoems = authors
    .flatMap(buildCandidatePoems)
    .filter((poem) => !directKeys.has(`${poem.author.ko}::${poem.title.zh || poem.title.ko}`));

  const commonMeta = {
    version: '2026-04-25.v1',
    generatedAt: '2026-04-25',
    buildScript: 'scripts/build_korean_poet_chronology_catalog.js',
    basedOn: [
      'docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md',
      'public/index/korean_timeline.json',
      'docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json',
      'docs/spec/korean-hansi-choe-chiwon-tranche1.records.v1.json',
      'docs/spec/korean-hansi-jeong-jisang-tranche1.records.v1.json',
      'docs/spec/korean-hansi-jeong-jisang-tranche2.records.v1.json'
    ]
  };

  const poetsCatalog = {
    ...commonMeta,
    catalogId: 'korean-poets-chronology',
    targetDb: 'poets',
    summary: {
      totalAuthors: authors.length,
      v1PriorityAuthors: authors.filter((author) => author.v1Priority !== null).length,
      tierCounts: authors.reduce((acc, author) => {
        acc[author.collectionTier] = (acc[author.collectionTier] || 0) + 1;
        return acc;
      }, {})
    },
    authors
  };

  const poemsCatalog = {
    ...commonMeta,
    catalogId: 'korean-poems-chronology',
    targetDb: 'poems',
    summary: {
      directTextCollected: directPoems.length,
      candidateOnly: candidatePoems.length,
      totalWorks: directPoems.length + candidatePoems.length
    },
    poems: [...directPoems, ...candidatePoems]
  };

  writeJson(OUT_POETS, poetsCatalog);
  writeJson(OUT_POEMS, poemsCatalog);
  writeJson(OUT_PUBLIC_POETS, poetsCatalog);
  writeJson(OUT_PUBLIC_POEMS, poemsCatalog);

  console.log(`Authors: ${poetsCatalog.summary.totalAuthors}`);
  console.log(`V1 priority authors: ${poetsCatalog.summary.v1PriorityAuthors}`);
  console.log(`Direct-text poems: ${poemsCatalog.summary.directTextCollected}`);
  console.log(`Candidate poems: ${poemsCatalog.summary.candidateOnly}`);
  console.log(`Output: ${path.relative(ROOT, OUT_POETS)}`);
  console.log(`Output: ${path.relative(ROOT, OUT_POEMS)}`);
  console.log(`Public mirror: ${path.relative(ROOT, OUT_PUBLIC_POETS)}`);
  console.log(`Public mirror: ${path.relative(ROOT, OUT_PUBLIC_POEMS)}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
