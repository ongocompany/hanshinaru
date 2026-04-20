#!/usr/bin/env node
/**
 * apply_korean_hansi_source_policy.js
 *
 * 목적:
 * - 한국 한시 레코드에 source policy 기본값을 적용한다.
 * - 누락된 rights 블록을 자동 채운다.
 * - commercialTransition 상태를 재계산한다.
 *
 * 사용법:
 *   node scripts/apply_korean_hansi_source_policy.js --input path/to/input.json --output path/to/output.json
 *   node scripts/apply_korean_hansi_source_policy.js --input docs/spec/korean-hansi.sample-input.v1.json --output docs/spec/korean-hansi.sample-records.v1.json
 *   node scripts/apply_korean_hansi_source_policy.js --input file.json --in-place
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_POLICY_PATH = path.join(__dirname, '..', 'docs', 'spec', 'korean-hansi-source-policies.v1.json');

function parseArgs(argv) {
  const args = {
    input: '',
    output: '',
    policy: DEFAULT_POLICY_PATH,
    inPlace: false
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--input') args.input = argv[++i] || '';
    else if (token === '--output') args.output = argv[++i] || '';
    else if (token === '--policy') args.policy = argv[++i] || DEFAULT_POLICY_PATH;
    else if (token === '--in-place') args.inPlace = true;
  }

  if (!args.input) {
    throw new Error('--input 경로가 필요합니다.');
  }
  if (!args.inPlace && !args.output) {
    throw new Error('--output 경로가 없으면 --in-place를 사용해야 합니다.');
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function hasArrayItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function makePolicyIndex(policyDoc) {
  const byId = new Map();
  const bySiteAndClass = new Map();

  for (const policy of policyDoc.policies || []) {
    byId.set(policy.policyId, policy);
    const key = `${policy.siteName}::${policy.assetClass}`;
    bySiteAndClass.set(key, policy);
  }

  return { byId, bySiteAndClass };
}

function findPolicyById(policyIndex, policyId) {
  return policyId ? policyIndex.byId.get(policyId) || null : null;
}

function findSiblingPolicy(policyIndex, basePolicy, assetClass) {
  if (!basePolicy) return null;
  return policyIndex.bySiteAndClass.get(`${basePolicy.siteName}::${assetClass}`) || null;
}

function inferUsageClass(projectPolicy, requiresPermission) {
  if (!projectPolicy) return 'unknown';

  if (projectPolicy.publicCommercialDisplay === 'allow') {
    return 'commercial_allowed';
  }
  if (projectPolicy.publicNonCommercialDisplay === 'allow' && requiresPermission) {
    return 'commercial_with_permission';
  }
  if (projectPolicy.publicNonCommercialDisplay === 'allow') {
    return 'noncommercial_only';
  }
  if (projectPolicy.internalIngest === 'allow') {
    return 'internal_only';
  }

  return 'unknown';
}

function inferCopyrightStatus(policy, assetName) {
  if (!policy) return 'unknown';

  if (assetName === 'ownedTranslation' || assetName === 'ownedNotes') {
    return 'owned';
  }
  if (policy.assetClass === 'original_text') {
    return 'public_domain';
  }
  if (policy.assetClass === 'translation_text' || policy.assetClass === 'article_text') {
    return 'copyrighted';
  }
  if (policy.assetClass === 'text') {
    return 'licensed';
  }
  if (policy.assetClass === 'image' || policy.assetClass === 'media') {
    return 'licensed';
  }

  return 'unknown';
}

function inferReplacementPriority(assetName, exists, commercialAllowedNow, mustReplaceBeforeCommercial) {
  if (!exists) return 'low';
  if (mustReplaceBeforeCommercial) return 'critical';
  if (!commercialAllowedNow && (assetName === 'legacyTranslation' || assetName === 'legacyNotes')) return 'high';
  if (!commercialAllowedNow) return 'medium';
  return 'low';
}

function buildAssetRightsDefaults({ assetName, exists, policy, sourceUrl, existing }) {
  if (!exists) {
    return {
      exists: false,
      sourcePolicyId: existing?.sourcePolicyId || policy?.policyId || null,
      sourceUrl: existing?.sourceUrl || sourceUrl || null,
      copyrightStatus: existing?.copyrightStatus || 'unknown',
      usageClass: existing?.usageClass || 'not_applicable',
      publicDisplayAllowedNow: existing?.publicDisplayAllowedNow ?? false,
      commercialAllowedNow: existing?.commercialAllowedNow ?? false,
      requiresPermissionForCommercial: existing?.requiresPermissionForCommercial ?? false,
      mustReplaceBeforeCommercial: existing?.mustReplaceBeforeCommercial ?? false,
      replacementPriority: existing?.replacementPriority || 'low',
      attributionRequired: existing?.attributionRequired ?? false,
      checkedAt: existing?.checkedAt || null,
      checkedBy: existing?.checkedBy || null,
      evidence: existing?.evidence || null,
      notes: existing?.notes || null
    };
  }

  const policyRequiresPermission = Boolean(
    policy?.projectPolicy?.publicCommercialDisplay === 'review' ||
    policy?.observedRights?.permissionProcessMentioned === 'yes'
  );
  const requiresPermission = existing?.requiresPermissionForCommercial ?? policyRequiresPermission;

  const publicDisplayAllowedNow = existing?.publicDisplayAllowedNow
    ?? policy?.projectPolicy?.publicNonCommercialDisplay === 'allow'
    ?? false;

  const commercialAllowedNow = existing?.commercialAllowedNow
    ?? policy?.projectPolicy?.publicCommercialDisplay === 'allow'
    ?? false;

  const mustReplaceBeforeCommercial = existing?.mustReplaceBeforeCommercial
    ?? policy?.projectPolicy?.mustReplaceBeforeCommercialDefault
    ?? false;

  return {
    exists: true,
    sourcePolicyId: existing?.sourcePolicyId || policy?.policyId || null,
    sourceUrl: existing?.sourceUrl || sourceUrl || null,
    copyrightStatus: existing?.copyrightStatus || inferCopyrightStatus(policy, assetName),
    usageClass: existing?.usageClass || inferUsageClass(policy?.projectPolicy, requiresPermission),
    publicDisplayAllowedNow,
    commercialAllowedNow,
    requiresPermissionForCommercial: requiresPermission,
    mustReplaceBeforeCommercial,
    replacementPriority: existing?.replacementPriority || inferReplacementPriority(assetName, true, commercialAllowedNow, mustReplaceBeforeCommercial),
    attributionRequired: existing?.attributionRequired ?? (policy?.observedRights?.attributionMentioned === 'yes'),
    checkedAt: existing?.checkedAt || null,
    checkedBy: existing?.checkedBy || null,
    evidence: existing?.evidence || null,
    notes: existing?.notes || null
  };
}

function buildOwnedAssetRights(exists, assetName, existing) {
  return buildAssetRightsDefaults({
    assetName,
    exists,
    policy: {
      policyId: null,
      assetClass: 'owned',
      projectPolicy: {
        publicNonCommercialDisplay: 'allow',
        publicCommercialDisplay: 'allow',
        mustReplaceBeforeCommercialDefault: false
      },
      observedRights: {
        attributionMentioned: 'no',
        permissionProcessMentioned: 'no'
      }
    },
    sourceUrl: null,
    existing
  });
}

function applyPoliciesToRecord(record, policyIndex) {
  const sourcePolicy = findPolicyById(policyIndex, record.sourceWork?.sourcePolicyId || null);
  const translationSibling = findSiblingPolicy(policyIndex, sourcePolicy, 'translation_text');
  const imageSibling = findSiblingPolicy(policyIndex, sourcePolicy, 'image');

  record.rights = record.rights || {};

  record.rights.originalText = buildAssetRightsDefaults({
    assetName: 'originalText',
    exists: isNonEmptyString(record.text?.poemZh),
    policy: sourcePolicy,
    sourceUrl: record.sourceWork?.sourceUrl || null,
    existing: record.rights.originalText
  });

  const existingLegacyTranslationPolicy = findPolicyById(policyIndex, record.rights.legacyTranslation?.sourcePolicyId || null);
  record.rights.legacyTranslation = buildAssetRightsDefaults({
    assetName: 'legacyTranslation',
    exists: isNonEmptyString(record.legacyAssets?.translationKo),
    policy: existingLegacyTranslationPolicy || translationSibling,
    sourceUrl: record.rights.legacyTranslation?.sourceUrl || null,
    existing: record.rights.legacyTranslation
  });

  const existingLegacyNotesPolicy = findPolicyById(policyIndex, record.rights.legacyNotes?.sourcePolicyId || null);
  record.rights.legacyNotes = buildAssetRightsDefaults({
    assetName: 'legacyNotes',
    exists: hasArrayItems(record.legacyAssets?.notes) || isNonEmptyString(record.legacyAssets?.commentaryKo),
    policy: existingLegacyNotesPolicy || translationSibling,
    sourceUrl: record.rights.legacyNotes?.sourceUrl || null,
    existing: record.rights.legacyNotes
  });

  record.rights.ownedTranslation = buildOwnedAssetRights(
    isNonEmptyString(record.ownedAssets?.translationKoOwned),
    'ownedTranslation',
    record.rights.ownedTranslation
  );

  record.rights.ownedNotes = buildOwnedAssetRights(
    hasArrayItems(record.ownedAssets?.notesOwned) || isNonEmptyString(record.ownedAssets?.commentaryKoOwned),
    'ownedNotes',
    record.rights.ownedNotes
  );

  record.rights.images = buildAssetRightsDefaults({
    assetName: 'images',
    exists: false,
    policy: imageSibling,
    sourceUrl: null,
    existing: record.rights.images
  });

  record.commercialTransition = buildCommercialTransition(record.rights);
  return record;
}

function buildCommercialTransition(rights) {
  const orderedAssets = ['originalText', 'legacyTranslation', 'legacyNotes', 'ownedTranslation', 'ownedNotes', 'images'];
  const blockingAssets = [];
  const replacementRequired = [];

  for (const asset of orderedAssets) {
    const info = rights[asset];
    if (!info || !info.exists) continue;

    const isBlocked =
      info.commercialAllowedNow === false ||
      info.requiresPermissionForCommercial === true ||
      info.mustReplaceBeforeCommercial === true ||
      info.copyrightStatus === 'unknown';

    if (!isBlocked) continue;

    blockingAssets.push(asset);

    let reason = 'commercial_not_allowed';
    if (info.mustReplaceBeforeCommercial) reason = 'must_replace_before_commercial';
    else if (info.requiresPermissionForCommercial) reason = 'commercial_permission_required';
    else if (info.copyrightStatus === 'unknown') reason = 'copyright_status_unknown';

    replacementRequired.push({ asset, reason });
  }

  return {
    isCommercialReady: blockingAssets.length === 0,
    blockingAssets,
    replacementRequired
  };
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const outputPath = args.inPlace ? inputPath : path.resolve(args.output);
  const policyPath = path.resolve(args.policy);

  const policyDoc = readJson(policyPath);
  const policyIndex = makePolicyIndex(policyDoc);
  const records = readJson(inputPath);

  if (!Array.isArray(records)) {
    throw new Error('입력 JSON은 배열이어야 합니다.');
  }

  let commercialReadyCount = 0;
  let blockingCount = 0;

  const nextRecords = records.map((record) => {
    const next = applyPoliciesToRecord(record, policyIndex);
    if (next.commercialTransition.isCommercialReady) commercialReadyCount++;
    else blockingCount++;
    return next;
  });

  writeJson(outputPath, nextRecords);

  console.log(`Applied policies to ${nextRecords.length} records.`);
  console.log(`Commercial ready: ${commercialReadyCount}`);
  console.log(`Blocked for commercial: ${blockingCount}`);
  console.log(`Output: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
