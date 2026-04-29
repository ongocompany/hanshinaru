// B 라운드 commentary 재생성용 chunk 파일 생성
// Opus subagent 3병렬용. 시인별 묶음.
//
// 사용:
//   node scripts/maintenance/build_b_round_chunks.mjs

import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const CHUNKS = [
  {
    name: 'kim-sangheon',
    poet_zh: '金尙憲',
    poem_ids: [48203,48204,48205,48206,48207,48208,48209,48210,48211,48212,48213,48214,48215,48216,48217,48218,48219,48220,48221,48222,48223,48224,48225,48226],
  },
  {
    name: 'kim-ilson',
    poet_zh: '金馹孫',
    poem_ids: [48455,48456,48457,48458,48459,48460,48461,48462,48463,48464],
  },
  {
    name: 'others',
    poet_zh: null,
    poem_ids: [48911, 48916, 48511, 48899, 48909, 48913, 48894],
  },
];

for (const chunk of CHUNKS) {
  let header;
  if (chunk.poet_zh) {
    const poetRows = await sql`SELECT * FROM poets WHERE name_zh = ${chunk.poet_zh}`;
    const p = poetRows[0];
    header = `## 시인 메타 (재생성 시 일관 적용)
name_zh: ${p.name_zh}
name_ko: ${p.name_ko}
era_period: ${p.era_period ?? '?'}
life: ${p.life_raw ?? '?'}
bio: ${p.bio_ko ?? '?'}

## 시 ${chunk.poem_ids.length}수
모두 위 시인의 작품. 각 시별로 시인 시대·맥락에 맞는 commentary_ko를 새로 작성.
`;
  } else {
    header = `## 혼합 그룹 (각 시별 시인이 다름)
각 시 헤더에 표시된 시인 메타에 맞춰 commentary 재작성.
총 ${chunk.poem_ids.length}수 (시인 7명, 각 1수).
`;
  }

  let body = '';
  for (const id of chunk.poem_ids) {
    const rows = await sql`
      SELECT p.id, p.title_zh, p.body_zh, p.translation_ko, p.commentary_ko,
             po.id as poet_id, po.name_zh, po.name_ko, po.era_period, po.life_raw, po.bio_ko
      FROM poems p JOIN poets po ON p.poet_id = po.id WHERE p.id = ${id}`;
    const r = rows[0];

    if (chunk.poet_zh === null) {
      // 혼합 그룹: 시인 메타도 표시
      body += `\n=== poem#${r.id} ===\n`;
      body += `시인: ${r.name_zh}/${r.name_ko} (${r.era_period ?? '?'}, ${r.life_raw ?? '?'})\n`;
      body += `bio: ${r.bio_ko ?? '?'}\n`;
      body += `title: ${r.title_zh}\n`;
      body += `body:\n${r.body_zh ?? '(none)'}\n`;
      body += `translation:\n${r.translation_ko ?? '(none)'}\n`;
      body += `(이전 commentary는 잘못된 시인 매핑 기준이었으므로 무시)\n`;
    } else {
      body += `\n=== poem#${r.id} ===\n`;
      body += `title: ${r.title_zh}\n`;
      body += `body:\n${r.body_zh ?? '(none)'}\n`;
      body += `translation:\n${r.translation_ko ?? '(none)'}\n`;
    }
  }

  const path = `/tmp/b_round_${chunk.name}.txt`;
  writeFileSync(path, header + body);
  const lineCount = (header + body).split('\n').length;
  console.log(`${path}: ${chunk.poem_ids.length}수, ${lineCount}줄`);
}

await sql.end();
