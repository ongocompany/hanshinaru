#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CN_NON_TANG_COLLECTION_TARGETS } from './data/cn_non_tang_collection_targets.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-collection-targets.v1.json');

const wave1Poets = CN_NON_TANG_COLLECTION_TARGETS.wave1Targets.reduce(
  (sum, era) => sum + era.authors.length,
  0,
);
const wave1PoemsMin = CN_NON_TANG_COLLECTION_TARGETS.wave1Targets.reduce(
  (sum, era) => sum + era.targetPoemsMin,
  0,
);

const doc = {
  ...CN_NON_TANG_COLLECTION_TARGETS,
  generatedAt: new Date().toISOString(),
  computedSummary: {
    wave1Poets,
    wave1PoemsMin,
    categoryObservedPages: CN_NON_TANG_COLLECTION_TARGETS.categorySources.reduce(
      (sum, source) => sum + source.observedPages,
      0,
    ),
  },
};

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(doc.computedSummary, null, 2));
