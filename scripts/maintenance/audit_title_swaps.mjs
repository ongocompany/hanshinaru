// B 라운드 — 시제 단위 매핑 swap 검사
// 색인의 작품 제목 색인 vs DB 전수 시제 매칭
//   - 색인의 시제가 DB 다른 시인에 매핑되면 swap 의심
//   - 어제까지 정정된 11건은 화이트리스트로 false positive 제외
//
// 사용:
//   node scripts/maintenance/audit_title_swaps.mjs                  (요약)
//   node scripts/maintenance/audit_title_swaps.mjs --verbose        (모든 의심 케이스 본문)
//   node scripts/maintenance/audit_title_swaps.mjs --poet=<name>    (특정 시인만)

import postgres from 'postgres';
import { readFileSync } from 'fs';

const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const poetArg = argv.find(a => a.startsWith('--poet='));
const ONLY_POET = poetArg ? poetArg.split('=')[1] : null;

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const INDEX_FILE = 'docs/handoff/2026-04-26-automatic-collection-final-index.md';

// 어제까지 정정 완료된 색인 잘못된 매핑 (false positive 제외용)
const KNOWN_FIXES = [
  { wrong: '이언진', right: '이숭인', note: '도은집 252수 (2026-04-27)' },
  { wrong: '안중근', right: '안축', note: '근재집 127수 (2026-04-28)' },
  { wrong: '강위', right: '강정일당', note: '9 swap (2026-04-28)' },
  { wrong: '신사임당', right: '신숙주', note: '9 swap (2026-04-28)' },
  { wrong: '정인보', right: '정서', note: '9 swap (2026-04-28)' },
  { wrong: '임윤지당', right: '임춘', note: '9 swap (2026-04-28)' },
  { wrong: '박제가', right: '박인범', note: '9 swap (2026-04-28)' },
  { wrong: '이건창', right: '이곡', note: '9 swap (2026-04-28)' },
  { wrong: '이현보', right: '이행', note: '9 swap 부분 (2026-04-28)' },
  { wrong: '김창흡', right: '김창협', note: '9 swap 부분 (2026-04-28)' },
  { wrong: '허목', right: '허봉', note: '9 swap (2026-04-28)' },
];

// === 색인 파싱 ===
const indexContent = readFileSync(INDEX_FILE, 'utf8');
const lines = indexContent.split('\n');

let inWorksSection = false;
let currentPoet = null;
const indexTitleToPoet = new Map();   // title_zh -> [{name_ko, name_zh}, ...]
const indexPoetToTitles = new Map();  // poet key -> [title, ...]

for (const line of lines) {
  if (line.trim() === '## 작품 제목 색인') { inWorksSection = true; continue; }
  if (!inWorksSection) continue;
  if (/^## /.test(line) && line.trim() !== '## 작품 제목 색인') break;

  const headerMatch = line.match(/^### (.+?)(?:\s*\((.+?)\))?\s*$/);
  if (headerMatch) {
    currentPoet = {
      name_ko: headerMatch[1].trim(),
      name_zh: (headerMatch[2] ?? '').trim() || null,
    };
    continue;
  }

  const directMatch = line.match(/^- direct \d+건:\s*(.+)$/);
  if (directMatch && currentPoet) {
    const titles = directMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const key = currentPoet.name_zh ?? currentPoet.name_ko;
    const cur = indexPoetToTitles.get(key) ?? [];
    indexPoetToTitles.set(key, [...cur, ...titles]);
    for (const t of titles) {
      const arr = indexTitleToPoet.get(t) ?? [];
      arr.push({ ...currentPoet });
      indexTitleToPoet.set(t, arr);
    }
  }
}

const totalIndexedTitles = [...indexTitleToPoet.values()].reduce((s, a) => s + a.length, 0);
console.log(`색인 작품 제목: ${indexTitleToPoet.size}개 (entries: ${totalIndexedTitles})`);
console.log(`색인 시인: ${indexPoetToTitles.size}명`);
console.log('');

// === DB poems ===
const dbPoems = await sql`
  SELECT p.id, p.title_zh, po.id as poet_id, po.name_zh, po.name_ko, po.era_period
  FROM poems p
  JOIN poets po ON p.poet_id = po.id
  WHERE po.country = 'KR'
  ORDER BY po.id, p.id`;

console.log(`DB KR poems: ${dbPoems.length}수`);
console.log('');

// === Cross-check ===
let cleanMatch = 0;
let indexMissing = 0;
let suspicious = 0;
let knownFix = 0;
const suspicions = [];

const isPoetMatch = (idxEntry, dbPoet) => {
  if (idxEntry.name_zh && idxEntry.name_zh === dbPoet.name_zh) return true;
  if (idxEntry.name_ko && idxEntry.name_ko === dbPoet.name_ko) return true;
  return false;
};

const isKnownFix = (idxList, dbPoet) => {
  return KNOWN_FIXES.find(fx => {
    const idxHasWrong = idxList.some(i =>
      i.name_ko === fx.wrong || i.name_zh === fx.wrong
    );
    const dbIsRight =
      dbPoet.name_ko === fx.right || dbPoet.name_zh === fx.right;
    return idxHasWrong && dbIsRight;
  });
};

for (const p of dbPoems) {
  if (ONLY_POET && p.name_ko !== ONLY_POET && p.name_zh !== ONLY_POET) continue;

  const idx = indexTitleToPoet.get(p.title_zh);
  if (!idx) { indexMissing++; continue; }

  const matched = idx.some(i => isPoetMatch(i, p));
  if (matched) { cleanMatch++; continue; }

  const fix = isKnownFix(idx, p);
  if (fix) { knownFix++; continue; }

  suspicious++;
  suspicions.push({
    poem_id: p.id,
    title: p.title_zh,
    db_poet: { id: p.poet_id, name_zh: p.name_zh, name_ko: p.name_ko, era: p.era_period },
    index_poets: idx,
  });
}

console.log('=== Cross-check 결과 ===');
console.log(`색인-DB 시인 일치 (CLEAN): ${cleanMatch}`);
console.log(`색인 미수록 (DB만 있음): ${indexMissing}`);
console.log(`알려진 정정 (false positive 제외): ${knownFix}`);
console.log(`⚠️ 시인 불일치 (swap 의심): ${suspicious}`);
console.log('');

if (suspicions.length === 0) {
  console.log('✅ 옅은 swap 의심 케이스 없음. (어제 정정 후 잔존 매핑 오류 0건 추정)');
  await sql.end();
  process.exit(0);
}

// DB 시인별 의심 카운트 (집계)
const suspByDbPoet = new Map();
for (const s of suspicions) {
  const key = `poet#${s.db_poet.id} ${s.db_poet.name_zh ?? '?'}/${s.db_poet.name_ko ?? '?'} (${s.db_poet.era ?? '?'})`;
  const cur = suspByDbPoet.get(key) ?? { count: 0, items: [] };
  cur.count++;
  cur.items.push(s);
  suspByDbPoet.set(key, cur);
}

console.log('=== DB 시인별 의심 시 카운트 (큰 순) ===');
const sortedPoets = [...suspByDbPoet.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [poet, info] of sortedPoets) {
  // 색인 후보 시인들 집계
  const idxPoetCounts = new Map();
  for (const item of info.items) {
    for (const ip of item.index_poets) {
      const k = `${ip.name_zh ?? '?'}/${ip.name_ko ?? '?'}`;
      idxPoetCounts.set(k, (idxPoetCounts.get(k) ?? 0) + 1);
    }
  }
  const idxSummary = [...idxPoetCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}(${v})`)
    .join(', ');
  console.log(`  ${info.count}수: ${poet}`);
  console.log(`        색인 후보: ${idxSummary}`);
}
console.log('');

if (VERBOSE) {
  console.log('=== 모든 의심 케이스 ===');
  for (const [poet, info] of sortedPoets) {
    console.log(`\n[${poet}] ${info.count}수`);
    for (const s of info.items) {
      const idxStr = s.index_poets.map(i => `${i.name_zh ?? '?'}/${i.name_ko}`).join(' | ');
      console.log(`  poem#${s.poem_id} 「${s.title}」 → 색인: ${idxStr}`);
    }
  }
}

await sql.end();
