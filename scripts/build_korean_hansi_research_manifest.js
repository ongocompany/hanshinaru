#!/usr/bin/env node
/**
 * build_korean_hansi_research_manifest.js
 *
 * 목적:
 * - priority-11 실행 보드에서 seed-ready 저자들의 후보 작품을 모아
 *   조사용 manifest(JSON/TSV)를 생성한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_research_manifest.js
 */

const fs = require('fs');
const path = require('path');

const BOARD_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-priority-11-board.v1.json');
const OUT_JSON = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-research-manifest.v1.json');
const OUT_TSV = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-research-manifest.v1.tsv');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function isSeedReady(entry) {
  const c = entry.progressChecklist || {};
  return c.authorProfileVerified && c.primaryCollectionVerified && c.encyChecked && c.firstFivePoemsListed;
}

function buildRows(entries) {
  const rows = [];

  for (const entry of entries) {
    for (const candidate of entry.poemCandidateWork?.firstFivePoemCandidates || []) {
      rows.push({
        authorKo: entry.authorKo,
        authorHanja: entry.authorHanja,
        timelineEra: entry.timelineEra,
        collectionTitle: entry.collectionWork?.primaryCollectionTitle || '',
        representativeWorkKo: entry.poemCandidateWork?.representativeWorkKo || '',
        titleKo: candidate.titleKo || '',
        titleHanja: candidate.titleHanja || '',
        evidence: candidate.evidence || '',
        evidenceUrl: candidate.sourceUrl || '',
        korcisSearchUrl: entry.collectionWork?.korcisSearchUrl || '',
        encyKeywordUrl: entry.collectionWork?.encyKeywordUrl || '',
        nextAction: entry.nextAction || '',
        manifestStage: 'research-manifest',
        manifestStatus: 'queued'
      });
    }
  }

  return rows;
}

function toTsv(rows) {
  const header = [
    'authorKo',
    'authorHanja',
    'timelineEra',
    'collectionTitle',
    'representativeWorkKo',
    'titleKo',
    'titleHanja',
    'evidence',
    'evidenceUrl',
    'korcisSearchUrl',
    'encyKeywordUrl',
    'nextAction',
    'manifestStage',
    'manifestStatus'
  ];

  const lines = [header.join('\t')];
  for (const row of rows) {
    const values = header.map((key) => String(row[key] ?? '').replace(/\t/g, ' ').replace(/\n/g, ' '));
    lines.push(values.join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const board = readJson(BOARD_JSON);
  const seedReadyEntries = (board.entries || []).filter(isSeedReady);
  const rows = buildRows(seedReadyEntries);

  const out = {
    version: '2026-04-20.v1',
    manifestId: 'korean-hansi-research-manifest',
    basedOnBoard: 'korean-hansi-priority-11-board.v1.json',
    seedReadyAuthors: seedReadyEntries.map((entry) => entry.authorKo),
    rowCount: rows.length,
    rows
  };

  writeJson(OUT_JSON, out);
  writeText(OUT_TSV, toTsv(rows));

  console.log(`Seed-ready authors: ${seedReadyEntries.length}`);
  console.log(`Manifest rows: ${rows.length}`);
  console.log(`Output JSON: ${OUT_JSON}`);
  console.log(`Output TSV: ${OUT_TSV}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
