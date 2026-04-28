// 자동 수집 색인의 시인-시집 매트릭스를 DB와 cross-check.
// 큰 불일치 (분량 mismatch) → 합본 매핑 swap 의심.
//
// 출력: 의심 시인 정렬 (불일치 정도)

import postgres from 'postgres';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

const INDEX_FILE = 'docs/handoff/2026-04-26-automatic-collection-final-index.md';

// 매트릭스 라인 파싱
const indexContent = readFileSync(INDEX_FILE, 'utf8');
const lines = indexContent.split('\n');
const matrixRows = [];
for (const line of lines) {
  const m = line.match(/^\| (\d+) \| (.*?) \| (.*?) \| (.*?) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (.*?) \|$/);
  if (m) {
    matrixRows.push({
      order: parseInt(m[1], 10),
      name_ko: m[2].trim(),
      name_zh: m[3].trim() || null,
      era: m[4].trim(),
      direct: parseInt(m[5], 10),
      located: parseInt(m[6], 10),
      blocked: parseInt(m[7], 10),
      candidate: parseInt(m[8], 10),
      total: parseInt(m[9], 10),
      sources: m[10].trim(),
    });
  }
}
console.log(`색인 매트릭스: ${matrixRows.length}명`);

// DB KR poets
const dbPoets = await sql`
  SELECT id, name_zh, name_ko, era_period, poem_count,
         (SELECT COUNT(*) FROM poems WHERE poet_id = p.id)::int AS actual_count
  FROM poets p
  WHERE country = 'KR'
  ORDER BY actual_count DESC, name_zh`;
console.log(`DB KR poets: ${dbPoets.length}명`);
console.log('');

// 매칭 (한자명 우선, 없으면 한글명)
const dbByZh = new Map();
const dbByKo = new Map();
dbPoets.forEach(p => {
  if (p.name_zh) dbByZh.set(p.name_zh, p);
  if (p.name_ko) dbByKo.set(p.name_ko, p);
});

const matchResults = [];
const indexNotInDb = [];
for (const idx of matrixRows) {
  let dbRow = idx.name_zh ? dbByZh.get(idx.name_zh) : null;
  if (!dbRow && idx.name_ko) dbRow = dbByKo.get(idx.name_ko);
  if (!dbRow) {
    indexNotInDb.push(idx);
  } else {
    matchResults.push({
      idx,
      db: dbRow,
      diff: dbRow.actual_count - idx.direct,
      diff_abs: Math.abs(dbRow.actual_count - idx.direct),
    });
  }
}

console.log(`매칭: ${matchResults.length} / 색인 ${matrixRows.length}`);
console.log(`색인엔 있는데 DB 미매칭: ${indexNotInDb.length}`);
if (indexNotInDb.length) {
  indexNotInDb.forEach(idx => console.log(`  - ${idx.name_ko}/${idx.name_zh} direct=${idx.direct}`));
}
console.log('');

// 분량 불일치 정렬
matchResults.sort((a, b) => b.diff_abs - a.diff_abs);
console.log('=== 분량 불일치 정렬 (절댓값 큰 순) ===');
console.log('  diff(DB-색인) | DB id | 한자/한글 | DB count | 색인 direct | 비고');
console.log('  ' + '-'.repeat(95));
let mismatchCnt = 0;
for (const r of matchResults) {
  if (r.diff === 0) continue;
  mismatchCnt++;
  const sign = r.diff > 0 ? '+' : '';
  const note = r.db.actual_count === 0 && r.idx.direct > 0 ? '⚠️ 색인 있음 / DB 0수 (swap 후보 또는 미적재)'
    : r.idx.direct === 0 && r.db.actual_count > 0 ? '⚠️ DB 있음 / 색인 0 (swap 또는 색인 누락)'
    : Math.abs(r.diff) > 5 ? '⚠️ 큰 차이' : '';
  console.log(`  ${sign}${r.diff.toString().padStart(5)} | #${r.db.id.toString().padStart(4)} | ${(r.db.name_zh + '/' + (r.db.name_ko ?? '')).padEnd(20)} | ${r.db.actual_count.toString().padStart(4)} | ${r.idx.direct.toString().padStart(4)} | ${note}`);
}
console.log('');
console.log(`총 ${mismatchCnt} / ${matchResults.length} 시인이 분량 불일치`);
console.log(`완전 일치: ${matchResults.length - mismatchCnt}명`);

// DB에 있지만 색인엔 없는 시인 — KR poets 중
const indexZhSet = new Set(matrixRows.map(m => m.name_zh).filter(Boolean));
const indexKoSet = new Set(matrixRows.map(m => m.name_ko).filter(Boolean));
const dbNotInIndex = dbPoets.filter(p => !indexZhSet.has(p.name_zh) && !indexKoSet.has(p.name_ko) && p.actual_count > 0);
console.log('');
console.log(`DB 추가 시인 (색인 없음, 시 보유): ${dbNotInIndex.length}`);
dbNotInIndex.slice(0, 20).forEach(p => console.log(`  poet#${p.id} ${p.name_zh}/${p.name_ko} (${p.actual_count}수)`));
if (dbNotInIndex.length > 20) console.log(`  ... 외 ${dbNotInIndex.length - 20}`);

await sql.end();
