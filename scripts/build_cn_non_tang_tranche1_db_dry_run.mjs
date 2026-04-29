#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildCuratedDryRun } from './lib/cn_curated_payload_builder.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.records.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-non-tang-tranche1.db-dry-run.v1.json');

const input = JSON.parse(readFileSync(INPUT, 'utf8'));
const dryRun = buildCuratedDryRun(input.records);

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(dryRun, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(dryRun.summary, null, 2));
console.log('주의: 이 파일은 실제 upsert용이 아니라 jds_id 배정 전 검토용입니다.');
