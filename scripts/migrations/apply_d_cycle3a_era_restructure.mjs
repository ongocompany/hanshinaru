// D 라운드 cycle 3a — site_menu 시대 자식 재구조화 (CN 7→10, KR 3→6)
// 사용:
//   node scripts/migrations/apply_d_cycle3a_era_restructure.mjs            (dry-run)
//   node scripts/migrations/apply_d_cycle3a_era_restructure.mjs --apply

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const APPLY = process.argv.includes('--apply');
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
  return text ? JSON.parse(text) : null;
}

async function showMenu(label) {
  const rows = await pgrest('site_menu?section=eq.hansi&select=id,label,path,parent_id,sort_order&order=parent_id.nullsfirst,sort_order.asc');
  console.log(`\n=== site_menu (hansi) — ${label} (${rows.length}행) ===`);
  for (const r of rows) {
    const indent = r.parent_id ? '  ' : '';
    console.log(`  ${indent}id=${String(r.id).padStart(3)} parent=${String(r.parent_id ?? '-').padStart(3)} sort=${r.sort_order} | ${(r.label ?? '').padEnd(22)} | ${r.path}`);
  }
  return rows;
}

const CN_ERAS = [
  ['전한·후한',   '/hansi/chinese/eras/qian-han/',   1],
  ['위진남북조', '/hansi/chinese/eras/wei-jin/',    2],
  ['초당',        '/hansi/chinese/eras/chu-tang/',   3],
  ['성당',        '/hansi/chinese/eras/sheng-tang/', 4],
  ['중당',        '/hansi/chinese/eras/zhong-tang/', 5],
  ['만당',        '/hansi/chinese/eras/wan-tang/',   6],
  ['송',          '/hansi/chinese/eras/song/',       7],
  ['원',          '/hansi/chinese/eras/yuan/',       8],
  ['명',          '/hansi/chinese/eras/ming/',       9],
  ['청',          '/hansi/chinese/eras/qing/',      10],
];

const KR_ERAS = [
  ['국가형성기~신라말기', '/hansi/korean/eras/ancient-silla/',         1],
  ['고려 초중기',         '/hansi/korean/eras/goryeo-early-mid/',      2],
  ['여말선초',            '/hansi/korean/eras/goryeo-mal-joseon-cho/', 3],
  ['조선 중기',           '/hansi/korean/eras/joseon-jung/',           4],
  ['조선 후기',           '/hansi/korean/eras/joseon-hu/',             5],
  ['근대',                '/hansi/korean/eras/geundae/',               6],
];

console.log(`# D 라운드 cycle 3a — site_menu 시대 재구조화`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);

const before = await showMenu('BEFORE');
const cnParent = before.find((r) => r.parent_id === 30 && r.label === '시대');
const krParent = before.find((r) => r.parent_id === 31 && r.label === '시대');
if (!cnParent || !krParent) throw new Error('CN/KR 시대 부모 행 미발견 (cycle 1 SQL 미적용?)');
console.log(`\n✓ 부모 ID 확인: CN=${cnParent.id}, KR=${krParent.id} (예상: 45, 46)`);

const oldChildren = before.filter((r) => r.parent_id === cnParent.id || r.parent_id === krParent.id);
console.log(`\n삭제 대상 자식: ${oldChildren.length}행 (CN ${oldChildren.filter((r) => r.parent_id === cnParent.id).length} + KR ${oldChildren.filter((r) => r.parent_id === krParent.id).length})`);
console.log(`신규 INSERT: CN ${CN_ERAS.length} + KR ${KR_ERAS.length} = ${CN_ERAS.length + KR_ERAS.length}행`);

if (!APPLY) {
  console.log('\n--- DRY-RUN. --apply 추가 시 실행. ---');
  process.exit(0);
}

console.log('\n=== STEP 1: 기존 자식 DELETE ===');
for (const r of oldChildren) {
  await pgrest(`site_menu?id=eq.${r.id}`, { method: 'DELETE' });
  console.log(`  ✓ DELETE id=${r.id} ${r.label}`);
}

console.log('\n=== STEP 2: CN 10 시대 INSERT ===');
const cnPayload = CN_ERAS.map(([label, path, sort_order]) => ({
  section: 'hansi', label, path, parent_id: cnParent.id, sort_order,
  is_top_menu: false, disabled: false,
}));
const cnInserted = await pgrest('site_menu', {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify(cnPayload),
});
console.log(`  ✓ ${cnInserted.length}행 INSERT (CN)`);

console.log('\n=== STEP 3: KR 6 시대 INSERT ===');
const krPayload = KR_ERAS.map(([label, path, sort_order]) => ({
  section: 'hansi', label, path, parent_id: krParent.id, sort_order,
  is_top_menu: false, disabled: false,
}));
const krInserted = await pgrest('site_menu', {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify(krPayload),
});
console.log(`  ✓ ${krInserted.length}행 INSERT (KR)`);

await showMenu('AFTER');
console.log('\n✅ site_menu 재구조화 완료');
