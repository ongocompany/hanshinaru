// jds@jinas:5433 → Supabase 큐레이션 동기화 (Phase 3)
// 사용:
//   node scripts/curation/sync_to_supabase.mjs            (dry-run, 분량만 표시)
//   node scripts/curation/sync_to_supabase.mjs --apply    (실제 upsert)
//
// 전제: scripts/migrations/2026-04-29-d-cycle3b-curated-tables.sql DDL이 Supabase에 적용되어 있어야 함.
// 데이터 흐름: data/curation/eras-{poets,poems}.json 읽기 → jds에서 본문/약력 추출 → Supabase upsert

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const APPLY = process.argv.includes('--apply');
const ROOT = resolve(import.meta.dirname, '../..');
const CUR = resolve(ROOT, 'data/curation');

const SUPABASE_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co/rest/v1';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  const env = readFileSync(`${homedir()}/.env.local`, 'utf8');
  const m = env.match(/hanshinaru supabase service role\s*:\s*(eyJ[^\s]+)/);
  if (m) SERVICE_KEY = m[1];
}
if (!SERVICE_KEY) throw new Error('service_role key 미발견');

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function pgrest(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/${path}`, { headers: HEADERS, ...opts });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 400)}`);
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// ─── 1. 큐레이션 JSON 로드 ─────────────────────────────────────────
const eraPoets = JSON.parse(readFileSync(resolve(CUR, 'eras-poets.json'), 'utf8'));
const eraPoems = JSON.parse(readFileSync(resolve(CUR, 'eras-poems.json'), 'utf8'));
const dailyPool = JSON.parse(readFileSync(resolve(CUR, 'daily-pool.json'), 'utf8'));

// 시인 ID → era_slug 매핑 + sort_order
const poetMap = new Map(); // jds_id → { era_slug, country, sort_order }
for (const [slug, poets] of Object.entries(eraPoets.eras)) {
  if (!poets || poets.length === 0) continue;
  const country = ['ancient-silla','goryeo-early-mid','goryeo-mal-joseon-cho','joseon-jung','joseon-hu','geundae'].includes(slug) ? 'KR' : 'CN';
  poets.forEach((p, idx) => {
    poetMap.set(p.id, { era_slug: slug, country, sort_order: idx + 1 });
  });
}

// 시 ID → era_slug 매핑 + sort_order + in_daily_pool
// FK 보장: 시 풀 참조 시인이 시인 풀에 빠져있으면 자동 보완 (poetMap에 추가)
const poemMap = new Map();
const dailyPoolSet = new Set([...dailyPool.pool.CN, ...dailyPool.pool.KR]);
const KR_SLUGS_SET = new Set(['ancient-silla','goryeo-early-mid','goryeo-mal-joseon-cho','joseon-jung','joseon-hu','geundae']);
for (const [slug, poems] of Object.entries(eraPoems.eras)) {
  if (!poems || poems.length === 0) continue;
  const country = KR_SLUGS_SET.has(slug) ? 'KR' : 'CN';
  poems.forEach((pm, idx) => {
    poemMap.set(pm.id, { era_slug: slug, country, sort_order: idx + 1, in_daily_pool: dailyPoolSet.has(pm.id) });
    // 시인이 시인 풀에 없으면 보완 (sort_order 999로 후순위)
    if (!poetMap.has(pm.poet_id)) {
      poetMap.set(pm.poet_id, { era_slug: slug, country, sort_order: 999 });
    }
  });
}

console.log(`# 동기화 분량`);
console.log(`  시인 큐레이션: ${poetMap.size}명`);
console.log(`  시 큐레이션: ${poemMap.size}수 (일일풀 포함 ${dailyPoolSet.size}수)`);

// ─── 2. jds에서 시인·시 본체 데이터 추출 (ssh jinas + psql) ────────
function jdsQuery(sql) {
  // psql 통해 JSON으로 받기. ssh로 stdin 전달.
  const cmd = `ssh jinas "PGPASSWORD=jds psql -h localhost -p 5433 -U jds -d jds -t -A -c \\"${sql.replace(/"/g, '\\"\\"')}\\""`;
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

const poetIds = [...poetMap.keys()].join(',');
const poemIds = [...poemMap.keys()].join(',');

console.log(`\n## jds에서 시인 약력·시 본문 추출 중...`);

const poetsRaw = jdsQuery(`
SELECT json_agg(json_build_object(
  'jds_id', id, 'name_ko', name_ko, 'name_zh', name_zh,
  'life_birth', life_birth, 'life_death', life_death, 'life_raw', life_raw,
  'slug', slug, 'era_period', era_period, 'poem_count', poem_count, 'bio_ko', bio_ko
))
FROM poets WHERE id IN (${poetIds});
`);
const jdsPoets = JSON.parse(poetsRaw.trim());
console.log(`  ✓ jds에서 시인 ${jdsPoets.length}명 fetch`);

const poemsRaw = jdsQuery(`
SELECT json_agg(json_build_object(
  'jds_id', id, 'poet_jds_id', poet_id,
  'title_ko', title_ko, 'title_zh', title_zh,
  'body_zh', body_zh, 'translation_ko', translation_ko, 'commentary_ko', commentary_ko,
  'is_notable', is_notable, 'quality', quality, 'category', category, 'genre', genre
))
FROM poems WHERE id IN (${poemIds});
`);
const jdsPoems = JSON.parse(poemsRaw.trim());
console.log(`  ✓ jds에서 시 ${jdsPoems.length}수 fetch`);

// ─── 3. Supabase에 upsert payload 구성 ────────────────────────────
const poetsPayload = jdsPoets.map((p) => {
  const meta = poetMap.get(p.jds_id);
  return {
    ...p,
    // 일부 CN 시인은 jds에 한국어 이름 없음 (24명). 한자명 fallback.
    name_ko: p.name_ko ?? p.name_zh,
    country: meta.country,
    era_slug: meta.era_slug,
    sort_order: meta.sort_order,
  };
});

const poemsPayload = jdsPoems.map((pm) => {
  const meta = poemMap.get(pm.jds_id);
  return {
    ...pm,
    country: meta.country,
    era_slug: meta.era_slug,
    sort_order: meta.sort_order,
    in_daily_pool: meta.in_daily_pool,
  };
});

console.log(`\n## upsert payload 크기`);
console.log(`  poets payload: ${(JSON.stringify(poetsPayload).length / 1024).toFixed(1)} KB`);
console.log(`  poems payload: ${(JSON.stringify(poemsPayload).length / 1024).toFixed(1)} KB`);

if (!APPLY) {
  console.log('\n--- DRY-RUN. --apply 추가 시 실제 upsert. ---');
  console.log('샘플 시인 (첫 1명):', JSON.stringify(poetsPayload[0], null, 2).slice(0, 500));
  console.log('샘플 시 (첫 1수):', JSON.stringify(poemsPayload[0], null, 2).slice(0, 500));
  process.exit(0);
}

// ─── 4. 실제 upsert (배치) ────────────────────────────────────────
async function upsertBatch(table, rows, batchSize = 50) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await pgrest(table, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(chunk),
    });
    process.stdout.write(`    ${i + chunk.length}/${rows.length}\r`);
  }
  console.log('');
}

console.log('\n=== STEP 1: 시인 upsert ===');
await upsertBatch('hansi_curated_poets', poetsPayload);
console.log(`  ✓ ${poetsPayload.length}명 upsert 완료`);

console.log('\n=== STEP 2: 시 upsert ===');
await upsertBatch('hansi_curated_poems', poemsPayload);
console.log(`  ✓ ${poemsPayload.length}수 upsert 완료`);

// ─── 5. 검증 ─────────────────────────────────────────────────────
console.log('\n=== 검증 ===');
const poetCount = await pgrest('hansi_curated_poets?select=count', {
  headers: { ...HEADERS, Prefer: 'count=exact' },
});
const poemCount = await pgrest('hansi_curated_poems?select=count', {
  headers: { ...HEADERS, Prefer: 'count=exact' },
});
console.log(`  Supabase hansi_curated_poets: ${poetCount[0]?.count ?? '?'} 행`);
console.log(`  Supabase hansi_curated_poems: ${poemCount[0]?.count ?? '?'} 행`);

console.log('\n✅ Phase 3 동기화 완료');
