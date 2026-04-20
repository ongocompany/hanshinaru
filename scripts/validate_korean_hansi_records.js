#!/usr/bin/env node
/**
 * validate_korean_hansi_records.js
 *
 * 목적:
 * - 한국 한시 레코드 JSON 배열이 최소 구조 요건을 만족하는지 점검한다.
 * - sourcePolicyId가 정책 파일에 존재하는지 확인한다.
 * - commercialTransition과 rights 기본 일관성을 확인한다.
 *
 * 사용법:
 *   node scripts/validate_korean_hansi_records.js --input path/to/records.json
 *   node scripts/validate_korean_hansi_records.js --input docs/spec/korean-hansi-mini-pilot.records.v1.json
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_POLICY_PATH = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-source-policies.v1.json');

function parseArgs(argv) {
  const args = { input: '', policy: DEFAULT_POLICY_PATH };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--input') args.input = argv[++i] || '';
    else if (token === '--policy') args.policy = argv[++i] || DEFAULT_POLICY_PATH;
  }

  if (!args.input) {
    throw new Error('--input 경로가 필요합니다.');
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function hasString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushError(errors, poemId, message) {
  errors.push(`${poemId}: ${message}`);
}

function validateRecord(record, policyIds, errors) {
  const poemId = record.poemId || '(unknown)';
  const requiredTop = [
    'poemId',
    'canonicalId',
    'title',
    'author',
    'era',
    'genre',
    'sourceWork',
    'text',
    'legacyAssets',
    'ownedAssets',
    'rights',
    'commercialTransition'
  ];

  for (const key of requiredTop) {
    if (!(key in record)) pushError(errors, poemId, `missing top-level key: ${key}`);
  }

  if (!isObject(record.title) || !hasString(record.title.zh) || !hasString(record.title.ko)) {
    pushError(errors, poemId, 'invalid title block');
  }
  if (!isObject(record.author) || !hasString(record.author.authorId) || !hasString(record.author.zh) || !hasString(record.author.ko)) {
    pushError(errors, poemId, 'invalid author block');
  }
  if (!isObject(record.text) || !hasString(record.text.poemZh)) {
    pushError(errors, poemId, 'invalid text.poemZh');
  }
  if (!isObject(record.sourceWork) || !hasString(record.sourceWork.entryTitle) || !hasString(record.sourceWork.sourceUrl) || !hasString(record.sourceWork.sourcePolicyId)) {
    pushError(errors, poemId, 'invalid sourceWork block');
  } else if (!policyIds.has(record.sourceWork.sourcePolicyId)) {
    pushError(errors, poemId, `unknown source policy id: ${record.sourceWork.sourcePolicyId}`);
  }

  const rightsRequired = ['originalText', 'legacyTranslation', 'legacyNotes', 'ownedTranslation', 'ownedNotes', 'images'];
  if (!isObject(record.rights)) {
    pushError(errors, poemId, 'rights block missing or invalid');
  } else {
    for (const key of rightsRequired) {
      if (!isObject(record.rights[key])) {
        pushError(errors, poemId, `rights.${key} missing or invalid`);
        continue;
      }
      const info = record.rights[key];
      if (typeof info.exists !== 'boolean') {
        pushError(errors, poemId, `rights.${key}.exists must be boolean`);
      }
      if (info.sourcePolicyId && !policyIds.has(info.sourcePolicyId)) {
        pushError(errors, poemId, `rights.${key}.sourcePolicyId unknown: ${info.sourcePolicyId}`);
      }
    }
  }

  if (!isObject(record.commercialTransition)) {
    pushError(errors, poemId, 'commercialTransition missing or invalid');
  } else {
    const ct = record.commercialTransition;
    if (typeof ct.isCommercialReady !== 'boolean') {
      pushError(errors, poemId, 'commercialTransition.isCommercialReady must be boolean');
    }
    if (!Array.isArray(ct.blockingAssets)) {
      pushError(errors, poemId, 'commercialTransition.blockingAssets must be array');
    }
    if (!Array.isArray(ct.replacementRequired)) {
      pushError(errors, poemId, 'commercialTransition.replacementRequired must be array');
    }
    if (ct.isCommercialReady === true && Array.isArray(ct.blockingAssets) && ct.blockingAssets.length > 0) {
      pushError(errors, poemId, 'commercialTransition says ready but blockingAssets not empty');
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const records = readJson(path.resolve(args.input));
  const policyDoc = readJson(path.resolve(args.policy));
  const policyIds = new Set((policyDoc.policies || []).map((p) => p.policyId));

  if (!Array.isArray(records)) {
    throw new Error('입력 JSON은 배열이어야 합니다.');
  }

  const errors = [];
  for (const record of records) {
    validateRecord(record, policyIds, errors);
  }

  if (errors.length > 0) {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Validated ${records.length} record(s) successfully.`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
