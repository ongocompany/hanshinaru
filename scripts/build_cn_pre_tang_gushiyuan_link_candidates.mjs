#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.sources.raw.json');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-gushiyuan-link-candidates.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const gushiYuan = raw.pages?.find((page) => page.title === '古詩源');
if (!gushiYuan?.html) {
  throw new Error('Missing cached 古詩源 HTML source');
}

const candidates = extractHanLinkCandidates(gushiYuan);
const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-gushiyuan-link-candidates',
  source: INPUT,
  generatedAt: new Date().toISOString(),
  summary: {
    sourcePage: '古詩源',
    selected: candidates.length,
    bySection: countBy(candidates, (candidate) => candidate.sourceSection),
    byEra: countBy(candidates, (candidate) => candidate.eraSlug),
  },
  policy: [
    'Only blue Wikisource links from 古詩源 漢詩 sections are selected.',
    'Red links are kept out because they have no direct dump page.',
    'These candidates are for source-witness recovery, not direct DB upsert.',
  ],
  candidates,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function extractHanLinkCandidates(page) {
  const chunks = [
    ...page.html.matchAll(/<h2\b[\s\S]*?<\/h2>|<h3\b[\s\S]*?<\/h3>|<p>[\s\S]*?<\/p>/g),
  ];
  const candidates = [];
  let currentSection = null;
  let currentAuthor = null;

  for (const match of chunks) {
    const chunk = match[0];
    if (chunk.startsWith('<h2')) {
      currentSection = cleanHeading(chunk);
      currentAuthor = null;
      continue;
    }
    if (chunk.startsWith('<h3')) {
      currentAuthor = cleanHeading(chunk);
      continue;
    }
    if (!['卷二漢詩', '卷三漢詩', '卷四漢詩'].includes(currentSection)) continue;

    for (const anchor of chunk.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      const attrs = anchor[1];
      if (/\bclass="[^"]*\bnew\b/.test(attrs)) continue;
      const title = attr(attrs, 'title');
      const href = attr(attrs, 'href');
      if (!title || !href || href.startsWith('/w/')) continue;
      candidates.push({
        eraSlug: 'han',
        priority: 'gushiyuan-blue-link',
        rawTitle: title,
        normalizedTitle: normalizeTitle(title),
        authorHint: currentAuthor || '佚名',
        sourcePageTitle: page.title,
        sourceUrl: page.sourceUrl || 'https://zh.wikisource.org/wiki/古詩源',
        sourceSection: currentSection,
        sourceLinkHref: href,
      });
    }
  }

  return dedupeBy(candidates, (candidate) => `${candidate.rawTitle}|${candidate.sourceSection}`);
}

function normalizeTitle(title) {
  return normalizeChineseForHanshinaru(title)
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function cleanHeading(html) {
  return normalizeChineseForHanshinaru(decodeHtml(html.replace(/<[^>]+>/g, '')))
    .replace(/\s+/g, '')
    .trim();
}

function attr(html, name) {
  const match = html.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decodeHtml(match[1]).trim() : null;
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#160;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function dedupeBy(items, selector) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = selector(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
