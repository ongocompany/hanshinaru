#!/usr/bin/env node
/**
 * Validate GPT worker outputs for the Korean poet chronology collection pass.
 *
 * Usage:
 *   node scripts/validate_korean_poet_worker_results.js
 *   node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-1-yi-gyubo.v1.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIR = path.join(ROOT, 'docs', 'spec', 'korean-poet-worker-results');
const SOURCE_POLICIES = path.join(ROOT, 'docs', 'spec', 'korean-hansi-source-policies.v1.json');

const VALID_STATUS = new Set(['completed', 'partial', 'blocked']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);
const VALID_READINESS = new Set(['direct-text-collected', 'source-located', 'ocr-candidate', 'blocked']);
const VALID_ORIGINAL_USAGE = new Set(['commercial_allowed', 'noncommercial_only', 'permission_required', 'unknown']);
const VALID_TRANSLATION_USAGE = new Set(['owned_translation_needed']);

function parseArgs() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  if (inputIndex !== -1) {
    const input = args[inputIndex + 1];
    if (!input) throw new Error('--input requires a file path');
    return { inputs: [path.resolve(ROOT, input)] };
  }

  if (!fs.existsSync(DEFAULT_DIR)) return { inputs: [] };
  return {
    inputs: fs
      .readdirSync(DEFAULT_DIR)
      .filter((name) => name.endsWith('.json'))
      .map((name) => path.join(DEFAULT_DIR, name))
      .sort()
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function add(errors, message) {
  errors.push(message);
}

function requireString(errors, value, label) {
  if (typeof value !== 'string' || value.trim() === '') add(errors, `${label} must be a non-empty string`);
}

function validateSummary(errors, data) {
  const summary = data.summary || {};
  for (const key of ['candidateWorksChecked', 'directTextWorksFound', 'ocrCandidates', 'blockedWorks']) {
    if (!Number.isInteger(summary[key]) || summary[key] < 0) {
      add(errors, `summary.${key} must be a non-negative integer`);
    }
  }
}

function validatePoem(errors, poem, index, policyIds) {
  const prefix = `poems[${index}]`;
  requireString(errors, poem.authorKo, `${prefix}.authorKo`);
  requireString(errors, poem.candidateTitle, `${prefix}.candidateTitle`);

  const sourceWork = poem.sourceWork || {};
  requireString(errors, sourceWork.collectionTitle, `${prefix}.sourceWork.collectionTitle`);
  if (!VALID_CONFIDENCE.has(sourceWork.locatorConfidence)) {
    add(errors, `${prefix}.sourceWork.locatorConfidence must be high, medium, or low`);
  }
  if (sourceWork.sourcePolicyId !== null && sourceWork.sourcePolicyId !== undefined && !policyIds.has(sourceWork.sourcePolicyId)) {
    add(errors, `${prefix}.sourceWork.sourcePolicyId is not in korean-hansi-source-policies.v1.json`);
  }

  const text = poem.text || {};
  const ingest = poem.ingest || {};
  if (!VALID_READINESS.has(ingest.recommendedReadiness)) {
    add(errors, `${prefix}.ingest.recommendedReadiness must be one of ${[...VALID_READINESS].join(', ')}`);
  }
  if (ingest.recommendedReadiness === 'direct-text-collected') {
    requireString(errors, text.poemZh, `${prefix}.text.poemZh`);
  }
  if (ingest.recommendedReadiness !== 'direct-text-collected' && text.poemZh !== null && text.poemZh !== undefined) {
    add(errors, `${prefix}.text.poemZh must stay null unless direct text was collected`);
  }

  const rights = poem.rights || {};
  if (!VALID_ORIGINAL_USAGE.has(rights.originalTextUsage)) {
    add(errors, `${prefix}.rights.originalTextUsage must be a known usage value`);
  }
  if (!VALID_TRANSLATION_USAGE.has(rights.translationUsage)) {
    add(errors, `${prefix}.rights.translationUsage must be owned_translation_needed`);
  }
}

function validateFile(filePath, policyIds) {
  const data = readJson(filePath);
  const errors = [];

  requireString(errors, data.workerId, 'workerId');
  if (!VALID_STATUS.has(data.status)) add(errors, 'status must be completed, partial, or blocked');
  if (!Array.isArray(data.targetAuthors) || data.targetAuthors.length === 0) {
    add(errors, 'targetAuthors must be a non-empty array');
  }
  validateSummary(errors, data);

  if (!Array.isArray(data.poems)) {
    add(errors, 'poems must be an array');
  } else {
    data.poems.forEach((poem, index) => validatePoem(errors, poem, index, policyIds));
  }

  if (!Array.isArray(data.blockers)) add(errors, 'blockers must be an array');
  if (!Array.isArray(data.sourcesConsulted)) add(errors, 'sourcesConsulted must be an array');

  return {
    filePath,
    workerId: data.workerId || path.basename(filePath),
    status: data.status || 'invalid',
    poemCount: Array.isArray(data.poems) ? data.poems.length : 0,
    directTextWorksFound: data.summary?.directTextWorksFound || 0,
    sourceLocated: Array.isArray(data.poems)
      ? data.poems.filter((poem) => poem.ingest?.recommendedReadiness === 'source-located').length
      : 0,
    ocrCandidates: data.summary?.ocrCandidates || 0,
    blockedWorks: data.summary?.blockedWorks || 0,
    errors
  };
}

function main() {
  const { inputs } = parseArgs();
  const policies = readJson(SOURCE_POLICIES);
  const policyIds = new Set((policies.policies || []).map((policy) => policy.policyId));

  if (inputs.length === 0) {
    console.log(`No worker result JSON files found under ${path.relative(ROOT, DEFAULT_DIR)}`);
    return;
  }

  const results = inputs.map((input) => validateFile(input, policyIds));
  let errorCount = 0;

  for (const result of results) {
    const rel = path.relative(ROOT, result.filePath);
    console.log(`${rel}: ${result.status}, poems=${result.poemCount}, direct=${result.directTextWorksFound}, located=${result.sourceLocated}, ocr=${result.ocrCandidates}, blocked=${result.blockedWorks}`);
    for (const error of result.errors) {
      errorCount += 1;
      console.error(`  - ${error}`);
    }
  }

  if (errorCount > 0) {
    console.error(`Validation failed: ${errorCount} error(s)`);
    process.exit(1);
  }
  console.log(`Validation passed: ${results.length} worker file(s)`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
