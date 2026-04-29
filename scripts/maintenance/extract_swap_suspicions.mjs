// B 라운드 — 시제 단위 swap 의심 44수 추출 (web 검증 입력)
//
// 사용:
//   node scripts/maintenance/extract_swap_suspicions.mjs > /tmp/swap_suspicions.txt
//   node scripts/maintenance/extract_swap_suspicions.mjs --group=<key>

import postgres from 'postgres';
import { readFileSync } from 'fs';

const argv = process.argv.slice(2);
const groupArg = argv.find(a => a.startsWith('--group='));
const ONLY_GROUP = groupArg ? groupArg.split('=')[1] : null;

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

// 그룹별 의심 케이스 (audit_title_swaps.mjs --verbose 결과 기반)
const GROUPS = {
  'kim-sangheon': {
    label: '김창흡(3365) → 김상헌(金尙憲) — 24수',
    hypothesis: { name_zh: '金尙憲', name_ko: '김상헌', era: '조선 중기', life: '1570-1652', notes: '청음(淸陰), 좌의정. 병자호란 척화파. 승정원·홍문관 경력' },
    poem_ids: [48203, 48204, 48205, 48206, 48207, 48208, 48209, 48210, 48211, 48212, 48213, 48214, 48215, 48216, 48217, 48218, 48219, 48220, 48221, 48222, 48223, 48224, 48225, 48226],
  },
  'kim-ilson': {
    label: '김창흡(3365) → 김일손(金馹孫) — 10수',
    hypothesis: { name_zh: '金馹孫', name_ko: '김일손', era: '조선 전기', life: '1464-1498', notes: '탁영(濯纓), 김종직 문인. 무오사화 희생. 점필재(畢齋), 노릉(魯陵, 단종) 관련' },
    poem_ids: [48455, 48456, 48457, 48458, 48459, 48460, 48461, 48462, 48463, 48464],
  },
  'lee-anul-mixed': {
    label: '이안눌(3435) → 이호민/이공승/이원현 — 3수 (혼합)',
    hypothesis: { name_zh: '?(혼합)', name_ko: '?', era: '?', notes: '시별 가설 다름 — 「五峰」=이호민(1547-1634), 「高麗」=이공승(고려), 「李元絃詩」=이원현' },
    poem_ids: [48890, 48911, 48916],
  },
  'choi-gwangyu': {
    label: '최경창(3326) → 최광유(崔匡裕) — 1수',
    hypothesis: { name_zh: '崔匡裕', name_ko: '최광유', era: '신라 말', notes: '신라 말 시인. 색인엔 1수만 「御溝」. 최경창(1539-1583)과 시대 1000년 차이' },
    poem_ids: [48511],
  },
  'jeong-chu-ambig': {
    label: '정추(3457) → 全湜 또는 鄭文翼 — 1수 (모호)',
    hypothesis: { name_zh: '?', name_ko: '?', candidates: ['全湜(전식, 1563-1642, 조선 중기)', '鄭文翼'], notes: '시제 「府尹」 일반적. web으로 정밀 검증 필요' },
    poem_ids: [48888],
  },
  'title-evident': {
    label: '시제 자체에 작자명 노출 — 6수 (자동 색인 결함 명확)',
    hypothesis: { name_zh: 'multiple', name_ko: 'multiple', notes: '시별 가설 — 「梅溪曹偉詩」=조위(1454-1503, 호 매계), 「朴元亨詩」=박원형(1411-1469), 「張鎰詩」=장일, 「李文和詩」=이문화, 「李達哀詩」=이달애, 「李元絃詩」는 lee-anul-mixed 그룹과 중복' },
    poem_ids: [48899, 48909, 48913, 48894, 48902],
  },
};

for (const [key, group] of Object.entries(GROUPS)) {
  if (ONLY_GROUP && key !== ONLY_GROUP) continue;
  console.log(`# ${group.label}`);
  console.log(`hypothesis: ${JSON.stringify(group.hypothesis, null, 0)}`);
  console.log('');

  const rows = await sql`
    SELECT p.id, p.title_zh, p.title_ko, p.body_zh,
           p.commentary_ko, p.translation_ko, p.quality, p.review_memo,
           po.id as poet_id, po.name_zh, po.name_ko, po.era_period, po.life_raw
    FROM poems p
    JOIN poets po ON p.poet_id = po.id
    WHERE p.id = ANY(${group.poem_ids})
    ORDER BY p.id
  `;

  for (const r of rows) {
    console.log(`=== poem#${r.id} (현 매핑: ${r.name_zh}/${r.name_ko}, ${r.era_period}) ===`);
    console.log(`title: ${r.title_zh}`);
    console.log(`body:`);
    console.log(r.body_zh ?? '(none)');
    console.log(`translation:`);
    console.log(r.translation_ko ?? '(none)');
    console.log(`commentary:`);
    console.log(r.commentary_ko ?? '(none)');
    console.log('');
  }
  console.log('---');
  console.log('');
}

await sql.end();
