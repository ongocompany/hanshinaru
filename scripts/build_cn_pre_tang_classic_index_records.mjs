#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-index-pages.dump.raw.v1.json');
const REDIRECT_INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-redirect-pages.dump.raw.v1.json');
const RECORDS_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-index.extracted-records.v1.json');
const REPORT_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-classic-index.extracted-records.report.v1.json');
const SHIJING_TEXT_LOST_ORDERS = new Set([171, 172, 173, 176, 177, 178]);

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const redirectRaw = existsSync(REDIRECT_INPUT) ? JSON.parse(readFileSync(REDIRECT_INPUT, 'utf8')) : { pages: [] };
const generatedAt = new Date().toISOString();
const sourcePages = mergeRedirectTargetPages(raw.pages ?? [], redirectRaw.pages ?? []);
const extracted = sourcePages.map(extractPageRecord);
const records = extracted.filter((item) => item.extraction.status === 'ok');
const skipped = extracted.filter((item) => item.extraction.status !== 'ok');

const payload = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-classic-index-extracted-records',
  generatedAt,
  source: INPUT,
  sourcePolicy: 'classic index exact pages from zhwikisource dump',
  records,
};
const report = {
  batchId: payload.batchId,
  generatedAt,
  source: INPUT,
  summary: {
    sourcePages: raw.pages?.length ?? 0,
    redirectTargetPages: redirectRaw.pages?.length ?? 0,
    records: records.length,
    byFamily: countBy(records, (record) => record.sourceFamily),
    skipped: skipped.length,
    skippedByReason: countBy(skipped, (item) => item.extraction.reason),
    skippedByFamily: countBy(skipped, (item) => item.sourceFamily),
  },
  skipped,
  next: [
    'Decide whether duplicate 詩經 titles should be separate canonical records or linked as same text witness with different canonical positions.',
    'After review sampling, map these records into the DB ingest payload format.',
  ],
};

writeJson(RECORDS_OUT, payload);
writeJson(REPORT_OUT, report);
console.log(`wrote ${RECORDS_OUT}`);
console.log(`wrote ${REPORT_OUT}`);
console.log(JSON.stringify(report.summary, null, 2));

function extractPageRecord(page) {
  if (page.fetchStatus !== 'ok') return skippedPage(page, 'dump-fetch-missing');
  if (isRedirectPage(page.wikitext)) return skippedPage(page, 'redirect-page');
  if (page.sourceFamily === 'shijing' && SHIJING_TEXT_LOST_ORDERS.has(page.order)) {
    return skippedPage(page, 'text-lost');
  }

  const body = page.sourceFamily === 'shijing'
    ? extractShijingBody(page)
    : extractChuciBody(page.wikitext);
  if (!body) return skippedPage(page, 'body-not-found');
  if (/^有其義而亡其辭。?$/.test(body)) return skippedPage(page, 'text-lost');

  return baseRecord(page, body);
}

function mergeRedirectTargetPages(primaryPages, redirectPages) {
  const redirectByOrigin = new Map(
    redirectPages
      .filter((page) => page.fetchStatus === 'ok')
      .map((page) => [canonicalKey(page), page]),
  );
  return primaryPages.map((page) => {
    if (!isRedirectPage(page.wikitext)) return page;
    return redirectByOrigin.get(canonicalKey(page)) ?? page;
  });
}

function canonicalKey(page) {
  return `${page.sourceFamily}:${page.order}:${page.displayTitleZh}`;
}

function extractShijingBody(page) {
  return extractLastPoemBlock(page.wikitext)
    || extractIndentedVerseLines(page.wikitext)
    || extractShijingTableBody(page.wikitext, page.displayTitleZh)
    || extractShijingNamedSection(page.wikitext, page.displayTitleZh);
}

function extractChuciBody(wikitext) {
  return extractAllPoemSections(wikitext) || extractOnlyincludePlainBody(wikitext) || extractPlainWorkBody(wikitext);
}

function extractAllPoemSections(wikitext) {
  const text = String(wikitext ?? '');
  const matches = [...text.matchAll(/<poem[^>]*>([\s\S]*?)<\/poem>/gi)];
  if (!matches.length) return '';
  return matches.map((match) => {
    const heading = nearestHeadingBefore(text, match.index);
    const body = cleanPlainText(match[1]);
    return heading ? `${heading}\n${body}` : body;
  }).filter(Boolean).join('\n');
}

function nearestHeadingBefore(text, index) {
  const before = text.slice(0, index);
  const headings = [...before.matchAll(/^={2,4}\s*([^=\n]+?)\s*={2,4}\s*$/gm)];
  return headings.at(-1)?.[1]?.trim() ?? '';
}

function extractLastPoemBlock(wikitext) {
  const matches = [...String(wikitext ?? '').matchAll(/<poem[^>]*>([\s\S]*?)<\/poem>/gi)];
  if (!matches.length) return '';
  return cleanPlainText(matches.at(-1)[1]);
}

function extractIndentedVerseLines(wikitext) {
  const lines = String(wikitext ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(':'))
    .filter((line) => !/^:《/.test(line));
  return cleanPlainText(lines.join('\n'));
}

function extractShijingNamedSection(wikitext, title) {
  const text = String(wikitext ?? '');
  const escapedTitle = escapeRegExp(title);
  const heading = new RegExp(`^={2,4}\\s*${escapedTitle}\\s*={2,4}\\s*$`, 'm').exec(text);
  if (!heading) return '';
  const afterHeading = text.slice(heading.index + heading[0].length);
  const endMatch = /^(?::《|={2,4}\s*註解\s*={2,4}|__NOTOC__|__NOEDITSECTION__|\{\{)/m.exec(afterHeading);
  return cleanPlainText(afterHeading.slice(0, endMatch?.index ?? afterHeading.length));
}

function extractShijingTableBody(wikitext, title) {
  const text = String(wikitext ?? '');
  const escapedTitle = escapeRegExp(title);
  const tablePattern = new RegExp(`!\\s*${escapedTitle}\\s*\\n([\\s\\S]*?)\\|}`, 'm');
  const match = tablePattern.exec(text);
  if (!match) return '';
  return cleanPlainText(match[1])
    .split(/\r?\n/)
    .filter((line) => !/^詩經/.test(line))
    .join('\n');
}

function extractOnlyincludePlainBody(wikitext) {
  const match = String(wikitext ?? '').match(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/i);
  return match ? cleanPlainText(match[1]) : '';
}

function extractPlainWorkBody(wikitext) {
  const text = String(wikitext ?? '')
    .replace(/\{\{header[\s\S]*?\n}}\s*/i, '')
    .replace(/\{\{header2[\s\S]*?\n}}\s*/i, '')
    .replace(/\{\{Collection header[\s\S]*?\n}}\s*/i, '')
    .replace(/__NOTOC__/g, '')
    .replace(/__NOEDITSECTION__/g, '');
  return cleanPlainText(text);
}

function isRedirectPage(wikitext) {
  return /^#\s*(?:redirect|重定向)/i.test(String(wikitext ?? '').trim());
}

function baseRecord(page, textZh) {
  const titleZh = normalizeChineseForHanshinaru(page.displayTitleZh || titleFromRawTitle(page.rawTitle));
  const authorZh = normalizeChineseForHanshinaru(page.authorHint || authorForPage(page));
  const normalizedText = normalizeBody(textZh);
  return {
    recordId: stableRecordId(page.sourceFamily, titleZh, authorZh, page.rawTitle, page.order),
    recordType: 'work',
    country: 'CN',
    eraSlug: page.eraSlug,
    sourceFamily: page.sourceFamily,
    title: { zh: titleZh, ko: null },
    author: { zh: authorZh, ko: null, life: authorLifeFor(authorZh) },
    canonicalPosition: {
      sourcePageTitle: page.sourcePageTitle,
      order: page.order,
      rawTitle: page.rawTitle,
    },
    sourcePage: {
      title: page.rawTitle,
      sourceUrl: page.sourceUrl,
      kind: 'classic-index-work',
    },
    text: {
      textZh: normalizedText,
      poemZh: normalizedText,
      lineCount: normalizedText.split(/\r?\n/).filter(Boolean).length,
      charCount: Array.from(normalizedText.replace(/\s/g, '')).length,
    },
    review: {
      status: 'needs-review',
      reasons: ['classic-index-work', page.sourceFamily],
    },
    extraction: {
      status: 'ok',
      method: page.sourceFamily === 'shijing' ? 'shijing-poem-body' : 'chuci-work-body',
    },
    rights: {
      originalText: {
        sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
        sourceUrl: page.sourceUrl,
        publicDisplayAllowedNow: true,
        commercialAllowedNow: true,
        attributionRequired: true,
      },
    },
  };
}

function skippedPage(page, reason) {
  return {
    rawTitle: page.rawTitle,
    displayTitleZh: page.displayTitleZh ?? null,
    sourceFamily: page.sourceFamily,
    order: page.order ?? null,
    sourceUrl: page.sourceUrl ?? null,
    extraction: { status: 'skipped', reason },
  };
}

function cleanPlainText(value) {
  let text = String(value ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref\b[^/>]*\/>/gi, '')
    .replace(/<templatestyles[\s\S]*?\/>/gi, '')
    .replace(/\{\{另\|([^|{}]+)\|[^{}]*\}\}/g, '$1')
    .replace(/\{\{ProperNoun\|([^{}]+)\}\}/g, '$1')
    .replace(/\{\{參\|([^|{}]+)\|[^{}]*\}\}/g, '$1')
    .replace(/\{\{YL\|([^|{}]+)\|[^{}]*\}\}/g, '$1');
  for (let index = 0; index < 8; index += 1) {
    const next = text.replace(/\{\{[^{}]*\}\}/g, '');
    if (next === text) break;
    text = next;
  }
  return text
    .replace(/-\{\}-/g, '')
    .replace(/-\{(?:zh:[^;{}]+;)?zh-hant:([^;{}]+);zh-hans:[^{}]+}-/g, '$1')
    .replace(/-\{(?:zh:[^;{}]+;)?zh-hans:[^;{}]+;zh-hant:([^{}]+)}-/g, '$1')
    .replace(/-\{[^{}]*zh-hans:([^;{}]+);[^{}]*zh-hant:([^;{}]+)[^{}]*\}-/g, '$2')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\[\[File:[^\]]+]]/g, '')
    .replace(/\[\[Category:[^\]]+]]/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<\/?onlyinclude>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^:+/gm, '')
    .replace(/^[#*]\s*/gm, '')
    .replace(/^={2,4}\s*([^=\n]+?)\s*={2,4}\s*$/gm, '$1')
    .replace(/[ \t　]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function normalizeBody(value) {
  return cleanPlainText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleFromRawTitle(rawTitle) {
  return String(rawTitle ?? '').split('/').at(-1);
}

function authorForPage(page) {
  return page.sourceFamily === 'shijing' ? '佚名/詩經' : authorForChuci(page.rawTitle);
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

function authorLifeFor(authorZh) {
  return {
    屈原: '約前340-前278',
  }[authorZh] ?? null;
}

function stableRecordId(sourceFamily, titleZh, authorZh, rawTitle, order) {
  return `CN-CLASSIC-${slugify(`${sourceFamily}-${order}-${titleZh}-${authorZh}-${rawTitle}`)}`;
}

function slugify(value) {
  return Array.from(String(value ?? ''))
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function writeJson(path, payload) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}
