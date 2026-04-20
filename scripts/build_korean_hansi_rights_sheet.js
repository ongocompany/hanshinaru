#!/usr/bin/env node
/**
 * build_korean_hansi_rights_sheet.js
 *
 * 목적:
 * - 한국 한시 레코드에서 수집 대상 URL 목록을 추출한다.
 * - 자산별 권리 마킹표를 TSV로 생성한다.
 *
 * 사용법:
 *   node scripts/build_korean_hansi_rights_sheet.js --input docs/spec/korean-hansi-mini-pilot.records.v1.json --out-prefix docs/spec/korean-hansi-mini-pilot
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { input: '', outPrefix: '' };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--input') args.input = argv[++i] || '';
    else if (token === '--out-prefix') args.outPrefix = argv[++i] || '';
  }

  if (!args.input || !args.outPrefix) {
    throw new Error('--input 과 --out-prefix 가 필요합니다.');
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function tsvEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
}

function buildUrlRows(records) {
  const rows = [];

  for (const record of records) {
    rows.push([
      record.poemId,
      record.author?.ko || '',
      record.title?.ko || '',
      'sourceWork',
      record.sourceWork?.sourcePolicyId || '',
      record.sourceWork?.sourceUrl || '',
      record.sourceWork?.collectionTitle || '',
      record.sourceWork?.entryTitle || ''
    ]);

    const assetMap = record.rights || {};
    for (const assetName of Object.keys(assetMap)) {
      const info = assetMap[assetName];
      if (!info || !info.exists || !info.sourceUrl) continue;
      rows.push([
        record.poemId,
        record.author?.ko || '',
        record.title?.ko || '',
        assetName,
        info.sourcePolicyId || '',
        info.sourceUrl || '',
        '',
        ''
      ]);
    }
  }

  return rows;
}

function buildRightsRows(records) {
  const rows = [];
  const orderedAssets = ['originalText', 'legacyTranslation', 'legacyNotes', 'ownedTranslation', 'ownedNotes', 'images'];

  for (const record of records) {
    for (const assetName of orderedAssets) {
      const info = record.rights?.[assetName];
      if (!info) continue;

      rows.push([
        record.poemId,
        record.author?.ko || '',
        record.title?.ko || '',
        assetName,
        info.exists,
        info.sourcePolicyId || '',
        info.sourceUrl || '',
        info.copyrightStatus || '',
        info.usageClass || '',
        info.publicDisplayAllowedNow,
        info.commercialAllowedNow,
        info.requiresPermissionForCommercial,
        info.mustReplaceBeforeCommercial,
        info.replacementPriority || '',
        info.attributionRequired,
        record.commercialTransition?.isCommercialReady,
        (record.commercialTransition?.blockingAssets || []).join(','),
        (record.commercialTransition?.replacementRequired || []).map((x) => `${x.asset}:${x.reason}`).join(',')
      ]);
    }
  }

  return rows;
}

function toTsv(header, rows) {
  const lines = [header.join('\t')];
  for (const row of rows) {
    lines.push(row.map(tsvEscape).join('\t'));
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const outPrefix = path.resolve(args.outPrefix);
  const records = readJson(inputPath);

  if (!Array.isArray(records)) {
    throw new Error('입력 JSON은 배열이어야 합니다.');
  }

  const urlHeader = [
    'poemId',
    'authorKo',
    'titleKo',
    'assetSlot',
    'sourcePolicyId',
    'url',
    'collectionTitle',
    'entryTitle'
  ];

  const rightsHeader = [
    'poemId',
    'authorKo',
    'titleKo',
    'asset',
    'exists',
    'sourcePolicyId',
    'sourceUrl',
    'copyrightStatus',
    'usageClass',
    'publicDisplayAllowedNow',
    'commercialAllowedNow',
    'requiresPermissionForCommercial',
    'mustReplaceBeforeCommercial',
    'replacementPriority',
    'attributionRequired',
    'recordCommercialReady',
    'blockingAssets',
    'replacementRequired'
  ];

  const urlRows = buildUrlRows(records);
  const rightsRows = buildRightsRows(records);

  const urlPath = `${outPrefix}.source-urls.tsv`;
  const rightsPath = `${outPrefix}.rights-sheet.tsv`;

  writeText(urlPath, toTsv(urlHeader, urlRows));
  writeText(rightsPath, toTsv(rightsHeader, rightsRows));

  console.log(`Source URL rows: ${urlRows.length}`);
  console.log(`Rights rows: ${rightsRows.length}`);
  console.log(`Wrote: ${urlPath}`);
  console.log(`Wrote: ${rightsPath}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
