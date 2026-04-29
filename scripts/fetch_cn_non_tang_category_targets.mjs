#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CN_NON_TANG_COLLECTION_TARGETS } from './data/cn_non_tang_collection_targets.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-category-targets.raw.v1.json');
const API = 'https://zh.wikisource.org/w/api.php';
const REQUEST_DELAY_MS = 800;

const categories = [];
for (const source of CN_NON_TANG_COLLECTION_TARGETS.categorySources) {
  try {
    categories.push(await fetchCategoryMembers(source));
  } catch (error) {
    categories.push({
      eraSlug: source.eraSlug,
      categoryTitle: source.categoryTitle,
      sourceUrl: source.url,
      observedPagesFromSearch: source.observedPages,
      fetchedPages: 0,
      fetchStatus: 'failed',
      error: error.message,
      members: [],
    });
  }
}

const doc = {
  version: '2026-04-30.v1',
  scope: 'CN non-Tang category targets only',
  generatedAt: new Date().toISOString(),
  categories,
  summary: {
    categories: categories.length,
    pages: categories.reduce((sum, category) => sum + category.members.length, 0),
    byEra: Object.fromEntries(categories.map((category) => [category.eraSlug, category.members.length])),
  },
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

async function fetchCategoryMembers(source) {
  const members = [];
  let cmcontinue = null;

  do {
    const url = new URL(API);
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'categorymembers');
    url.searchParams.set('cmtitle', source.categoryTitle);
    url.searchParams.set('cmnamespace', '0');
    url.searchParams.set('cmlimit', '500');
    url.searchParams.set('format', 'json');
    url.searchParams.set('formatversion', '2');
    if (cmcontinue) url.searchParams.set('cmcontinue', cmcontinue);

    await sleep(REQUEST_DELAY_MS);
    const response = await fetchWithRetry(url, source.categoryTitle);
    if (!response.ok) {
      throw new Error(`Wikisource category API failed ${response.status}: ${source.categoryTitle}`);
    }
    const payload = await response.json();
    for (const member of payload.query?.categorymembers ?? []) {
      members.push({
        pageid: member.pageid,
        ns: member.ns,
        title: member.title,
      });
    }
    cmcontinue = payload.continue?.cmcontinue ?? null;
  } while (cmcontinue);

  return {
    eraSlug: source.eraSlug,
    categoryTitle: source.categoryTitle,
    sourceUrl: source.url,
    observedPagesFromSearch: source.observedPages,
    fetchedPages: members.length,
    fetchStatus: 'ok',
    members,
  };
}

async function fetchWithRetry(url, label) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HanshinaruContentCollector/0.1 (local research; contact: repository owner)',
      },
    });
    if (response.status !== 429) return response;
    const waitMs = REQUEST_DELAY_MS * attempt * 3;
    console.warn(`429 from Wikisource for ${label}; retry ${attempt}/4 after ${waitMs}ms`);
    await sleep(waitMs);
  }
  return fetch(url, {
    headers: {
      'User-Agent': 'HanshinaruContentCollector/0.1 (local research; contact: repository owner)',
    },
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
