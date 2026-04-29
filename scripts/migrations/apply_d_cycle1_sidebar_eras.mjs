// D 라운드 cycle 1 — site_menu 변경 (UPDATE 2 + INSERT 12) via Supabase PostgREST
// 사용:
//   node scripts/migrations/apply_d_cycle1_sidebar_eras.mjs            (dry-run)
//   node scripts/migrations/apply_d_cycle1_sidebar_eras.mjs --apply
//
// 환경변수 필수: SUPABASE_SERVICE_ROLE_KEY
// 또는 ~/.env.local의 'hanshinaru supabase service role' 라인에서 자동 추출

import { readFileSync } from 'fs';
import { homedir } from 'os';

const APPLY = process.argv.includes('--apply');

const SUPABASE_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co/rest/v1';

// service_role key 확보
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const env = readFileSync(`${homedir()}/.env.local`, 'utf8');
    const m = env.match(/hanshinaru supabase service role\s*:\s*(eyJ[^\s]+)/);
    if (m) SERVICE_KEY = m[1];
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('❌ service_role key 미발견. SUPABASE_SERVICE_ROLE_KEY env 또는 ~/.env.local 확인');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { headers: HEADERS, ...opts });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function showHansiSection(label) {
  const rows = await fetchJson(
    `${SUPABASE_URL}/site_menu?select=id,section,label,path,parent_id,sort_order&section=eq.hansi&order=parent_id.nullsfirst,sort_order.asc`,
  );
  console.log(`\n=== site_menu (hansi) — ${label} ===`);
  console.log(`총 ${rows.length} row`);
  for (const r of rows) {
    const indent = r.parent_id ? '  ' : '';
    console.log(`  ${indent}id ${String(r.id).padStart(3)} | parent=${String(r.parent_id ?? '-').padStart(3)} | sort=${r.sort_order} | ${r.label.padEnd(20)} | ${r.path}`);
  }
  return rows;
}

console.log(`# D 라운드 cycle 1 — site_menu 변경`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);

await showHansiSection('BEFORE');

if (!APPLY) {
  console.log('\n--- DRY-RUN. --apply 추가 시 실행. 작업 내용:');
  console.log('1) UPDATE id=32 label = \'오늘의 한시\'');
  console.log('2) UPDATE id=34 label = \'오늘의 한시\'');
  console.log('3) INSERT 시대 부모 (CN, parent_id=30, sort=3, label="시대")');
  console.log('4) INSERT 시대 부모 (KR, parent_id=31, sort=3, label="시대")');
  console.log('5) INSERT 7 CN 시대 children (전한·후한, 위진남북조, 당, 송, 원, 명, 청)');
  console.log('6) INSERT 3 KR 시대 children (신라, 고려, 조선)');
  process.exit(0);
}

// === APPLY ===
console.log('\n=== STEP 1-2: UPDATE label ===');
for (const id of [32, 34]) {
  const r = await fetchJson(`${SUPABASE_URL}/site_menu?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({ label: '오늘의 한시' }),
  });
  console.log(`  ✓ id=${id} label updated → ${r[0]?.label}`);
}

console.log('\n=== STEP 3: INSERT CN era parent ===');
const cnParent = await fetchJson(`${SUPABASE_URL}/site_menu`, {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify({
    section: 'hansi',
    label: '시대',
    path: '/hansi/chinese/eras/',
    parent_id: 30,
    sort_order: 3,
    is_top_menu: false,
    disabled: false,
  }),
});
const cnParentId = cnParent[0].id;
console.log(`  ✓ CN 시대 parent id=${cnParentId}`);

console.log('\n=== STEP 4: INSERT KR era parent ===');
const krParent = await fetchJson(`${SUPABASE_URL}/site_menu`, {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify({
    section: 'hansi',
    label: '시대',
    path: '/hansi/korean/eras/',
    parent_id: 31,
    sort_order: 3,
    is_top_menu: false,
    disabled: false,
  }),
});
const krParentId = krParent[0].id;
console.log(`  ✓ KR 시대 parent id=${krParentId}`);

console.log('\n=== STEP 5: INSERT 7 CN era children ===');
const CN_ERAS = [
  ['전한·후한', '/hansi/chinese/eras/qian-han/', 1],
  ['위진남북조', '/hansi/chinese/eras/wei-jin/', 2],
  ['당', '/hansi/chinese/eras/tang/', 3],
  ['송', '/hansi/chinese/eras/song/', 4],
  ['원', '/hansi/chinese/eras/yuan/', 5],
  ['명', '/hansi/chinese/eras/ming/', 6],
  ['청', '/hansi/chinese/eras/qing/', 7],
];
const cnChildren = CN_ERAS.map(([label, path, sort_order]) => ({
  section: 'hansi', label, path, parent_id: cnParentId, sort_order,
  is_top_menu: false, disabled: false,
}));
const cnInserted = await fetchJson(`${SUPABASE_URL}/site_menu`, {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify(cnChildren),
});
console.log(`  ✓ ${cnInserted.length} CN era rows inserted`);

console.log('\n=== STEP 6: INSERT 3 KR era children ===');
const KR_ERAS = [
  ['신라', '/hansi/korean/eras/silla/', 1],
  ['고려', '/hansi/korean/eras/goryeo/', 2],
  ['조선', '/hansi/korean/eras/joseon/', 3],
];
const krChildren = KR_ERAS.map(([label, path, sort_order]) => ({
  section: 'hansi', label, path, parent_id: krParentId, sort_order,
  is_top_menu: false, disabled: false,
}));
const krInserted = await fetchJson(`${SUPABASE_URL}/site_menu`, {
  method: 'POST',
  headers: { ...HEADERS, Prefer: 'return=representation' },
  body: JSON.stringify(krChildren),
});
console.log(`  ✓ ${krInserted.length} KR era rows inserted`);

await showHansiSection('AFTER');
console.log('\n✅ 완료');
