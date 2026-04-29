#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-non-tang-category-targets.raw.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-category-candidate-index.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const candidates = [];

for (const category of raw.categories) {
  for (const member of category.members) {
    const parsed = parseTitle(member.title);
    candidates.push({
      eraSlug: category.eraSlug,
      pageid: member.pageid,
      rawTitle: member.title,
      normalizedTitle: normalizeChineseForHanshinaru(parsed.title),
      authorHint: parsed.authorHint && isLikelyAuthorName(parsed.authorHint)
        ? normalizeChineseForHanshinaru(parsed.authorHint)
        : null,
      parentheticalText: parsed.authorHint ? normalizeChineseForHanshinaru(parsed.authorHint) : null,
      priority: parsed.authorHint && isLikelyAuthorName(parsed.authorHint)
        ? 'author-parentheses-likely'
        : 'title-only-or-subtitle',
    });
  }
}

const doc = {
  version: '2026-04-30.v1',
  source: INPUT,
  generatedAt: new Date().toISOString(),
  summary: {
    total: candidates.length,
    authorParentheses: candidates.filter((item) => item.authorHint).length,
    titleOnly: candidates.filter((item) => !item.authorHint).length,
    byEra: countBy(candidates, (item) => item.eraSlug),
    authorParenthesesByEra: countBy(candidates.filter((item) => item.authorHint), (item) => item.eraSlug),
  },
  candidates,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function parseTitle(rawTitle) {
  const match = String(rawTitle).match(/^(.*?)\s*[（(]([^()（）]+)[）)]$/);
  if (!match) return { title: rawTitle.trim(), authorHint: null };
  return {
    title: match[1].trim(),
    authorHint: match[2].trim(),
  };
}

function isLikelyAuthorName(value) {
  const text = String(value ?? '').trim();
  const length = Array.from(text).length;
  if (length < 2 || length > 4) return false;
  if (/[0-9一二三四五六七八九十百千首韻韵句首篇章首闋闕]/.test(text)) return false;
  if (/[，。！？、；：\s]/.test(text)) return false;
  return true;
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
