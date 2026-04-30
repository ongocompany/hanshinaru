#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-companion-source-targets.v1.json');

const candidates = [
  ...numberedTitles('樂府詩集', 1, 100, (n) => `${String(n).padStart(3, '0')}卷`, 'yuefu-shiji'),
  ...numberedTitles('玉臺新詠', 1, 10, (n) => `${String(n).padStart(2, '0')}卷`, 'yutai-xinyong'),
  ...numberedTitles('昭明文選', 1, 60, (n) => `卷${String(n).padStart(2, '0')}`, 'zhaoming-wenxuan'),
  ...numberedTitles('昭明文選', 1, 60, (n) => `卷${n}`, 'zhaoming-wenxuan-unpadded'),
];

const deduped = dedupeBy(candidates, (item) => item.rawTitle);
const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-companion-source-targets',
  purpose: 'Probe companion anthology volume pages for unresolved 先秦漢 first-tranche works.',
  generatedAt: new Date().toISOString(),
  summary: {
    selected: deduped.length,
    byCollection: countBy(deduped, (item) => item.collectionSlug),
  },
  candidates: deduped,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function numberedTitles(collectionTitle, start, end, suffixFor, collectionSlug) {
  const items = [];
  for (let n = start; n <= end; n += 1) {
    const suffix = suffixFor(n);
    items.push({
      eraSlug: 'han',
      priority: 'cn-pretang-companion-volume',
      rawTitle: `${collectionTitle}/${suffix}`,
      normalizedTitle: `${collectionTitle}/${suffix}`,
      authorHint: null,
      sourcePageTitle: collectionTitle,
      sourceSection: null,
      sourceLinkHref: `/wiki/${collectionTitle}/${suffix}`,
      collectionTitle,
      collectionSlug,
      volumeNumber: n,
    });
  }
  return items;
}

function dedupeBy(items, selector) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = selector(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
