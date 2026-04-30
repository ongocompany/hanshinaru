#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUTS = {
  classicIndex: resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-pages.classic-index.dump.raw.v1.json'),
  classicFamous: resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-pages.classic-famous.dump.raw.v1.json'),
  authorIndex: resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-pages.author-index.dump.raw.v1.json'),
  authorCollectionIndex: resolve(
    ROOT,
    'docs/spec/cn-pre-tang-high-yield-source-pages.author-collection-index.dump.raw.v1.json',
  ),
  authorCollectionVolume: resolve(
    ROOT,
    'docs/spec/cn-pre-tang-high-yield-source-pages.author-collection-volume.dump.raw.v1.json',
  ),
  authorFamous: resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield-source-pages.author-famous.dump.raw.v1.json'),
};
const RECORDS_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield.extracted-records.v1.json');
const REPORT_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-high-yield.extracted-records.report.v1.json');

const docs = Object.fromEntries(Object.entries(INPUTS).map(([key, path]) => [key, readJson(path)]));
const generatedAt = new Date().toISOString();
const records = [
  ...extractCollectionWitnesses(docs.classicIndex.pages ?? [], 'classic-index'),
  ...extractCollectionWitnesses(docs.authorCollectionIndex.pages ?? [], 'author-collection-index'),
  ...extractCollectionWitnesses(docs.authorCollectionVolume.pages ?? [], 'author-collection-volume'),
  ...extractClassicWorks(docs.classicFamous.pages ?? []),
  ...extractAuthorWorks(docs.authorFamous.pages ?? []),
];
const skipped = [
  ...skippedFetches('author-index', docs.authorIndex.pages ?? []),
  ...records.filter((record) => record.extraction.status !== 'ok'),
];
const okRecords = records.filter((record) => record.extraction.status === 'ok');

const payload = {
  version: '2026-04-30.v1',
  batchId: 'cn-pre-tang-high-yield-extracted-records',
  generatedAt,
  sourcePolicy: 'high-yield public-domain source witnesses from zhwikisource dump',
  records: okRecords,
};
const report = {
  batchId: payload.batchId,
  generatedAt,
  summary: {
    records: okRecords.length,
    byRecordType: countBy(okRecords, (record) => record.recordType),
    byFamily: countBy(okRecords, (record) => record.sourceFamily),
    byEra: countBy(okRecords, (record) => record.eraSlug),
    skipped: skipped.length,
    skippedByReason: countBy(skipped, (item) => item.extraction?.reason ?? item.reason),
  },
  skipped,
  next: [
    'Split 陶淵明集 四庫全書本 volume witnesses by SK anchor after a safe title/body boundary parser is added.',
    'Generate full 詩經 305-work target list from the 詩經 index page.',
    'Generate exact 楚辭 title variants from the 楚辭 index page for 離騷 and 天問.',
  ],
};

writeJson(RECORDS_OUT, payload);
writeJson(REPORT_OUT, report);
console.log(`wrote ${RECORDS_OUT}`);
console.log(`wrote ${REPORT_OUT}`);
console.log(JSON.stringify(report.summary, null, 2));

function extractCollectionWitnesses(pages, sourceKind) {
  return pages.map((page) => {
    if (page.fetchStatus !== 'ok') {
      return failedRecord(page, sourceKind, 'dump-fetch-missing');
    }
    const wikitext = String(page.wikitext ?? '');
    const titleList = extractLinkedTitles(wikitext);
    return baseRecord(page, {
      recordType: 'collection-witness',
      titleZh: page.normalizedTitle || page.rawTitle,
      authorZh: collectionAuthorFor(page),
      sourceKind,
      textZh: titleList.join('\n') || cleanPlainText(wikitext).slice(0, 4000),
      extraction: {
        status: 'ok',
        method: titleList.length ? 'linked-title-list' : 'plain-summary-snapshot',
        linkedTitles: titleList.length,
      },
    });
  });
}

function extractClassicWorks(pages) {
  return pages.map((page) => {
    if (page.fetchStatus !== 'ok') return failedRecord(page, 'classic-famous-work', 'dump-fetch-missing');
    if (isRedirectPage(page.wikitext)) {
      return failedRecord(page, 'classic-famous-work', 'redirect-page');
    }
    const family = page.sourceFamily;
    const poemBlock = family === 'shijing' ? extractLastPoemBlock(page.wikitext) : '';
    const indentedLines = family === 'shijing' && !poemBlock ? extractIndentedVerseLines(page.wikitext) : '';
    const body = family === 'shijing' ? poemBlock || indentedLines : extractPlainWorkBody(page.wikitext);
    if (!body) return failedRecord(page, 'classic-famous-work', 'body-not-found');
    return baseRecord(page, {
      recordType: 'work',
      titleZh: titleFromRawTitle(page.rawTitle),
      authorZh: family === 'chuci' ? authorForChuci(page.rawTitle) : '佚名/詩經',
      sourceKind: 'classic-famous-work',
      textZh: body,
      extraction: {
        status: 'ok',
        method: family === 'shijing'
          ? (poemBlock ? 'last-poem-block' : 'indented-verse-lines')
          : 'plain-work-body',
      },
    });
  });
}

function extractAuthorWorks(pages) {
  return pages.flatMap((page) => {
    if (page.fetchStatus !== 'ok') return [failedRecord(page, 'author-famous-work', 'dump-fetch-missing')];
    if (isRedirectPage(page.wikitext)) {
      return [failedRecord(page, 'author-famous-work', 'redirect-page')];
    }

    if (page.rawTitle === '飲酒二十首' || page.rawTitle === '歸園田居') {
      const parts = splitNumberedSections(page.wikitext);
      if (!parts.length) return [failedRecord(page, 'author-famous-work', 'numbered-sections-not-found')];
      return parts.map((part) => baseRecord(page, {
        recordType: 'work',
        titleZh: `${page.rawTitle} ${part.heading}`,
        authorZh: '陶淵明',
        sourceKind: 'author-famous-work',
        textZh: part.body,
        extraction: {
          status: 'ok',
          method: 'numbered-section-poem',
          section: part.heading,
        },
      }));
    }

    const isProse = /記|傳/.test(page.rawTitle);
    const body = isProse
      ? extractOnlyincludePlainBody(page.wikitext)
      : extractFirstPoemBlock(page.wikitext) || extractOnlyincludePlainBody(page.wikitext);
    if (!body) return [failedRecord(page, 'author-famous-work', 'body-not-found')];
    return [baseRecord(page, {
      recordType: isProse ? 'prose-work' : 'work',
      titleZh: page.rawTitle,
      authorZh: '陶淵明',
      sourceKind: 'author-famous-work',
      textZh: body,
      extraction: {
        status: 'ok',
        method: isProse ? 'onlyinclude-plain-body' : 'first-poem-block',
      },
    })];
  });
}

function splitNumberedSections(wikitext) {
  const text = String(wikitext ?? '');
  const pattern = /^={2,4}\s*(其[一二三四五六七八九十]+)\s*={2,4}\s*$/gm;
  const headings = [...text.matchAll(pattern)].map((match) => ({
    heading: match[1],
    start: match.index,
    bodyStart: match.index + match[0].length,
  }));
  return headings.map((heading, index) => {
    const next = headings[index + 1];
    const body = extractFirstPoemBlock(text.slice(heading.bodyStart, next?.start ?? text.length))
      || cleanPlainText(text.slice(heading.bodyStart, next?.start ?? text.length));
    return { heading: heading.heading, body };
  }).filter((item) => item.body);
}

function baseRecord(page, { recordType, titleZh, authorZh, sourceKind, textZh, extraction }) {
  const normalizedTitle = normalizeChineseForHanshinaru(titleZh);
  const normalizedAuthor = normalizeChineseForHanshinaru(authorZh);
  const normalizedText = normalizeBody(textZh);
  return {
    recordId: stableRecordId(page.sourceFamily, recordType, normalizedTitle, normalizedAuthor, page.rawTitle),
    recordType,
    country: 'CN',
    eraSlug: page.eraSlug,
    sourceFamily: page.sourceFamily,
    title: { zh: normalizedTitle, ko: null },
    author: { zh: normalizedAuthor, ko: null, life: authorLifeFor(normalizedAuthor) },
    sourcePage: {
      title: page.rawTitle,
      sourceUrl: page.sourceUrl,
      kind: sourceKind,
    },
    text: {
      textZh: normalizedText,
      poemZh: recordType === 'work' ? normalizedText : null,
      lineCount: normalizedText.split(/\r?\n/).filter(Boolean).length,
      charCount: Array.from(normalizedText.replace(/\s/g, '')).length,
    },
    review: {
      status: 'needs-review',
      reasons: reviewReasonsFor(recordType, normalizedText, extraction),
    },
    extraction,
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

function failedRecord(page, sourceKind, reason) {
  return {
    rawTitle: page.rawTitle,
    sourceFamily: page.sourceFamily,
    sourceKind,
    extraction: { status: 'skipped', reason },
  };
}

function skippedFetches(group, pages) {
  return pages
    .filter((page) => page.fetchStatus !== 'ok')
    .map((page) => ({
      rawTitle: page.rawTitle,
      sourceFamily: page.sourceFamily,
      group,
      reason: 'dump-fetch-missing',
    }));
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

function extractFirstPoemBlock(wikitext) {
  const match = String(wikitext ?? '').match(/<poem[^>]*>([\s\S]*?)<\/poem>/i);
  return match ? cleanPlainText(match[1]) : '';
}

function isRedirectPage(wikitext) {
  return /^#\s*(?:redirect|重定向)/i.test(String(wikitext ?? '').trim());
}

function extractPlainWorkBody(wikitext) {
  const text = String(wikitext ?? '')
    .replace(/\{\{header[\s\S]*?\n}}\s*/i, '')
    .replace(/\{\{header2[\s\S]*?\n}}\s*/i, '')
    .replace(/\{\{Collection header[\s\S]*?\n}}\s*/i, '');
  return cleanPlainText(text);
}

function extractOnlyincludePlainBody(wikitext) {
  const match = String(wikitext ?? '').match(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/i);
  return match ? cleanPlainText(match[1]) : cleanPlainText(wikitext);
}

function extractLinkedTitles(wikitext) {
  const titles = [];
  const linkPattern = /\[\[(?:\/)?([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?]]/g;
  let match;
  while ((match = linkPattern.exec(String(wikitext ?? '')))) {
    const title = cleanPlainText(match[2] || match[1]).trim();
    if (!title || /^(File|Category|作者|Page|Wikisource):/.test(title)) continue;
    if (/^(上一|下一|目錄|序|卷\d+)/.test(title)) continue;
    titles.push(title);
  }
  return [...new Set(titles)];
}

function cleanPlainText(value) {
  let text = String(value ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref\b[^/>]*\/>/gi, '')
    .replace(/<templatestyles[\s\S]*?\/>/gi, '')
    .replace(/\{\{另\|([^|{}]+)\|[^{}]*\}\}/g, '$1')
    .replace(/\{\{ProperNoun\|([^{}]+)\}\}/g, '$1')
    .replace(/\{\{SK anchor\|([^{}]+)\}\}/g, '\n$1\n')
    .replace(/\{\{SK notes\|[^{}]*\}\}/g, '')
    .replace(/\{\{YL\|([^|{}]+)\|[^{}]*\}\}/g, '$1');
  for (let index = 0; index < 8; index += 1) {
    const next = text.replace(/\{\{[^{}]*\}\}/g, '');
    if (next === text) break;
    text = next;
  }
  return text
    .replace(/-\{(?:zh:[^;{}]+;)?zh-hant:([^;{}]+);zh-hans:[^{}]+}-/g, '$1')
    .replace(/-\{(?:zh:[^;{}]+;)?zh-hans:[^;{}]+;zh-hant:([^{}]+)}-/g, '$1')
    .replace(/-\{[^{}]*zh-hans:([^;{}]+);[^{}]*zh-hant:([^;{}]+)[^{}]*\}-/g, '$2')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<\/?onlyinclude>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^:+/gm, '')
    .replace(/^[#*]\s*/gm, '')
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

function titleFromRawTitle(rawTitle) {
  return String(rawTitle ?? '').split('/').at(-1);
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

function collectionAuthorFor(page) {
  if (page.sourceFamily === 'chuci') return '劉向';
  if (page.sourceFamily === 'tao-yuanming') return '陶淵明';
  return '佚名';
}

function authorLifeFor(authorZh) {
  return {
    陶淵明: '365-427',
    屈原: '約前340-前278',
  }[authorZh] ?? null;
}

function stableRecordId(sourceFamily, recordType, titleZh, authorZh, rawTitle) {
  return `CN-HIGHYIELD-${slugify(`${sourceFamily}-${recordType}-${titleZh}-${authorZh}-${rawTitle}`)}`;
}

function slugify(value) {
  return Array.from(String(value ?? ''))
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
}

function reviewReasonsFor(recordType, textZh, extraction) {
  const reasons = [recordType, extraction.method ?? extraction.reason ?? 'unknown-method'];
  if (textZh.length > 4000) reasons.push('long-text');
  if (recordType === 'collection-witness') reasons.push('not-poem-record');
  return reasons;
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) ?? '(none)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, payload) {
  mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}
