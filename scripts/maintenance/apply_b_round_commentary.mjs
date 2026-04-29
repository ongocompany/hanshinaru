// B 라운드 commentary apply — 3 results jsonl → DB UPDATE
// 사용:
//   node scripts/maintenance/apply_b_round_commentary.mjs            (dry-run)
//   node scripts/maintenance/apply_b_round_commentary.mjs --apply

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const FILES = [
  { path: '/tmp/b_round_kim-sangheon_results.jsonl', expected: 24, memo: 'B 라운드: 김창흡→김상헌 swap 정정 + commentary 재생성' },
  { path: '/tmp/b_round_kim-ilson_results.jsonl',    expected: 10, memo: 'B 라운드: 김창흡→김일손 swap 정정 + commentary 재생성' },
  { path: '/tmp/b_round_others_results.jsonl',       expected: 7,  memo: 'B 라운드: 한자 성씨 swap 정정 + commentary 재생성' },
];

console.log(`# B 라운드 commentary apply`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

let total = 0, applied = 0, lengthIssues = [], bannedHits = [];
const BANNED = /명편|걸작|백미|정수|정점|지대한|훌륭한|명작|뛰어난/;

for (const f of FILES) {
  const lines = readFileSync(f.path, 'utf8').split('\n').filter(l => l.trim());
  if (lines.length !== f.expected) {
    console.log(`⚠️ ${f.path}: ${lines.length} 라인 (예상 ${f.expected})`);
    continue;
  }
  console.log(`[${f.path}] ${lines.length} 수`);

  for (const line of lines) {
    let row;
    try { row = JSON.parse(line); } catch (e) { console.log(`  parse error: ${line.slice(0, 80)}`); continue; }
    if (!row.id || !row.commentary_ko) { console.log(`  invalid row: ${line.slice(0, 80)}`); continue; }
    total++;

    const len = row.commentary_ko.length;
    if (len < 200 || len > 400) lengthIssues.push({ id: row.id, len });
    if (BANNED.test(row.commentary_ko)) bannedHits.push({ id: row.id, snippet: row.commentary_ko.match(BANNED)?.[0] });

    if (APPLY) {
      const updated = await sql`
        UPDATE poems
        SET commentary_ko = ${row.commentary_ko},
            quality = 'opus-subagent-v2',
            review_memo = ${f.memo}
        WHERE id = ${row.id}`;
      if (updated.count !== 1) console.log(`  ⚠️ poem#${row.id} UPDATE count=${updated.count}`);
      else applied++;
    }
  }
  console.log('');
}

console.log(`총 ${total}수 처리, 길이 이상 ${lengthIssues.length}건, 금지 표현 ${bannedHits.length}건`);
if (lengthIssues.length) console.log(`길이 이상: ${JSON.stringify(lengthIssues)}`);
if (bannedHits.length) console.log(`금지 표현: ${JSON.stringify(bannedHits)}`);
if (APPLY) console.log(`✅ DB UPDATE: ${applied}/${total}`);

if (!APPLY) console.log('\n--- DRY-RUN. --apply 추가 시 실행 ---');

await sql.end();
