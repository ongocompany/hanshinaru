import { detectCategory, detectMeter, normalizeChineseForHanshinaru } from './cn_hansi_text_normalizer.mjs';

export function buildRecord(raw) {
  const bodyZh = normalizePoemBody(raw.bodyZh);
  return {
    recordId: raw.recordId,
    canonicalId: raw.canonicalId,
    country: 'CN',
    eraSlug: raw.eraSlug,
    title: {
      zh: normalizeChineseForHanshinaru(raw.titleZh),
      ko: raw.titleKo ?? null,
    },
    author: {
      authorId: raw.authorId,
      zh: normalizeChineseForHanshinaru(raw.authorZh),
      ko: raw.authorKo ?? null,
      life: raw.authorLife ?? null,
    },
    sourceWork: {
      collectionTitle: normalizeChineseForHanshinaru(raw.collectionTitle),
      entryTitle: normalizeChineseForHanshinaru(raw.entryTitle ?? raw.titleZh),
      sourceUrl: raw.sourceUrl,
      sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
    },
    text: {
      poemZh: bodyZh,
      poemKoReading: null,
      poemKoGloss: null,
    },
    translation: {
      translationKoOwned: raw.translationKoOwned ?? null,
      commentaryKoOwned: raw.commentaryKoOwned ?? null,
    },
    jdsCandidate: {
      poet: {
        name_zh: normalizeChineseForHanshinaru(raw.authorZh),
        name_ko: raw.authorKo ?? null,
        life_raw: raw.authorLife ?? null,
        era_period: raw.eraPeriod,
        country: 'CN',
        slug: raw.authorSlug,
      },
      poem: {
        title_zh: normalizeChineseForHanshinaru(raw.titleZh),
        title_ko: raw.titleKo ?? null,
        body_zh: bodyZh,
        category: detectCategory(bodyZh, { eraSlug: raw.eraSlug }),
        meter: detectMeter(bodyZh),
        country: 'CN',
        status: raw.translationKoOwned ? 'translated' : 'parsed',
        quality: 'seed',
      },
    },
    rights: {
      originalText: {
        sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
        sourceUrl: raw.sourceUrl,
        publicDisplayAllowedNow: true,
        commercialAllowedNow: true,
        attributionRequired: true,
      },
      ownedTranslation: {
        exists: Boolean(raw.translationKoOwned),
        sourcePolicyId: 'OWNED-AI-ASSISTED-HUMAN-REVIEW-PENDING',
        publicDisplayAllowedNow: Boolean(raw.translationKoOwned),
        commercialAllowedNow: Boolean(raw.translationKoOwned),
      },
    },
  };
}

export function normalizePoemBody(bodyZh) {
  return String(bodyZh ?? '')
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}
