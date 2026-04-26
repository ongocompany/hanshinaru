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
const WORKER_RESULTS_DIR = path.join(ROOT, 'docs', 'spec', 'korean-poet-worker-results');
const DONGGYEONG_JAPGI_BUNDLE = path.join(ROOT, 'docs', 'spec', 'korean-classics-donggyeong-japgi-collection-bundle.v1.json');
const DONGGYEONG_AUTHOR_SEED = path.join(ROOT, 'docs', 'spec', 'korean-poet-donggyeong-author-seed.v1.json');

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
  '유리왕': 'yuri-wang',
  '서동': 'seodong',
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
  '세종': 'sejong',
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
  '신위': 'sin-wi',
  '정조': 'jeongjo',
  '효명세자': 'hyomyeong-seja',
  '김병연': 'kim-byeongyeon'
};

const GENRE_HINTS = [
  { pattern: /향가|祭亡妹歌|兜率歌|讚耆婆郞歌|安民歌|遇賊歌|彗星歌|怨歌|處容歌|普賢十願歌/u, broad: '고유시가', form: '향가', track: 'native-form' },
  { pattern: /고려가요|鄭瓜亭曲/u, broad: '고유시가', form: '고려가요', track: 'native-form' },
  { pattern: /黃鳥歌|薯童謠|月印千江之曲|龍飛御天歌/u, broad: '고유시가', form: '고대/왕실 시가', track: 'native-form' },
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

function hasHanja(value) {
  return typeof value === 'string' && /[\u3400-\u9FFF]/u.test(value);
}

function normalizeComparableText(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[，。！？、；：,.!?;:]/g, '');
}

function normalizeComparableTitle(value) {
  return String(value || '').replace(/\s+/g, '').replace(/鵄/gu, '鴟').replace(/[詩曲歌樂嶺]+$/u, '');
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

function buildDonggyeongSupplementAuthors(existingAuthors) {
  if (!fs.existsSync(DONGGYEONG_AUTHOR_SEED)) return [];
  const seed = readJson(DONGGYEONG_AUTHOR_SEED);
  const existingHanja = new Set(existingAuthors.map((author) => author.name.hanja).filter(Boolean));
  const startOrder = existingAuthors.length;

  return (seed.authors || [])
    .filter((row) => row.authorZh && !existingHanja.has(row.authorZh))
    .map((row, index) => {
      const nameKo = row.authorKo || row.authorZh;
      return {
        authorId: row.authorId || authorIdFor(nameKo),
        slug: row.slug || slugifyAuthor(nameKo),
        name: {
          ko: nameKo,
          hanja: row.authorZh
        },
        era: { label: row.eraLabel || '동경잡기 수록 인물' },
        life: parseBirthDeath(row.life || '생몰 미상'),
        collectionTier: row.collectionTier || 'D',
        v1Priority: null,
        chronologyOrder: startOrder + index + 1,
        notes: row.notes || '동경잡기 2차 import를 위한 보충 author seed. 한글 독음과 생애 정보는 후속 검증 필요.',
        sourceHint: row.sourceHint || '東京雜記',
        candidateWorkTitles: row.workTitles || ['東京雜記 수록작'],
        collectionPlan: {
          phase: 'V3-donggyeong-supplement',
          preferredMode: 'regional-document-seed-review',
          needsOwnedTranslation: true,
          needsSourceUrlVerification: false,
          needsNameReadingVerification: row.needsNameReadingVerification !== false
        },
        donggyeongJapgiSeed: {
          sourceFile: path.relative(ROOT, DONGGYEONG_AUTHOR_SEED),
          sourceAuthorZh: row.authorZh,
          sourceRawLabels: row.rawLabels || [],
          sourceWorkCount: row.workCount || null
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

function loadWorkerResults() {
  if (!fs.existsSync(WORKER_RESULTS_DIR)) return [];
  const results = [];
  for (const fileName of fs.readdirSync(WORKER_RESULTS_DIR).filter((name) => name.endsWith('.json')).sort()) {
    const filePath = path.join(WORKER_RESULTS_DIR, fileName);
    const data = readJson(filePath);
    for (const [index, poem] of (data.poems || []).entries()) {
      results.push({
        ...poem,
        workerId: data.workerId || fileName.replace(/\.json$/u, ''),
        workerFile: path.relative(ROOT, filePath),
        workerIndex: index + 1
      });
    }
  }
  return results;
}

function normalizeWorkerPoem(workerPoem, authorsByName) {
  const author = authorsByName.get(workerPoem.authorKo);
  if (!author) {
    throw new Error(`Unknown worker author: ${workerPoem.authorKo}`);
  }

  const sourceWork = workerPoem.sourceWork || {};
  const ingest = workerPoem.ingest || {};
  const readiness = ingest.recommendedReadiness || 'source-located';
  const sequence = String(workerPoem.workerIndex).padStart(3, '0');
  const idPrefix = `KPOEM-WORKER-${author.slug.toUpperCase()}-${sequence}`;
  const displayTitle = workerPoem.matchedTitle || workerPoem.candidateTitle;
  const genre = inferGenre(author, displayTitle || workerPoem.candidateTitle || '');
  const titleOnlyGenre = inferGenre({ ...author, sourceHint: '', notes: '' }, displayTitle || workerPoem.candidateTitle || '');
  if (readiness === 'direct-text-collected' && titleOnlyGenre.track === 'hansi-candidate') {
    genre.broad = '한시';
    genre.form = '미확정';
  }
  if (displayTitle === '東明王篇 幷序') {
    genre.form = '장편 서사시';
  }
  const publicAllowed = readiness === 'direct-text-collected' && workerPoem.rights?.originalTextUsage === 'commercial_allowed';

  return {
    poemId: idPrefix,
    canonicalId: `KPOEM-CANON-WORKER-${author.slug.toUpperCase()}-${sequence}`,
    title: {
      zh: hasHanja(displayTitle) ? displayTitle : null,
      ko: displayTitle || workerPoem.candidateTitle
    },
    author: {
      authorId: author.authorId,
      zh: workerPoem.authorHanja || author.name.hanja,
      ko: workerPoem.authorKo
    },
    era: author.era,
    genre: {
      ...genre,
      track: readiness === 'direct-text-collected' ? 'hansi-direct-text' : genre.track
    },
    sourceWork: {
      collectionTitle: sourceWork.collectionTitle || author.sourceHint || null,
      juan: sourceWork.juan || null,
      entryTitle: sourceWork.entryTitle || workerPoem.matchedTitle || workerPoem.candidateTitle || null,
      sourceUrl: sourceWork.sourceUrl || null,
      rawUrl: sourceWork.rawUrl || null,
      sourcePolicyId: sourceWork.sourcePolicyId || null,
      locatorConfidence: sourceWork.locatorConfidence || 'low',
      verificationStatus: readiness === 'blocked' ? 'blocked' : readiness === 'direct-text-collected' ? 'verified-direct-text' : 'source-located'
    },
    text: {
      poemZh: workerPoem.text?.poemZh || null,
      poemKoReading: workerPoem.text?.poemKoReading || null,
      poemKoGloss: workerPoem.text?.poemKoGloss || null,
      textParts: workerPoem.text?.textParts || null
    },
    assets: {
      translationKo: null,
      commentaryKo: null,
      ownedTranslationNeeded: true
    },
    rights: {
      originalText: {
        status: workerPoem.rights?.originalTextUsage || 'unknown',
        publicDisplayAllowedNow: publicAllowed,
        commercialAllowedNow: publicAllowed
      },
      translation: {
        status: 'owned-translation-needed',
        publicDisplayAllowedNow: false,
        commercialAllowedNow: false
      }
    },
    ingest: {
      readiness,
      targetDb: 'poems',
      sourceFile: workerPoem.workerFile,
      workerId: workerPoem.workerId,
      candidateTitle: workerPoem.candidateTitle,
      matchedTitle: workerPoem.matchedTitle || null,
      notes: ingest.notes || null,
      ownedTranslationNeeded: true
    }
  };
}

function titleFromDonggyeongBlock(block) {
  const authorPrefix = block.authorNormalization?.titlePrefixZh || '';
  const titleHint = block.titleHintZh || '';
  const displayLabel = block.displayLabelZh || '';
  const normalizedAuthor = block.authorNormalization?.normalizedAuthorZh || block.authorZh || '';
  const rawLabel = block.authorNormalization?.rawLabelZh || block.authorZh || '';

  if (authorPrefix) return authorPrefix;

  const cleanedHint = titleHint
    .replace(normalizedAuthor, '')
    .replace(rawLabel, '')
    .replace(/徐四佳|李益齋|梅溪|佔畢齋|圃隱|稼亭|先生/gu, '')
    .trim();
  if (cleanedHint) return cleanedHint;

  const cleanedDisplay = displayLabel
    .replace(normalizedAuthor, '')
    .replace(rawLabel, '')
    .replace(/徐四佳|李益齋|梅溪|佔畢齋|圃隱|稼亭|先生|應制|詩$/gu, '')
    .trim();
  return cleanedDisplay || displayLabel || block.harvestId;
}

function buildDonggyeongVariant(block) {
  return {
    variantType: 'collection-witness',
    collectionId: 'korean-classics-donggyeong-japgi',
    collectionTitle: '東京雜記',
    collectionTitleKo: '동경잡기',
    collectionTitleRomanization: 'Donggyeong Japgi',
    harvestId: block.harvestId,
    documentEntryId: block.documentEntryId,
    documentSectionId: block.documentSectionId,
    displayLabelZh: block.displayLabelZh || null,
    titleHintZh: block.titleHintZh || null,
    authorNormalization: block.authorNormalization || null,
    sourceWork: {
      collectionTitle: block.source?.collectionTitle || null,
      juan: block.source?.juan || null,
      entryTitle: block.displayLabelZh || block.sourceEntryTitle || null,
      sourceUrl: block.source?.sourceUrl || null,
      sourcePolicyId: block.source?.sourcePolicyId || null,
      verificationStatus: 'verified-direct-text'
    },
    text: {
      poemZh: block.textZh || null
    },
    ingest: {
      readiness: 'direct-text-collected',
      targetDb: 'poems',
      sourceFile: path.relative(ROOT, DONGGYEONG_JAPGI_BUNDLE)
    }
  };
}

function normalizeDonggyeongBlock(block, author) {
  const titleZh = titleFromDonggyeongBlock(block);
  const variant = buildDonggyeongVariant(block);
  return {
    poemId: `KPOEM-DONGGYEONG-JAPGI-${block.harvestId.replace(/^KHS-TZ/u, '').replace(/[^A-Z0-9]+/giu, '-')}`,
    canonicalId: `KPOEM-CANON-DONGGYEONG-JAPGI-${block.harvestId.replace(/^KHS-TZ/u, '').replace(/[^A-Z0-9]+/giu, '-')}`,
    title: {
      zh: hasHanja(titleZh) ? titleZh : null,
      ko: titleZh
    },
    author: {
      authorId: author.authorId,
      zh: author.name.hanja,
      ko: author.name.ko
    },
    era: author.era,
    genre: {
      broad: '한시',
      form: block.inferredForm || '미확정',
      track: 'hansi-direct-text'
    },
    sourceWork: variant.sourceWork,
    text: {
      poemZh: block.textZh || null,
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
        status: 'commercial_allowed',
        publicDisplayAllowedNow: true,
        commercialAllowedNow: true
      },
      translation: {
        status: 'owned-translation-needed',
        publicDisplayAllowedNow: false,
        commercialAllowedNow: false
      }
    },
    ingest: {
      readiness: 'direct-text-collected',
      targetDb: 'poems',
      sourceFile: path.relative(ROOT, DONGGYEONG_JAPGI_BUNDLE),
      workerId: 'donggyeong-japgi-bundle-import',
      candidateTitle: titleZh,
      matchedTitle: titleZh,
      harvestId: block.harvestId,
      ownedTranslationNeeded: true,
      notes: '동경잡기 전권 bundle에서 기존 seed 시인과 매칭된 작품을 1차 승격함'
    },
    collectionWitnesses: [variant]
  };
}

function loadDonggyeongJapgiPoems(authors) {
  if (!fs.existsSync(DONGGYEONG_JAPGI_BUNDLE)) {
    return { poems: [], matchedBlockCount: 0 };
  }

  const authorsByHanja = new Map(authors.map((author) => [author.name.hanja, author]).filter(([hanja]) => Boolean(hanja)));
  const bundle = readJson(DONGGYEONG_JAPGI_BUNDLE);
  const matchedBlocks = (bundle.poemBlocks || []).filter((block) => {
    const normalizedAuthorZh = block.authorNormalization?.normalizedAuthorZh || block.authorZh;
    return authorsByHanja.has(normalizedAuthorZh);
  });

  return {
    matchedBlockCount: matchedBlocks.length,
    poems: matchedBlocks.map((block) => normalizeDonggyeongBlock(
      block,
      authorsByHanja.get(block.authorNormalization?.normalizedAuthorZh || block.authorZh)
    ))
  };
}

function mergeDonggyeongWitnesses(basePoems, donggyeongPoems) {
  const merged = [...basePoems];
  let attachedVariantCount = 0;
  let importedWorkCount = 0;

  for (const donggyeongPoem of donggyeongPoems) {
    const titleKey = normalizeComparableTitle(donggyeongPoem.title.zh || donggyeongPoem.title.ko);
    const textKey = normalizeComparableText(donggyeongPoem.text.poemZh);
    const existing = merged.find((poem) => {
      if (poem.author?.zh !== donggyeongPoem.author.zh) return false;
      const sameText = textKey && normalizeComparableText(poem.text?.poemZh) === textKey;
      const sameTitle = titleKey && normalizeComparableTitle(poem.title?.zh || poem.title?.ko) === titleKey;
      return sameText || sameTitle;
    });

    if (!existing) {
      merged.push(donggyeongPoem);
      importedWorkCount += 1;
      continue;
    }

    const variant = donggyeongPoem.collectionWitnesses[0];
    const existingVariants = existing.sourceVariants || [];
    const alreadyAttached = existingVariants.some((item) => item.harvestId === variant.harvestId);
    if (!alreadyAttached) {
      existing.sourceVariants = [...existingVariants, variant];
      existing.ingest = {
        ...existing.ingest,
        sourceFiles: [...new Set([...(existing.ingest?.sourceFiles || []), variant.ingest.sourceFile])],
        duplicateSourceCount: (existing.sourceVariants || []).length
      };
    }
    attachedVariantCount += alreadyAttached ? 0 : 1;
  }

  return { poems: merged, importedWorkCount, attachedVariantCount };
}

function countByReadiness(poems, readiness) {
  return poems.filter((poem) => poem.ingest?.readiness === readiness).length;
}

function addCandidateKey(keys, authorKo, title) {
  if (!authorKo || !title) return;
  keys.add(`${authorKo}::${title}`);
}

function buildCollectedCandidateKeys(poems) {
  const keys = new Set();
  for (const poem of poems) {
    const authorKo = poem.author?.ko;
    addCandidateKey(keys, authorKo, poem.ingest?.candidateTitle);
    addCandidateKey(keys, authorKo, poem.ingest?.matchedTitle);
    addCandidateKey(keys, authorKo, poem.sourceWork?.entryTitle);
    for (const variant of poem.sourceVariants || []) {
      addCandidateKey(keys, authorKo, variant.displayLabelZh);
      addCandidateKey(keys, authorKo, variant.titleHintZh);
      addCandidateKey(keys, authorKo, variant.sourceWork?.entryTitle);
      addCandidateKey(keys, authorKo, variant.authorNormalization?.titlePrefixZh);
    }
    for (const variant of poem.collectionWitnesses || []) {
      addCandidateKey(keys, authorKo, variant.displayLabelZh);
      addCandidateKey(keys, authorKo, variant.titleHintZh);
      addCandidateKey(keys, authorKo, variant.sourceWork?.entryTitle);
      addCandidateKey(keys, authorKo, variant.authorNormalization?.titlePrefixZh);
    }
  }
  return keys;
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

  const seedAuthors = buildSeedAuthors();
  const authors = [...seedAuthors, ...buildDonggyeongSupplementAuthors(seedAuthors)].map((author) => {
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
  const authorsByName = new Map(authors.map((author) => [author.name.ko, author]));

  const directPoems = directRecords.map(normalizeDirectRecord);
  const workerPoems = loadWorkerResults().map((workerPoem) => normalizeWorkerPoem(workerPoem, authorsByName));
  const catalogWorkerPoems = workerPoems.filter((poem) => poem.ingest?.readiness !== 'blocked');
  const donggyeongImport = loadDonggyeongJapgiPoems(authors);
  const mergedCollected = mergeDonggyeongWitnesses([...directPoems, ...catalogWorkerPoems], donggyeongImport.poems);
  const collectedTitleKeys = new Set(mergedCollected.poems.map((poem) => `${poem.author.ko}::${poem.title.zh || poem.title.ko}`));
  const collectedCandidateKeys = buildCollectedCandidateKeys([...mergedCollected.poems, ...workerPoems.filter((poem) => poem.ingest?.readiness === 'blocked')]);
  const candidatePoems = authors
    .flatMap(buildCandidatePoems)
    .filter((poem) => !collectedTitleKeys.has(`${poem.author.ko}::${poem.title.zh || poem.title.ko}`))
    .filter((poem) => !collectedCandidateKeys.has(`${poem.author.ko}::${poem.title.zh || poem.title.ko}`));

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
      'docs/spec/korean-hansi-jeong-jisang-tranche2.records.v1.json',
      'docs/spec/korean-poet-worker-results/*.json',
      'docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json',
      'docs/spec/korean-poet-donggyeong-author-seed.v1.json'
    ]
  };

  const poetsCatalog = {
    ...commonMeta,
    catalogId: 'korean-poets-chronology',
    targetDb: 'poets',
    summary: {
      totalAuthors: authors.length,
      baseSeedAuthors: seedAuthors.length,
      donggyeongSupplementAuthors: authors.length - seedAuthors.length,
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
      directTextCollected: directPoems.length + countByReadiness(catalogWorkerPoems, 'direct-text-collected') + mergedCollected.importedWorkCount,
      sourceLocated: countByReadiness(workerPoems, 'source-located'),
      ocrCandidate: countByReadiness(workerPoems, 'ocr-candidate'),
      blocked: countByReadiness(workerPoems, 'blocked'),
      candidateOnly: candidatePoems.length,
      totalWorks: mergedCollected.poems.length + candidatePoems.length,
      workerResultWorks: workerPoems.length,
      donggyeongJapgiMatchedBlocks: donggyeongImport.matchedBlockCount,
      donggyeongJapgiImportedWorks: mergedCollected.importedWorkCount,
      donggyeongJapgiSourceVariants: mergedCollected.attachedVariantCount
    },
    poems: [...mergedCollected.poems, ...candidatePoems]
  };

  writeJson(OUT_POETS, poetsCatalog);
  writeJson(OUT_POEMS, poemsCatalog);
  writeJson(OUT_PUBLIC_POETS, poetsCatalog);
  writeJson(OUT_PUBLIC_POEMS, poemsCatalog);

  console.log(`Authors: ${poetsCatalog.summary.totalAuthors}`);
  console.log(`V1 priority authors: ${poetsCatalog.summary.v1PriorityAuthors}`);
  console.log(`Direct-text poems: ${poemsCatalog.summary.directTextCollected}`);
  console.log(`Source-located poems: ${poemsCatalog.summary.sourceLocated}`);
  console.log(`Blocked poems: ${poemsCatalog.summary.blocked}`);
  console.log(`Candidate poems: ${poemsCatalog.summary.candidateOnly}`);
  console.log(`Donggyeong Japgi matched blocks: ${poemsCatalog.summary.donggyeongJapgiMatchedBlocks}`);
  console.log(`Donggyeong Japgi imported works: ${poemsCatalog.summary.donggyeongJapgiImportedWorks}`);
  console.log(`Donggyeong Japgi source variants: ${poemsCatalog.summary.donggyeongJapgiSourceVariants}`);
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
