#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchWikisourcePageByTitle, buildWikisourcePageUrl } from './lib/cn_wikisource_api.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-non-tang-category-candidate-index.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-candidate-pages.raw.v1.json');
const REQUEST_DELAY_MS = Number(process.env.CN_NON_TANG_FETCH_DELAY_MS ?? 600);
const LIMIT = Number(process.env.CN_NON_TANG_CANDIDATE_LIMIT ?? 120);
const ERA_FILTER = process.env.CN_NON_TANG_ERA ?? null;

const index = JSON.parse(readFileSync(INPUT, 'utf8'));
const previousPages = loadPreviousPages();
const selected = index.candidates
  .filter((item) => item.priority === 'author-parentheses-likely')
  .filter((item) => !ERA_FILTER || item.eraSlug === ERA_FILTER)
  .slice(0, LIMIT);

const pages = [];
for (const candidate of selected) {
  const previous = previousPages.get(candidateKey(candidate));
  if (previous?.fetchStatus === 'ok') {
    pages.push(previous);
    continue;
  }

  await sleep(REQUEST_DELAY_MS);
  try {
    const page = await fetchCandidateWithRetry(candidate.rawTitle);
    pages.push({
      ...candidate,
      sourceUrl: buildWikisourcePageUrl(candidate.rawTitle),
      categoryTitle: categoryTitleForEra(candidate.eraSlug),
      fetchStatus: 'ok',
      apiUrl: page.apiUrl,
      displayTitle: page.displayTitle,
      categories: page.categories,
      html: page.html,
    });
  } catch (error) {
    pages.push({
      ...candidate,
      sourceUrl: buildWikisourcePageUrl(candidate.rawTitle),
      categoryTitle: categoryTitleForEra(candidate.eraSlug),
      fetchStatus: 'failed',
      error: error.message,
      html: '',
    });
  }
}

const doc = {
  version: '2026-04-30.v1',
  source: INPUT,
  selection: {
    priority: 'author-parentheses-likely',
    eraFilter: ERA_FILTER,
    limit: LIMIT,
  },
  generatedAt: new Date().toISOString(),
  summary: {
    selected: selected.length,
    fetchedOk: pages.filter((page) => page.fetchStatus === 'ok').length,
    failed: pages.filter((page) => page.fetchStatus !== 'ok').length,
    byEra: countBy(pages, (page) => page.eraSlug),
  },
  pages,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function categoryTitleForEra(eraSlug) {
  return {
    song: 'Category:宋詩',
    yuan: 'Category:元詩',
    ming: 'Category:明詩',
    qing: 'Category:清詩',
  }[eraSlug] ?? null;
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

async function fetchCandidateWithRetry(rawTitle) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await fetchWikisourcePageByTitle(rawTitle);
    } catch (error) {
      if (!String(error.message).includes('429') || attempt === 4) throw error;
      await sleep(REQUEST_DELAY_MS * attempt * 4);
    }
  }
  throw new Error(`unreachable retry state for ${rawTitle}`);
}

function loadPreviousPages() {
  try {
    const previous = JSON.parse(readFileSync(OUT, 'utf8'));
    return new Map((previous.pages ?? []).map((page) => [candidateKey(page), page]));
  } catch {
    return new Map();
  }
}

function candidateKey(candidate) {
  return `${candidate.eraSlug}:${candidate.pageid}:${candidate.rawTitle}`;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
