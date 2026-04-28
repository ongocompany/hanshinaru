// poet#3343(안중근) → poet#3469(안축) 일괄 매핑 정정
// 기본은 dry-run. --apply 인자 시 실제 UPDATE 실행.

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const env = readFileSync('.env.local','utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

console.log(APPLY ? '== APPLY MODE (실제 UPDATE) ==' : '== DRY-RUN MODE ==');
console.log('');

const before3343 = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = 3343`;
const before3469 = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = 3469`;
console.log(`현재 poet#3343 (안중근): ${before3343[0].n}수`);
console.log(`현재 poet#3469 (안축):   ${before3469[0].n}수`);

const targets = await sql`SELECT id, title_zh FROM poems WHERE poet_id = 3343 ORDER BY id`;
console.log(`이동 대상: ${targets.length}수 (id ${targets[0].id} ~ ${targets[targets.length-1].id})`);

if (APPLY) {
  console.log('');
  console.log('UPDATE 실행 중...');
  const result = await sql`
    UPDATE poems
    SET poet_id = 3469,
        review_memo = COALESCE(NULLIF(review_memo, ''), '') ||
                      CASE WHEN review_memo IS NULL OR review_memo = '' THEN '' ELSE ' | ' END ||
                      '근재집 127수 매핑 정정 (안중근→안축)'
    WHERE poet_id = 3343
    RETURNING id`;
  console.log(`UPDATE 완료: ${result.length} row 영향`);

  const after3343 = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = 3343`;
  const after3469 = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = 3469`;
  console.log('');
  console.log(`정정 후 poet#3343: ${after3343[0].n}수`);
  console.log(`정정 후 poet#3469: ${after3469[0].n}수`);
} else {
  console.log('');
  console.log('--apply 인자로 실행하면 위 127 row가 poet_id 3343 → 3469 로 UPDATE 됩니다.');
  console.log('review_memo 에 "근재집 127수 매핑 정정 (안중근→안축)" 추가됨.');
}

await sql.end();
