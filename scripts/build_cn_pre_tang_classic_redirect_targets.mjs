#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-index-pages.dump.raw.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-redirect-targets.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const candidates = (raw.pages ?? [])
  .map((page) => {
    const redirectTarget = redirectTargetTitle(page.wikitext);
    if (!redirectTarget) return null;
    return {
      ...page,
      rawTitle: redirectTarget,
      normalizedTitle: redirectTarget,
      originRawTitle: page.rawTitle,
      originSourceUrl: page.sourceUrl,
      sourceLinkHref: `/wiki/${redirectTarget}`,
      priority: 'cn-pretang-classic-redirect-target',
      fetchStatus: undefined,
      dumpTitle: undefined,
      dumpTextBytes: undefined,
      wikitext: undefined,
    };
  })
  .filter(Boolean);

const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-classic-redirect-targets',
  source: INPUT,
  generatedAt: new Date().toISOString(),
  summary: {
    selected: candidates.length,
    byFamily: countBy(candidates, (item) => item.sourceFamily),
  },
  candidates,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function redirectTargetTitle(wikitext) {
  return String(wikitext ?? '').trim().match(/^#\s*(?:redirect|重定向)\s*\[\[([^\]#|]+)(?:[#|][^\]]*)?]]/i)?.[1] ?? '';
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
