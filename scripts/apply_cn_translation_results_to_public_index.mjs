#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const QUEUE_PATH = resolve(ROOT, 'docs/spec/cn-translation-pipeline-staging.v1.json');
const RESULTS_PATH = resolve(ROOT, 'docs/spec/cn-translation-results.gemini-cli.v2.jsonl');
const POEMS_FULL_PATH = resolve(ROOT, 'public/index/poems.v3.json');
const POEMS_COMPACT_PATH = resolve(ROOT, 'public/index/poems.compact.json');
const AUTHORS_PATH = resolve(ROOT, 'public/index/db_author.with_ko.json');

const SOURCE_COLLECTION = 'cn-translation-gemini-cli-v2';
const POEM_NO_START = 321;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJsonl(path) {
  const text = readFileSync(path, 'utf8').trim();
  if (!text) return [];
  return text.split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
}

function firstLines(text, count = 2) {
  return normalizeWhitespace(text).split(/\n/).filter(Boolean).slice(0, count).join(' / ');
}

function stripPoetPrefix(authorZh) {
  return String(authorZh || '').replace(/^佚名\//, '').trim() || String(authorZh || '').trim();
}

function mapNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note, index) => {
    const head = String(note.word || note.head || '').trim();
    return {
      no: String(index + 1),
      head,
      headKo: '',
      headZh: head,
      text: String(note.meaning || note.text || '').trim(),
    };
  }).filter((note) => note.head || note.text);
}

function buildAuthor(record) {
  const nameZh = stripPoetPrefix(record.authorZh);
  return {
    titleId: record.poetSlug,
    sourceUrl: record.sourceUrl || null,
    name: {
      zh: nameZh,
      ko: record.authorKo || '',
    },
    life: {
      birth: null,
      death: null,
      raw: record.authorLife || '',
      birthApprox: false,
      deathApprox: false,
    },
    bioKo: '',
    era: {
      period: record.eraSlug,
      label: record.eraPeriod,
      confidence: 'source-record',
      source: SOURCE_COLLECTION,
    },
    birthplace: null,
    relations: [],
    sourceMeta: {
      collection: SOURCE_COLLECTION,
      country: record.country,
      batch: record.batch,
    },
  };
}

function buildFullPoem({ record, result, poemNo }) {
  const parsed = result.parsed;
  const notes = mapNotes(parsed.notes);
  const titleZh = `〈${record.titleZh}〉`;
  return {
    poemNoStr: String(poemNo).padStart(3, '0'),
    poemNo,
    title: {
      zh: titleZh,
      ko: parsed.title_ko || record.titleKo || '',
    },
    poet: {
      zh: stripPoetPrefix(record.authorZh),
      ko: record.authorKo || '',
    },
    category: record.category || record.quality || '中國古典詩',
    juan: record.eraPeriod || '',
    meter: record.meter || null,
    poemZh: normalizeWhitespace(record.bodyZh),
    translationKo: normalizeWhitespace(parsed.translation),
    commentaryKo: normalizeWhitespace(parsed.commentary),
    jipyeongZh: '',
    jipyeongKo: '',
    pinyin: '',
    pingze: '',
    notes,
    media: null,
    readingKo: normalizeWhitespace(parsed.reading),
    sourceMeta: {
      collection: SOURCE_COLLECTION,
      queueId: record.queueId,
      sourceRecordId: record.sourceRecordId,
      sourceUrl: record.sourceUrl || null,
      batch: record.batch,
      eraSlug: record.eraSlug,
      eraPeriod: record.eraPeriod,
      sourceKind: record.sourceKind,
      reviewStatus: record.reviewStatus,
      reviewReasons: record.reviewReasons || [],
      model: result.model,
    },
  };
}

function buildCompactPoem(fullPoem, record) {
  return {
    titleId: record.poetSlug,
    poemNo: fullPoem.poemNo,
    poemNoStr: fullPoem.poemNoStr,
    title: fullPoem.title,
    poet: fullPoem.poet,
    juan: fullPoem.juan,
    category: fullPoem.category,
    meter: fullPoem.meter,
    preview: firstLines(fullPoem.poemZh),
    sourceMeta: {
      collection: SOURCE_COLLECTION,
      queueId: record.queueId,
      eraSlug: record.eraSlug,
      batch: record.batch,
    },
  };
}

function main() {
  const queue = readJson(QUEUE_PATH);
  const recordsByQueueId = new Map((queue.records || []).map((record) => [record.queueId, record]));
  const resultRows = readJsonl(RESULTS_PATH);

  const okByQueueId = new Map();
  for (const row of resultRows) {
    if (row.status === 'ok' && row.queueId && row.parsed?.translation) {
      okByQueueId.set(row.queueId, row);
    }
  }

  const selected = [...okByQueueId.values()]
    .map((result) => ({ result, record: recordsByQueueId.get(result.queueId) }))
    .filter((item) => item.record)
    .sort((a, b) => a.record.queueId.localeCompare(b.record.queueId));

  const poemsFull = readJson(POEMS_FULL_PATH)
    .filter((poem) => poem?.sourceMeta?.collection !== SOURCE_COLLECTION);
  const poemsCompact = readJson(POEMS_COMPACT_PATH)
    .filter((poem) => poem?.sourceMeta?.collection !== SOURCE_COLLECTION);
  const authorsData = readJson(AUTHORS_PATH);
  const authors = authorsData.authors || {};

  for (const [key, author] of Object.entries(authors)) {
    if (author?.sourceMeta?.collection === SOURCE_COLLECTION) delete authors[key];
  }

  let poemNo = POEM_NO_START;
  for (const item of selected) {
    const fullPoem = buildFullPoem({ ...item, poemNo });
    poemsFull.push(fullPoem);
    poemsCompact.push(buildCompactPoem(fullPoem, item.record));
    if (!authors[item.record.poetSlug]) authors[item.record.poetSlug] = buildAuthor(item.record);
    poemNo += 1;
  }

  authorsData.authors = authors;
  authorsData.count = Object.keys(authors).length;
  authorsData.updatedAt = new Date().toISOString();

  writeJson(POEMS_FULL_PATH, poemsFull);
  writeJson(POEMS_COMPACT_PATH, poemsCompact);
  writeJson(AUTHORS_PATH, authorsData);

  console.log(JSON.stringify({
    sourceCollection: SOURCE_COLLECTION,
    importedPoems: selected.length,
    poemsFull: poemsFull.length,
    poemsCompact: poemsCompact.length,
    authors: authorsData.count,
    firstPoemNo: selected.length ? POEM_NO_START : null,
    lastPoemNo: selected.length ? POEM_NO_START + selected.length - 1 : null,
  }, null, 2));
}

main();
