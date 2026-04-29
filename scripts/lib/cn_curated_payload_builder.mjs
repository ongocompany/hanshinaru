const PROVISIONAL_POET_ID_START = -900001;
const PROVISIONAL_POEM_ID_START = -910001;

export function buildCuratedDryRun(records) {
  const poetIdByAuthorId = new Map();
  const curatedPoets = [];
  const curatedPoems = [];

  records.forEach((record) => {
    const authorId = record.author.authorId;
    if (!poetIdByAuthorId.has(authorId)) {
      const jdsId = PROVISIONAL_POET_ID_START - poetIdByAuthorId.size;
      poetIdByAuthorId.set(authorId, jdsId);
      curatedPoets.push({
        jds_id: jdsId,
        country: 'CN',
        era_slug: record.eraSlug,
        name_ko: record.author.ko ?? record.author.zh,
        name_zh: record.author.zh,
        life_birth: null,
        life_death: null,
        life_raw: record.author.life,
        slug: record.jdsCandidate.poet.slug,
        era_period: record.jdsCandidate.poet.era_period,
        poem_count: records.filter((item) => item.author.authorId === authorId).length,
        bio_ko: null,
        sort_order: curatedPoets.length + 1,
        source_author_id: authorId,
      });
    }
  });

  records.forEach((record, index) => {
    curatedPoems.push({
      jds_id: PROVISIONAL_POEM_ID_START - index,
      poet_jds_id: poetIdByAuthorId.get(record.author.authorId),
      country: 'CN',
      era_slug: record.eraSlug,
      title_ko: record.title.ko,
      title_zh: record.title.zh,
      body_zh: record.text.poemZh,
      translation_ko: record.translation.translationKoOwned,
      commentary_ko: record.translation.commentaryKoOwned,
      is_notable: true,
      quality: record.jdsCandidate.poem.quality,
      category: record.jdsCandidate.poem.category,
      genre: null,
      in_daily_pool: index < 12,
      sort_order: index + 1,
      source_record_id: record.recordId,
      source_url: record.sourceWork.sourceUrl,
    });
  });

  return {
    version: '2026-04-30.v1',
    mode: 'dry-run',
    idPolicy: 'negative provisional ids only; replace with real jds ids before Supabase upsert',
    summary: {
      records: records.length,
      poets: curatedPoets.length,
      poems: curatedPoems.length,
      eras: countBy(records, (record) => record.eraSlug),
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
      poems: records.map((record) => ({
        poet_source_author_id: record.author.authorId,
        title_zh: record.jdsCandidate.poem.title_zh,
        title_ko: record.jdsCandidate.poem.title_ko,
        body_zh: record.jdsCandidate.poem.body_zh,
        translation_ko: record.translation.translationKoOwned,
        commentary_ko: record.translation.commentaryKoOwned,
        category: record.jdsCandidate.poem.category,
        quality: record.jdsCandidate.poem.quality,
        country: 'CN',
        source_record_id: record.recordId,
      })),
    },
  };
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
