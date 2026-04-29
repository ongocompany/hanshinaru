#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CN_NON_TANG_TRANCHE1_SEED } from './data/cn_non_tang_tranche1_seed.mjs';
import { fetchWikisourcePage } from './lib/cn_wikisource_api.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.sources.raw.json');

const uniqueUrls = [...new Set(CN_NON_TANG_TRANCHE1_SEED.map((item) => item.sourceUrl))];
const pages = [];

for (const sourceUrl of uniqueUrls) {
  pages.push(await fetchWikisourcePage(sourceUrl));
}

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(
  OUT,
  `${JSON.stringify({
    version: '2026-04-30.v1',
    sourcePolicy: 'Chinese Wikisource MediaWiki parse API',
    generatedAt: new Date().toISOString(),
    pages,
  }, null, 2)}\n`,
);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify({
  pages: pages.length,
  titles: pages.map((page) => page.title),
}, null, 2));
