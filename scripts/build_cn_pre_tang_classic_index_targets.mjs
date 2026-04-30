#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-pages.classic-index.dump.raw.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-index-targets.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const pagesByTitle = new Map((raw.pages ?? []).map((page) => [page.rawTitle, page]));
const shijing = pagesByTitle.get('詩經');
const chuci = pagesByTitle.get('楚辭');

if (!shijing?.wikitext) throw new Error('Missing secured 詩經 index wikitext');
if (!chuci?.wikitext) throw new Error('Missing secured 楚辭 index wikitext');

const candidates = [
  ...extractShijingTargets(shijing.wikitext),
  ...extractChuciTargets(chuci.wikitext),
];
const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-classic-index-targets',
  source: INPUT,
  purpose: 'Expand secured 詩經 and 楚辭 index pages into exact zhwikisource dump lookup targets.',
  generatedAt: new Date().toISOString(),
  summary: {
    selected: candidates.length,
    uniqueRawTitles: new Set(candidates.map((item) => item.rawTitle)).size,
    byFamily: countBy(candidates, (item) => item.sourceFamily),
    byPriority: countBy(candidates, (item) => item.priority),
  },
  candidates,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function extractShijingTargets(wikitext) {
  return [...String(wikitext).matchAll(/#\s*\[\[\/([^|\]#]+)(?:#[^|\]]*)?\|([^\]]+)]]/g)]
    .map((match, index) => {
      const rawTitle = `詩經/${normalizeTitle(match[1])}`;
      return {
        eraSlug: 'pre-qin',
        priority: 'cn-pretang-classic-index-work',
        rawTitle,
        normalizedTitle: rawTitle,
        displayTitleZh: normalizeTitle(match[2]),
        authorHint: '佚名/詩經',
        sourceFamily: 'shijing',
        sourcePageTitle: '詩經',
        sourceLinkHref: `/wiki/${rawTitle}`,
        order: index + 1,
      };
    });
}

function extractChuciTargets(wikitext) {
  return [...String(wikitext).matchAll(/#\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|[^\]]+)?]]\s*([^\n]*)/g)]
    .map((match, index) => {
      const rawTitle = normalizeTitle(match[1]);
      const label = normalizeTitle(match[2]).replace(/第[一二三四五六七八九十]+$/, '');
      return {
        eraSlug: 'pre-qin',
        priority: 'cn-pretang-classic-index-work',
        rawTitle,
        normalizedTitle: rawTitle,
        displayTitleZh: label || rawTitle.split('/').at(-1),
        authorHint: authorForChuci(rawTitle),
        sourceFamily: 'chuci',
        sourcePageTitle: '楚辭',
        sourceLinkHref: `/wiki/${rawTitle}`,
        order: index + 1,
      };
    });
}

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/-\{([^{}]+)\}-/g, '$1')
    .trim();
}

function authorForChuci(rawTitle) {
  if (/九辯/.test(rawTitle)) return '宋玉';
  if (/招隱士/.test(rawTitle)) return '淮南小山';
  if (/七諫/.test(rawTitle)) return '東方朔';
  if (/九懷/.test(rawTitle)) return '王褒';
  if (/九歎/.test(rawTitle)) return '劉向';
  if (/九思/.test(rawTitle)) return '王逸';
  return '屈原';
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
