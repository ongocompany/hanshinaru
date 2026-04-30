#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeChineseForHanshinaru } from './lib/cn_hansi_text_normalizer.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.sources.raw.json');
const GUSHIYUAN_LINK_PAGES_INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-gushiyuan-link-pages.dump.raw.v1.json');
const GUSHIYUAN_SECOND_PASS_PAGES_INPUT = resolve(
  ROOT,
  'docs/spec/cn-pre-tang-gushiyuan-second-pass-pages.dump.raw.v1.json',
);
const RECORDS_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json');
const REPORT_OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json');

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const sourcePages = raw.pages ?? [];
const gushiYuanLinkPages = readJsonIfExists(GUSHIYUAN_LINK_PAGES_INPUT)?.pages ?? [];
const gushiYuanSecondPassPages = readJsonIfExists(GUSHIYUAN_SECOND_PASS_PAGES_INPUT)?.pages ?? [];
const generatedAt = new Date().toISOString();
const gushiYuanLinkedResult = extractGushiYuanLinkedDumpPages(gushiYuanLinkPages);
const gushiYuanLinkedRecords = gushiYuanLinkedResult.records;
const gushiYuanSecondPassResult = extractGushiYuanLinkedDumpPages(gushiYuanSecondPassPages);
const gushiYuanSecondPassRecords = gushiYuanSecondPassResult.records;
const records = [
  ...extractGushiYuanFirstTranche(sourcePages.find((page) => page.title === '古詩源')),
  ...extractStandaloneSeedPages(sourcePages),
  ...gushiYuanLinkedRecords,
  ...gushiYuanSecondPassRecords,
];
const dedupedRecords = dedupeRecords(records);

const report = {
  batchId: 'cn-pre-tang-first-tranche-cached-sources',
  generatedAt,
  source: INPUT,
  summary: {
    sourcePages: sourcePages.length,
    extractedRecords: dedupedRecords.length,
    byEra: countBy(dedupedRecords, (record) => record.eraSlug),
    bySourcePage: countBy(dedupedRecords, (record) => record.sourcePage.title),
    bySourceKind: countBy(dedupedRecords, (record) => record.sourcePage.kind),
    gushiYuanLinkedDumpPages: {
      inputPages: gushiYuanLinkPages.length,
      fetchedOk: gushiYuanLinkPages.filter((page) => page.fetchStatus === 'ok').length,
      extractedRecords: gushiYuanLinkedRecords.length,
      skippedWithoutBody: gushiYuanLinkedResult.skipped.length,
      skippedByReason: countBy(gushiYuanLinkedResult.skipped, (item) => item.reason),
    },
    gushiYuanSecondPassDumpPages: {
      inputPages: gushiYuanSecondPassPages.length,
      fetchedOk: gushiYuanSecondPassPages.filter((page) => page.fetchStatus === 'ok').length,
      extractedRecords: gushiYuanSecondPassRecords.length,
      skippedWithoutBody: gushiYuanSecondPassResult.skipped.length,
      skippedByReason: countBy(gushiYuanSecondPassResult.skipped, (item) => item.reason),
    },
  },
  skippedGushiYuanLinkedPages: gushiYuanLinkedResult.skipped,
  skippedGushiYuanSecondPassPages: gushiYuanSecondPassResult.skipped,
  policy: [
    'This is a companion-source recovery after exact 先秦漢魏晉南北朝詩 volume titles were missing in the zhwikisource dump.',
    'Records are source witnesses, not final DB upserts.',
    '詩經 and 楚辭 remain excluded from this first tranche body.',
  ],
};

writeJson(RECORDS_OUT, {
  version: '2026-04-30.v1',
  batchId: report.batchId,
  generatedAt,
  sourcePolicy: 'cached zh Wikisource companion sources',
  records: dedupedRecords,
});
writeJson(REPORT_OUT, report);

console.log(`wrote ${RECORDS_OUT}`);
console.log(`wrote ${REPORT_OUT}`);
console.log(JSON.stringify(report.summary, null, 2));

function extractGushiYuanFirstTranche(page) {
  if (!page?.html) return [];
  const html = page.html;
  const tokens = [
    ...html.matchAll(
      /<h2\b[\s\S]*?<\/h2>|<p>\s*<a\b(?:(?!<\/p>).)*<\/a>\s*<\/p>\s*<div class="poem">[\s\S]*?<\/div>/gs,
    ),
  ];
  let currentSection = null;
  const records = [];

  for (const token of tokens) {
    const chunk = token[0];
    if (chunk.startsWith('<h2')) {
      currentSection = cleanText(chunk);
      continue;
    }
    const eraSlug = eraSlugForGushiYuanSection(currentSection);
    if (!eraSlug) continue;
    const title = extractAnchorTitle(chunk);
    const poemZh = extractPoemBody(chunk);
    if (!title || !poemZh) continue;
    records.push(buildRecord({
      sourcePage: page,
      sourceSection: currentSection,
      sourceKind: 'anthology-section',
      eraSlug,
      titleZh: title,
      authorZh: eraSlug === 'pre-qin' ? '佚名' : inferAuthorFromTitle(title),
      poemZh,
    }));
  }

  return records;
}

function extractStandaloneSeedPages(pages) {
  return pages
    .filter((page) => page.title && page.title !== '古詩源')
    .map((page) => {
      const poemZh = extractPoemBody(page.html ?? '');
      if (!poemZh) return null;
      const eraSlug = inferEraFromStandalonePage(page);
      if (!eraSlug) return null;
      return buildRecord({
        sourcePage: page,
        sourceSection: page.category ?? null,
        sourceKind: 'standalone-page',
        eraSlug,
        titleZh: page.title,
        authorZh: inferAuthorFromPage(page),
        poemZh,
      });
    })
    .filter(Boolean);
}

function extractGushiYuanLinkedDumpPages(pages) {
  const records = [];
  const skipped = [];

  for (const page of pages) {
    if (page.fetchStatus !== 'ok') {
      skipped.push(skipPage(page, 'dump-fetch-missing'));
      continue;
    }

    const bodyResult = extractBodyResultFromGushiYuanLinkedPage(page);
    if (!bodyResult.poemZh) {
      skipped.push(skipPage(page, bodyResult.reason));
      continue;
    }

    records.push(buildRecord({
      sourcePage: {
        title: page.sourcePageTitle || '古詩源',
        sourceUrl: page.sourceUrl,
      },
      sourceSection: page.sourceSection ?? null,
      sourceKind: 'gushiyuan-linked-dump-page',
      eraSlug: page.eraSlug,
      titleZh: page.normalizedTitle || page.rawTitle,
      authorZh: normalizeGushiYuanAuthorHint(page.authorHint)
        || inferAuthorFromTitle(page.normalizedTitle || page.rawTitle),
      poemZh: bodyResult.poemZh,
    }));
  }

  return { records, skipped };
}

function extractBodyResultFromGushiYuanLinkedPage(page) {
  const poemZh = extractPoemBodyFromWikitext(page.wikitext ?? '')
    || extractConservativePlainBodyFromWikitext(page);
  if (poemZh) return { poemZh, reason: null };

  const wikitext = String(page.wikitext ?? '');
  if (/disambig|消歧義|消歧义/i.test(wikitext)) return { poemZh: '', reason: 'disambiguation-page' };
  if (/\{\{:[^}]+}}/.test(wikitext)) return { poemZh: '', reason: 'transclusion-index-page' };
  return { poemZh: '', reason: 'no-supported-poem-body' };
}

function buildRecord({ sourcePage, sourceSection, sourceKind, eraSlug, titleZh, authorZh, poemZh }) {
  const normalizedTitle = normalizeChineseForHanshinaru(titleZh);
  const normalizedAuthor = normalizeChineseForHanshinaru(authorZh || '佚名');
  const normalizedPoem = normalizePoemBody(poemZh);
  return {
    recordId: stableRecordId(eraSlug, normalizedTitle, normalizedAuthor),
    country: 'CN',
    eraSlug,
    title: { zh: normalizedTitle, ko: null },
    author: { zh: normalizedAuthor, ko: null, life: null },
    sourcePage: {
      title: sourcePage.title,
      sourceUrl: sourcePage.sourceUrl,
      section: sourceSection,
      kind: sourceKind,
    },
    text: {
      poemZh: normalizedPoem,
      lineCount: normalizedPoem.split(/\r?\n/).filter(Boolean).length,
      charCount: Array.from(normalizedPoem.replace(/\s/g, '')).length,
    },
    review: {
      status: 'needs-review',
      reasons: reviewReasonsFor(normalizedPoem, sourceKind),
    },
    rights: {
      originalText: {
        sourcePolicyId: 'SRC-ZH-WIKISOURCE-TEXT',
        sourceUrl: sourcePage.sourceUrl,
        publicDisplayAllowedNow: true,
        commercialAllowedNow: true,
        attributionRequired: true,
      },
    },
  };
}

function eraSlugForGushiYuanSection(section) {
  if (section === '卷一古逸') return 'pre-qin';
  if (section === '卷二漢詩' || section === '卷三漢詩') return 'han';
  return null;
}

function extractAnchorTitle(html) {
  const match = html.match(/<a\b[^>]*title="([^"]+)"/);
  return match ? decodeHtml(match[1]).replace(/\s*\([^)]*\)\s*$/g, '').trim() : null;
}

function extractPoemBody(html) {
  const match = html.match(/<div class="poem">([\s\S]*?)<\/div>/);
  if (!match) return '';
  return cleanPoemHtml(match[1]);
}

function extractPoemBodyFromWikitext(wikitext) {
  const poemMatches = [...String(wikitext ?? '').matchAll(/<poem[^>]*>([\s\S]*?)<\/poem>/gi)];
  if (!poemMatches.length) return '';
  return poemMatches
    .map((match) => cleanPoemWikitext(match[1]))
    .filter(Boolean)
    .join('\n\n');
}

function extractConservativePlainBodyFromWikitext(page) {
  const wikitext = String(page.wikitext ?? '');
  if (/disambig|消歧義|消歧义/i.test(wikitext)) return '';
  if (page.rawTitle === '四愁詩') {
    return cleanPoemWikitext(wikitext
      .split(/\r?\n/)
      .filter((line) => !line.startsWith('{{') && !line.startsWith('==') && /[，。！？]/.test(line))
      .join('\n'));
  }
  if (page.rawTitle === '柏梁詩') {
    return cleanPoemWikitext(wikitext
      .split(/\r?\n/)
      .filter((line) => /[，。！？]/.test(line) && !line.includes('作者:'))
      .join('\n'));
  }
  if (page.rawTitle === '善哉行 (漢樂府)') {
    const matches = [...wikitext.matchAll(/\{\{VtextStart}}([\s\S]*?)\{\{VtextEnd}}/g)];
    return matches.map((match) => cleanPoemWikitext(match[1])).filter(Boolean).join('\n');
  }
  if (['盤中詩', '古絕句'].includes(page.rawTitle)) {
    return cleanPoemWikitext(wikitext
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith(':') || /^其[一二三四五六七八九十]/.test(line.trim()))
      .join('\n'));
  }
  return '';
}

function skipPage(page, reason) {
  return {
    rawTitle: page.rawTitle ?? page.title ?? null,
    normalizedTitle: page.normalizedTitle ?? page.title ?? null,
    authorHint: page.authorHint ?? null,
    sourceSection: page.sourceSection ?? null,
    reason,
  };
}

function cleanPoemHtml(html) {
  return decodeHtml(
    html
      .replace(/<small[\s\S]*?<\/small>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<sup[\s\S]*?<\/sup>/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t　]+/g, ' ')
  )
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function cleanPoemWikitext(value) {
  return decodeHtml(String(value ?? '')
    .replace(/\{\{另\|([^|{}]+)\|[^{}]*\}\}/g, '$1')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\{\{(?:注|\*|lang|lang-zh|lang\|zh|SKchar)[\s\S]*?\}\}/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref\b[^/>]*\/>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?onlyinclude>/gi, '')
    .replace(/'''?/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^:+/gm, '')
    .replace(/[ \t　]+/g, ' '))
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function cleanText(html) {
  return normalizeChineseForHanshinaru(decodeHtml(html.replace(/<[^>]+>/g, '')))
    .replace(/\s+/g, '')
    .trim();
}

function normalizePoemBody(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => normalizeChineseForHanshinaru(line).trim())
    .filter(Boolean)
    .join('\n');
}

function inferEraFromStandalonePage(page) {
  if (page.category === '古詩十九首') return 'han';
  if (['上邪', '行行重行行', '迢迢牽牛星'].includes(page.title)) return 'han';
  return null;
}

function inferAuthorFromPage(page) {
  if (page.category === '古詩十九首') return '無名氏/古詩十九首';
  if (page.title === '上邪') return '無名氏/漢樂府';
  return '佚名';
}

function inferAuthorFromTitle(title) {
  if (/古詩|行行重行行|迢迢牽牛星|上邪|陌上桑|長歌行/.test(title)) return '無名氏';
  return '佚名';
}

function normalizeGushiYuanAuthorHint(authorHint) {
  const normalized = normalizeChineseForHanshinaru(authorHint || '').trim();
  return {
    高帝: '劉邦',
    武帝: '劉徹',
    烏孫公主: '劉細君',
    樂府歌辭: '無名氏/漢樂府',
  }[normalized] ?? normalized;
}

function reviewReasonsFor(poemZh, sourceKind) {
  const reasons = [sourceKind === 'anthology-section' ? 'anthology-section-extraction' : 'standalone-page-reuse'];
  const lineCount = poemZh.split(/\r?\n/).filter(Boolean).length;
  if (lineCount < 2) reasons.push('short-text');
  if (lineCount > 40) reasons.push('long-text');
  if (/[?？]/.test(poemZh)) reasons.push('uncertain-author-or-text-marker');
  return reasons;
}

function dedupeRecords(records) {
  const seen = new Set();
  const deduped = [];
  for (const record of records) {
    const key = `${record.eraSlug}|${record.title.zh}|${record.text.poemZh}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }
  return deduped;
}

function stableRecordId(eraSlug, titleZh, authorZh) {
  return `CN-PRETANG-CACHED-${eraSlug.toUpperCase()}-${slugify(`${titleZh}-${authorZh}`)}`;
}

function slugify(value) {
  return Array.from(value)
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
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

function readJsonIfExists(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
