#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildPreTangDryRun } from './lib/cn_pre_tang_db_payload_builder.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INPUT = resolve(ROOT, 'docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json');
const OUT = resolve(ROOT, 'docs/spec/cn-pre-tang-first-tranche.db-dry-run.v1.json');

const input = JSON.parse(readFileSync(INPUT, 'utf8'));
const dryRun = buildPreTangDryRun(input.records ?? []);

mkdirSync(resolve(ROOT, 'docs/spec'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(dryRun, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify(dryRun.summary, null, 2));
console.log('주의: 이 파일은 실제 upsert용이 아니라 jds_id 배정 전 검토용입니다.');
