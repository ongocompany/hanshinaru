#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-targets.v1.json');

const targets = [
  collectionTarget('詩經', 'shijing', 'classic-family-index'),
  ...[
    '關雎',
    '蒹葭',
    '桃夭',
    '采薇',
    '碩鼠',
    '氓',
    '無衣',
    '黍離',
    '七月',
    '蓼莪',
  ].map((title, index) => workTarget(`詩經/${title}`, 'shijing', 'classic-family-famous-work', index + 1)),

  collectionTarget('楚辭', 'chuci', 'classic-family-index'),
  ...[
    '楚辭/離騷',
    '楚辭/九歌',
    '楚辭/天問',
    '楚辭/九章',
    '楚辭/遠遊',
    '楚辭/卜居',
    '楚辭/漁父',
  ].map((title, index) => workTarget(title, 'chuci', 'classic-family-famous-work', index + 1)),

  collectionTarget('作者:陶淵明', 'tao-yuanming', 'author-index'),
  collectionTarget('陶淵明集 (四庫全書本)', 'tao-yuanming', 'author-collection-index'),
  ...numberedTitles('陶淵明集 (四庫全書本)', 1, 8, (n) => `卷${n}`, 'tao-yuanming', 'author-collection-volume'),
  ...[
    '飲酒二十首',
    '歸園田居',
    '歸園田居五首',
    '桃花源記',
    '歸去來辭並序',
    '五柳先生傳',
  ].map((title, index) => workTarget(title, 'tao-yuanming', 'author-famous-work', index + 1)),
];

const candidates = dedupeBy(targets, (item) => item.rawTitle);
const doc = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-high-yield-source-targets',
  purpose: 'Start collection by source availability for Hanshinaru-facing poems, collections, and poets.',
  generatedAt: new Date().toISOString(),
  summary: {
    selected: candidates.length,
    byFamily: countBy(candidates, (item) => item.sourceFamily),
    byPriority: countBy(candidates, (item) => item.priority),
  },
  candidates,
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.summary, null, 2));

function collectionTarget(rawTitle, sourceFamily, priority) {
  return {
    eraSlug: eraForFamily(sourceFamily),
    priority: `cn-pretang-high-yield-${priority}`,
    rawTitle,
    normalizedTitle: rawTitle,
    authorHint: sourceFamily === 'tao-yuanming' ? '陶淵明' : null,
    sourcePageTitle: rawTitle,
    sourceSection: null,
    sourceLinkHref: `/wiki/${rawTitle}`,
    sourceFamily,
  };
}

function workTarget(rawTitle, sourceFamily, priority, order) {
  return {
    ...collectionTarget(rawTitle, sourceFamily, priority),
    order,
  };
}

function numberedTitles(collectionTitle, start, end, suffixFor, sourceFamily, priority) {
  const items = [];
  for (let n = start; n <= end; n += 1) {
    const rawTitle = `${collectionTitle}/${suffixFor(n)}`;
    items.push({
      ...collectionTarget(rawTitle, sourceFamily, priority),
      volumeNumber: n,
    });
  }
  return items;
}

function eraForFamily(sourceFamily) {
  return {
    shijing: 'pre-qin',
    chuci: 'pre-qin',
    'tao-yuanming': 'jin',
  }[sourceFamily] ?? null;
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
