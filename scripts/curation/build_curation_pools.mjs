// 큐레이션 풀 생성 (Phase 1)
// 입력: data/curation/{kr_poets_raw,cn_poets_raw,poems_raw}.json
// 출력: data/curation/{eras-poets,eras-poems,daily-pool}.json
//
// 시대별 편차 적용 — 데이터 가용량에 비례한 큐레이션 분량.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const CUR = resolve(ROOT, 'data/curation');

const krPoetsRaw = JSON.parse(readFileSync(resolve(CUR, 'kr_poets_raw.json'), 'utf8'));
const cnPoetsRaw = JSON.parse(readFileSync(resolve(CUR, 'cn_poets_raw.json'), 'utf8'));
const poemsRaw = JSON.parse(readFileSync(resolve(CUR, 'poems_raw.json'), 'utf8'));

// 시대별 큐레이션 목표 분량 (시인 수, 시 수, 일일풀 분담, 시인당 시 cap)
//   per_poet_cap: 시 다양성 보정. 시인 수가 적은 시대는 cap을 풀어 분량 확보.
const TARGETS = {
  // KR 6 시대 (총 시인 132 → 큐레이션 98, 시 100수 일일풀)
  'ancient-silla':         { poets: 13, poems: 30, daily: 12, per_poet_cap: 12 }, // 최치원 비중 큼
  'goryeo-early-mid':      { poets: 13, poems: 30, daily: 8,  per_poet_cap: 6  },
  'goryeo-mal-joseon-cho': { poets: 25, poems: 50, daily: 28, per_poet_cap: 5  },
  'joseon-jung':           { poets: 20, poems: 40, daily: 22, per_poet_cap: 5  },
  'joseon-hu':             { poets: 20, poems: 40, daily: 23, per_poet_cap: 5  },
  'geundae':               { poets: 7,  poems: 7,  daily: 7,  per_poet_cap: 7  }, // 황현 단독
  // CN 당 4분화 (총 시인 108, 일일풀 200)
  'chu-tang':              { poets: 11, poems: 35, daily: 25, per_poet_cap: 5 },
  'sheng-tang':            { poets: 20, poems: 60, daily: 60, per_poet_cap: 5 },
  'zhong-tang':            { poets: 22, poems: 70, daily: 65, per_poet_cap: 5 },
  'wan-tang':              { poets: 22, poems: 60, daily: 50, per_poet_cap: 5 },
};

// CN 6 시대 (한·위진·송·원·명·청)는 데이터 0 → stub
const EMPTY_CN_ERAS = ['qian-han', 'wei-jin', 'song', 'yuan', 'ming', 'qing'];

// ─── 시인 큐레이션: poem_count 상위 N명 ─────────────────────────────
function curatePoetsByEra(poetsArr) {
  const byEra = {};
  for (const p of poetsArr) {
    if (!p.era_slug) continue;
    (byEra[p.era_slug] ||= []).push(p);
  }
  const out = {};
  for (const [slug, poets] of Object.entries(byEra)) {
    const target = TARGETS[slug]?.poets ?? poets.length;
    poets.sort((a, b) => (b.poem_count ?? 0) - (a.poem_count ?? 0));
    out[slug] = poets.slice(0, target).map((p) => ({
      id: p.id,
      name_ko: p.name_ko,
      name_zh: p.name_zh,
      life: p.life_raw ?? (p.life_birth || p.life_death
        ? `${p.life_birth ?? '?'}~${p.life_death ?? '?'}`
        : null),
      slug: p.slug,
      poem_count: p.poem_count,
    }));
  }
  return out;
}

const eraPoets = {
  ...curatePoetsByEra(krPoetsRaw),
  ...curatePoetsByEra(cnPoetsRaw),
};

// 빈 CN 시대 stub
for (const slug of EMPTY_CN_ERAS) {
  eraPoets[slug] = []; // 별 세션에서 채울 예정
}

// ─── 시 큐레이션: 우선순위 (notable > quality > poet poem_count) ──────
//   poems_raw.json은 이미 SQL ORDER BY로 [country, era_slug, notable, quality, poet_id, id] 정렬됨.
//   각 era_slug별로 상위 N수 + 시인 다양성 보정 (한 시인 최대 5수).
function curatePoemsByEra(poemsArr) {
  const byEra = {};
  for (const pm of poemsArr) {
    if (!pm.era_slug) continue;
    (byEra[pm.era_slug] ||= []).push(pm);
  }
  const out = {};
  for (const [slug, poems] of Object.entries(byEra)) {
    const target = TARGETS[slug]?.poems ?? poems.length;
    const cap = TARGETS[slug]?.per_poet_cap ?? 5;
    const perPoetCount = {};
    const picked = [];
    for (const pm of poems) {
      if ((perPoetCount[pm.poet_id] ?? 0) >= cap) continue;
      picked.push(pm);
      perPoetCount[pm.poet_id] = (perPoetCount[pm.poet_id] ?? 0) + 1;
      if (picked.length >= target) break;
    }
    out[slug] = picked.map((pm) => ({
      id: pm.id,
      poet_id: pm.poet_id,
      poet_name_ko: pm.poet_name_ko,
      title_ko: pm.title_ko,
      title_zh: pm.title_zh,
      is_notable: pm.is_notable,
      quality: pm.quality,
    }));
  }
  return out;
}

const eraPoems = curatePoemsByEra(poemsRaw);
for (const slug of EMPTY_CN_ERAS) eraPoems[slug] = [];

// ─── 일일 회전 풀 (CN 200 + KR 100) ─────────────────────────────────
//   각 시대 큐레이션 시에서 daily 분량만큼 상위 추출 (이미 우선순위 정렬됨)
const dailyPool = { CN: [], KR: [] };
const KR_SLUGS = ['ancient-silla','goryeo-early-mid','goryeo-mal-joseon-cho','joseon-jung','joseon-hu','geundae'];
const CN_SLUGS = ['chu-tang','sheng-tang','zhong-tang','wan-tang'];

for (const slug of KR_SLUGS) {
  const target = TARGETS[slug]?.daily ?? 0;
  const ids = (eraPoems[slug] ?? []).slice(0, target).map((pm) => pm.id);
  dailyPool.KR.push(...ids);
}
for (const slug of CN_SLUGS) {
  const target = TARGETS[slug]?.daily ?? 0;
  const ids = (eraPoems[slug] ?? []).slice(0, target).map((pm) => pm.id);
  dailyPool.CN.push(...ids);
}

// ─── 출력 ───────────────────────────────────────────────────────────
function writeJson(name, obj) {
  const path = resolve(CUR, name);
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
  console.log(`  ✓ ${name}`);
}

console.log('큐레이션 산출물:');
writeJson('eras-poets.json', {
  generated_at: new Date().toISOString(),
  source: 'jds@jinas:5433',
  description: 'Phase 1 큐레이션. 시대별 시인 ID 풀 (poem_count 상위 N명).',
  targets: TARGETS,
  eras: eraPoets,
});
writeJson('eras-poems.json', {
  generated_at: new Date().toISOString(),
  source: 'jds@jinas:5433',
  description: 'Phase 1 큐레이션. 시대별 시 ID 풀 (notable + quality 우선, 시인당 최대 5수).',
  targets: TARGETS,
  eras: eraPoems,
});
writeJson('daily-pool.json', {
  generated_at: new Date().toISOString(),
  description: '오늘의 한시 일일 회전 풀. CN 200수 / KR 100수 (시대별 분담).',
  rotation_strategy: 'new Date().getDate() based index, separate per country',
  pool: dailyPool,
  size: { CN: dailyPool.CN.length, KR: dailyPool.KR.length },
});

// ─── 통계 출력 ──────────────────────────────────────────────────────
console.log('\n시대별 큐레이션 결과:');
console.log('  시대 슬러그              | 시인 | 시 | 일일');
console.log('  ' + '─'.repeat(50));
for (const slug of [...KR_SLUGS, ...CN_SLUGS, ...EMPTY_CN_ERAS]) {
  const t = TARGETS[slug] ?? { daily: 0 };
  const p = (eraPoets[slug] ?? []).length;
  const m = (eraPoems[slug] ?? []).length;
  const d = t.daily;
  console.log(`  ${slug.padEnd(24)} | ${String(p).padStart(4)} | ${String(m).padStart(4)} | ${String(d).padStart(4)}`);
}
console.log(`\n일일풀 합계: CN ${dailyPool.CN.length} / KR ${dailyPool.KR.length}`);
