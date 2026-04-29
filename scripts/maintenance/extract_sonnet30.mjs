// sonnet-subagent로 처리된 30수 추출 — A안 검수 작업
// 사용: node scripts/maintenance/extract_sonnet30.mjs [--brief]
//   --brief: 시 메타 + commentary만 (translation/body 제외)

import postgres from 'postgres';
import { readFileSync } from 'fs';

const argv = process.argv.slice(2);
const BRIEF = argv.includes('--brief');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
if (!dbUrl) throw new Error('HANSHINARU_DATABASE_URL not found in .env.local');

const sql = postgres(dbUrl, { max: 5, prepare: false });

const rows = await sql`
  SELECT p.id, p.title_zh, p.title_ko, p.body_zh,
         p.commentary_ko, p.translation_ko, p.quality, p.review_memo,
         po.id as poet_id, po.name_zh, po.name_ko, po.era_period, po.life_raw, po.bio_ko
  FROM poems p
  JOIN poets po ON p.poet_id = po.id
  WHERE po.country = 'KR'
    AND p.quality = 'sonnet-subagent'
  ORDER BY p.id
`;

console.log(`# sonnet-subagent KR commentary: ${rows.length}수`);
console.log('');

// 시인별 분포
const poetDist = {};
rows.forEach(r => {
  const k = `${r.name_zh}/${r.name_ko}(p#${r.poet_id}, ${r.era_period})`;
  poetDist[k] = (poetDist[k] ?? 0) + 1;
});
console.log('## 시인별 분포');
Object.entries(poetDist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([p, n]) => console.log(`  ${p}: ${n}수`));
console.log('');

console.log('## 30수 본문');
console.log('');
for (const r of rows) {
  console.log(`=== poem#${r.id} ${r.name_zh}(${r.name_ko}, ${r.era_period}) [${r.life_raw ?? '?'}] ===`);
  console.log(`title_zh: ${r.title_zh}`);
  if (r.title_ko) console.log(`title_ko: ${r.title_ko}`);
  if (!BRIEF) {
    console.log(`body:`);
    console.log(r.body_zh ?? '(none)');
    console.log(`translation:`);
    console.log(r.translation_ko ?? '(none)');
  }
  console.log(`commentary:`);
  console.log(r.commentary_ko ?? '(none)');
  console.log('');
}

await sql.end();
