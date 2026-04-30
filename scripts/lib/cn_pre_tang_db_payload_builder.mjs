import { detectCategory, normalizeChineseForHanshinaru } from './cn_hansi_text_normalizer.mjs';

const PROVISIONAL_POET_ID_START = -920001;
const PROVISIONAL_POEM_ID_START = -930001;
const QUALITY_TAG = 'cn-pretang1';

export function buildPreTangDryRun(records) {
  const normalizedRecords = records.map(normalizeWitnessRecord);
  const poetIdByAuthorKey = new Map();
  const curatedPoets = [];
  const curatedPoems = [];

  for (const record of normalizedRecords) {
    if (!poetIdByAuthorKey.has(record.authorKey)) {
      const jdsId = PROVISIONAL_POET_ID_START - poetIdByAuthorKey.size;
      poetIdByAuthorKey.set(record.authorKey, jdsId);
      curatedPoets.push({
        jds_id: jdsId,
        country: 'CN',
        era_slug: record.eraSlug,
        name_ko: record.authorKo,
        name_zh: record.authorZh,
        life_birth: null,
        life_death: null,
        life_raw: record.authorLife,
        slug: record.authorSlug,
        era_period: eraPeriodFor(record.eraSlug),
        poem_count: normalizedRecords.filter((item) => item.authorKey === record.authorKey).length,
        bio_ko: null,
        sort_order: curatedPoets.length + 1,
        source_author_id: record.authorKey,
      });
    }
  }

  normalizedRecords.forEach((record, index) => {
    curatedPoems.push({
      jds_id: PROVISIONAL_POEM_ID_START - index,
      poet_jds_id: poetIdByAuthorKey.get(record.authorKey),
      country: 'CN',
      era_slug: record.eraSlug,
      title_ko: null,
      title_zh: record.titleZh,
      body_zh: record.bodyZh,
      translation_ko: null,
      commentary_ko: null,
      is_notable: true,
      status: 'parsed',
      quality: QUALITY_TAG,
      category: detectCategory(record.bodyZh, { eraSlug: record.eraSlug }),
      genre: genreFor(record),
      in_daily_pool: index < 12,
      sort_order: index + 1,
      source_record_id: record.recordId,
      source_url: record.sourceUrl,
      review_status: record.reviewStatus,
      review_reasons: record.reviewReasons,
    });
  });

  return {
    version: '2026-04-30.v1',
    mode: 'dry-run',
    idPolicy: 'negative provisional ids only; replace with real jds ids before Supabase upsert',
    sourcePolicy: 'pre-Tang source witness records; no owned translation/commentary yet',
    summary: {
      records: normalizedRecords.length,
      poets: curatedPoets.length,
      poems: curatedPoems.length,
      eras: countBy(normalizedRecords, (record) => record.eraSlug),
      reviewStatuses: countBy(normalizedRecords, (record) => record.reviewStatus),
      sourceKinds: countBy(normalizedRecords, (record) => record.sourceKind),
    },
    curatedPoets,
    curatedPoems,
    jdsUpsertCandidates: {
      poets: curatedPoets.map((poet) => ({
        name_zh: poet.name_zh,
        name_ko: poet.name_ko,
        life_raw: poet.life_raw,
        era_period: poet.era_period,
        country: poet.country,
        slug: poet.slug,
        source_author_id: poet.source_author_id,
      })),
      poems: curatedPoems.map((poem) => {
        const poet = curatedPoets.find((candidate) => candidate.jds_id === poem.poet_jds_id);
        return {
          poet_source_author_id: poet.source_author_id,
          poet_slug: poet.slug,
          title_zh: poem.title_zh,
          title_ko: poem.title_ko,
          body_zh: poem.body_zh,
          translation_ko: poem.translation_ko,
          commentary_ko: poem.commentary_ko,
          category: poem.category,
          quality: poem.quality,
          status: 'parsed',
          country: 'CN',
          source_record_id: poem.source_record_id,
          source_url: poem.source_url,
        };
      }),
    },
  };
}

export function normalizeWitnessRecord(record) {
  const titleZh = normalizeChineseForHanshinaru(record.title?.zh ?? '').trim();
  const authorZh = normalizeChineseForHanshinaru(record.author?.zh || '佚名').trim();
  const bodyZh = normalizePoemBody(record.text?.poemZh ?? '');
  const authorKey = `CN-PRETANG-AUTHOR-${slugify(authorZh)}`;
  return {
    recordId: record.recordId,
    eraSlug: record.eraSlug,
    titleZh,
    authorZh,
    authorKo: record.author?.ko ?? authorZh,
    authorLife: record.author?.life ?? null,
    authorKey,
    authorSlug: `cn-pretang-${slugify(authorZh)}`,
    bodyZh,
    sourceKind: record.sourcePage?.kind ?? 'source-witness',
    sourceUrl: record.sourcePage?.sourceUrl || sourceUrlFor(record.sourcePage?.title),
    reviewStatus: record.review?.status ?? 'needs-review',
    reviewReasons: record.review?.reasons ?? [],
  };
}

function normalizePoemBody(value) {
  return cleanWikisourceInlineMarkup(value)
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function cleanWikisourceInlineMarkup(value) {
  let text = String(value ?? '')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\{\{另\|([^|{}]+)\|[^{}]*\}\}/g, '$1');

  for (let index = 0; index < 8; index += 1) {
    const next = text
      .replace(/\{\{另\|([^|{}]+)\|[^{}]*\}\}/g, '$1')
      .replace(/\{\{[^{}]*\}\}/g, '');
    if (next === text) break;
    text = next;
  }

  return text;
}

function eraPeriodFor(eraSlug) {
  return {
    'pre-qin': '先秦',
    han: '兩漢',
  }[eraSlug] ?? eraSlug;
}

function genreFor(record) {
  if (record.authorZh.includes('漢樂府')) return '漢樂府';
  if (record.authorZh.includes('古詩十九首')) return '古詩十九首';
  if (record.sourceKind === 'anthology-section') return '古逸';
  return null;
}

function sourceUrlFor(title) {
  if (!title) return null;
  return `https://zh.wikisource.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

function slugify(value) {
  return Array.from(value)
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
