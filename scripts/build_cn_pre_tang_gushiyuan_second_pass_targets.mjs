#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-gushiyuan-link-pages.dump.raw.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-gushiyuan-second-pass-targets.v1.json');

const pages = JSON.parse(readFileSync(INPUT, 'utf8')).pages ?? [];
const candidates = [];
const unresolved = [];

for (const page of pages) {
  const wikitext = String(page.wikitext ?? '');
  const transcludedTitles = [...wikitext.matchAll(/\{\{:([^}]+)}}/g)].map((match) => match[1]);
  for (const title of transcludedTitles) {
    if (shouldSkipTransclusion(page, title)) continue;
    candidates.push(buildCandidate(page, title, 'transclusion-target'));
  }

  const explicitTarget = explicitTargetFor(page);
  if (explicitTarget) {
    candidates.push(buildCandidate(page, explicitTarget, 'explicit-disambiguation-target'));
    continue;
  }

  if (isUnresolvedPage(page)) {
    for (const title of broadTargetsFor(page)) {
      candidates.push(buildCandidate(page, title, 'broad-unresolved-title-probe'));
    }
    unresolved.push({
      rawTitle: page.rawTitle,
      normalizedTitle: page.normalizedTitle,
      authorHint: page.authorHint,
      sourceSection: page.sourceSection,
      reason: unresolvedReasonFor(page),
    });
  }
}

const deduped = dedupeBy(candidates, (item) => `${item.rawTitle}|${item.originRawTitle}`);
const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-gushiyuan-second-pass-targets',
  source: INPUT,
  generatedAt: new Date().toISOString(),
  summary: {
    selected: deduped.length,
    unresolved: unresolved.length,
    byReason: countBy(deduped, (item) => item.reason),
    unresolvedByReason: countBy(unresolved, (item) => item.reason),
  },
  candidates: deduped,
  unresolved,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function buildCandidate(page, title, reason) {
  return {
    eraSlug: page.eraSlug,
    priority: 'gushiyuan-second-pass',
    rawTitle: title,
    normalizedTitle: page.normalizedTitle || page.rawTitle,
    authorHint: page.authorHint,
    sourcePageTitle: page.sourcePageTitle,
    sourceUrl: page.sourceUrl,
    sourceSection: page.sourceSection,
    sourceLinkHref: page.sourceLinkHref,
    originRawTitle: page.rawTitle,
    reason,
  };
}

function explicitTargetFor(page) {
  const key = `${page.rawTitle}|${page.authorHint}`;
  return {
    '箜篌引|樂府歌辭': '箜篌引 (佚名)',
    '豔歌行|樂府歌辭': '豔歌行 (逸名)',
    '飲馬長城窟行|蔡邕': '飲馬長城窟行 (蔡邕)',
    '枯鱼过河泣|樂府歌辭': '枯魚過河泣 (古辭)',
    '臨高臺|樂府歌辭': '臨高臺 (兩漢樂府)',
    '怨歌行|班婕妤': '怨詩 (班婕妤)',
    '戰城南|樂府歌辭': '戰城南 (佚名)',
    '長歌行|樂府歌辭': '長歌行 (漢樂府)',
    '白頭吟|卓文君': '皚如山上雪',
    '悲憤詩|蔡琰': '悲憤詩 (蔡琰)',
  }[key] ?? null;
}

function broadTargetsFor(page) {
  if (page.rawTitle === '悲歌') return [];
  const title = page.normalizedTitle || page.rawTitle;
  const variants = [];
  const author = page.authorHint;
  if (author && !['樂府歌辭', '佚名'].includes(author)) variants.push(author);
  if (author === '武帝') variants.push('劉徹');
  if (author === '班婕妤') variants.push('班倢伃');
  if (author === '樂府歌辭') variants.push('漢樂府', '兩漢樂府', '佚名', '古辭', '古辞', '逸名', '樂府歌辭');
  if (author === '佚名') variants.push('佚名', '古辭', '古辞');
  return [...new Set(variants.map((variant) => `${title} (${variant})`))];
}

function shouldSkipTransclusion(page, title) {
  if (page.rawTitle === '悲歌') return true;
  return /^Category:/i.test(title) || /^category:/.test(title);
}

function isUnresolvedPage(page) {
  const wikitext = String(page.wikitext ?? '');
  return /disambig|消歧義|消歧义/i.test(wikitext)
    || /\{\{:[^}]+}}/.test(wikitext)
    || ['東門行'].includes(page.rawTitle);
}

function unresolvedReasonFor(page) {
  if (page.rawTitle === '悲歌') return 'wrong-era-transclusion-index';
  if (page.rawTitle === '東門行') return 'dump-title-resolved-to-non-han-author';
  return 'ambiguous-disambiguation-without-safe-target';
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
