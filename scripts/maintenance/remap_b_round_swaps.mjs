// B 라운드 — 41수 매핑 정정 + 잘못 매핑된 시인 row 메모 갱신
// 사용:
//   node scripts/maintenance/remap_b_round_swaps.mjs           (dry-run)
//   node scripts/maintenance/remap_b_round_swaps.mjs --apply

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const REMAPS = [
  { to_zh: '金尙憲', ids: [48203,48204,48205,48206,48207,48208,48209,48210,48211,48212,48213,48214,48215,48216,48217,48218,48219,48220,48221,48222,48223,48224,48225,48226], note: '김창흡 → 김상헌 (한자 성씨 swap, 청음집 24수)' },
  { to_zh: '金馹孫', ids: [48455,48456,48457,48458,48459,48460,48461,48462,48463,48464], note: '김창흡 → 김일손 (한자 성씨 swap, 탁영집 10수)' },
  { to_zh: '李公升', ids: [48911], note: '이안눌 → 이공승 (한자 성씨 swap, 천관사 시 파한집 수록)' },
  { to_zh: '李元絃', ids: [48916], note: '이안눌 → 이원현 (시제 「李元絃詩」)' },
  { to_zh: '崔匡裕', ids: [48511], note: '최경창 → 최광유 (한자 성씨 swap, 御溝 협주명현십초시 수록)' },
  { to_zh: '曺偉',   ids: [48899], note: '조식 → 조위 (한자 성씨 swap, 시제 「梅溪曹偉詩」)' },
  { to_zh: '朴元亨', ids: [48909], note: '박효수 → 박원형 (한자 성씨 swap, 시제 「朴元亨詩」)' },
  { to_zh: '張鎰',   ids: [48913], note: '장현광 → 장일 (한자 성씨 swap, 시제 「張鎰詩」)' },
  { to_zh: '李文和', ids: [48894], note: '이민구 → 이문화 (한자 성씨 swap, 시제 「李文和詩」)' },
];

console.log(`# B 라운드 매핑 정정 — ${REMAPS.length} 그룹, 총 ${REMAPS.reduce((s,r)=>s+r.ids.length,0)}수`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

// 신규 시인 ID 매핑 빌드
const targetPoetIds = {};
for (const r of REMAPS) {
  const rows = await sql`SELECT id FROM poets WHERE name_zh = ${r.to_zh}`;
  if (rows.length === 0) {
    console.log(`❌ ${r.to_zh}: poet 미존재. INSERT 먼저 실행 필요`);
    process.exit(1);
  }
  targetPoetIds[r.to_zh] = rows[0].id;
}

let updateTotal = 0;
const fromPoetIds = new Set();

for (const r of REMAPS) {
  const newPoetId = targetPoetIds[r.to_zh];
  console.log(`[→ poet#${newPoetId} ${r.to_zh}] ${r.ids.length}수 (${r.note})`);

  // 현재 매핑 검증
  const cur = await sql`
    SELECT p.id, p.title_zh, p.poet_id, po.name_zh, po.name_ko
    FROM poems p JOIN poets po ON p.poet_id = po.id
    WHERE p.id = ANY(${r.ids}) ORDER BY p.id`;

  for (const c of cur) {
    fromPoetIds.add(c.poet_id);
    console.log(`  poem#${c.id} 「${c.title_zh}」 (현: ${c.name_zh}/${c.name_ko}) → poet#${newPoetId}`);
  }

  if (APPLY) {
    const updated = await sql`
      UPDATE poems
      SET poet_id = ${newPoetId},
          review_memo = ${`B 라운드: ${r.note}`}
      WHERE id = ANY(${r.ids})`;
    console.log(`  ✅ UPDATE ${updated.count} row\n`);
    updateTotal += updated.count;
  } else {
    console.log('');
  }
}

if (APPLY) {
  console.log(`\n총 UPDATE: ${updateTotal}수`);

  // poem_count 동기화 (영향받은 시인들)
  const affectedPoetIds = [...fromPoetIds, ...Object.values(targetPoetIds)];
  console.log(`\n# poem_count 동기화 (${affectedPoetIds.length}명)`);
  for (const pid of affectedPoetIds) {
    const result = await sql`
      UPDATE poets
      SET poem_count = (SELECT COUNT(*) FROM poems WHERE poet_id = ${pid})
      WHERE id = ${pid}
      RETURNING id, name_zh, name_ko, poem_count`;
    if (result.length > 0) {
      const r = result[0];
      console.log(`  poet#${r.id} ${r.name_zh}/${r.name_ko}: poem_count = ${r.poem_count}`);
    }
  }
}

if (!APPLY) console.log('\n--- DRY-RUN. --apply 추가 시 실행 ---');

await sql.end();
