// 안축(3469) + 안중근(3343) 메타 + poem_count 동기화 검증/제안
import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const env = readFileSync('.env.local','utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

console.log(APPLY ? '== APPLY MODE ==' : '== DRY-RUN MODE ==');
console.log('');

const rows = await sql`
  SELECT id, name_zh, name_ko, slug, era_period, country,
         life_birth, life_death, life_raw, bio_ko, poem_count,
         (SELECT COUNT(*) FROM poems WHERE poet_id = p.id)::int AS actual_count
  FROM poets p
  WHERE id IN (3343, 3469)
  ORDER BY id`;
rows.forEach(r => {
  console.log(`poet#${r.id} ${r.name_zh}/${r.name_ko}`);
  console.log(`  slug=${r.slug} country=${r.country} era_period=${r.era_period}`);
  console.log(`  life: ${r.life_birth}~${r.life_death} raw=${r.life_raw}`);
  console.log(`  bio_ko: ${(r.bio_ko ?? '').slice(0, 80)}`);
  console.log(`  poem_count=${r.poem_count} (실제: ${r.actual_count})`);
  console.log('');
});

if (APPLY) {
  // 안축 poem_count 동기화 (1 → 128)
  await sql`UPDATE poets SET poem_count = 128 WHERE id = 3469`;
  console.log('안축(3469) poem_count → 128');

  // 안중근(3343) — 시 0수, 근대 인물로 정확화
  await sql`UPDATE poets SET
    poem_count = 0,
    era_period = '근대',
    country = 'KR',
    life_birth = 1879,
    life_death = 1910,
    life_raw = '1879-1910',
    bio_ko = '대한제국기의 독립운동가. 1909년 하얼빈에서 이토 히로부미를 사살하고 이듬해 뤼순 감옥에서 순국. 옥중에서 한시·서예·「동양평화론」을 남겼다. 본 DB에는 진짜 안중근 시문이 아직 미적재 — 이전 매핑은 안축(安軸) 근재집과 혼동된 결과로, 본 정정으로 0수가 되었다.'
    WHERE id = 3343`;
  console.log('안중근(3343) life/bio/era 정확화 + poem_count = 0');
}

await sql.end();
