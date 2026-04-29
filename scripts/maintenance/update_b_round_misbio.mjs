// B 라운드 — 잘못 매핑됐던 7시인 row bio/메타 정리
// 사용:
//   node scripts/maintenance/update_b_round_misbio.mjs           (dry-run)
//   node scripts/maintenance/update_b_round_misbio.mjs --apply

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const UPDATES = [
  {
    id: 3365, name: '김창흡',
    fields: {
      bio_ko: '조선 후기의 문신·시인. 자 자익(子益), 호 삼연(三淵). 김수항(金壽恒)의 셋째 아들, 김창집·김창협의 동생. 산수 유람과 은일 시로 이름났고 『삼연집(三淵集)』이 전한다. 자동 색인의 한자 성씨 fuzzy 매칭 결함으로 김창협(22수)·김상헌(24수)·김일손(10수)의 시 56수가 잘못 매핑됐다가 본 라운드까지 분리됨.',
    },
  },
  {
    id: 3435, name: '이안눌',
    fields: {
      era_period: '조선 중기',
      life_birth: 1571, life_death: 1637, life_raw: '1571-1637',
      bio_ko: '자 자민(子敏), 호 동악(東岳), 본관 덕수. 조선 중기 문신·시인. 시문에 능하여 동악시단(東岳詩壇)의 좌장으로 평가됨. 권필·홍서봉 등과 교유했고 문집 『동악집』이 전한다. 자동 색인 결함으로 이공승(고려 중기)·이원현의 시 2수가 잘못 매핑됐다가 분리됨.',
    },
  },
  {
    id: 3326, name: '최경창',
    fields: {
      era_period: '조선 중기',
      life_birth: 1539, life_death: 1583, life_raw: '1539-1583',
      bio_ko: "자 가운(嘉雲), 호 고죽(孤竹), 본관 해주. 조선 중기 시인. 백광훈·이달과 함께 '삼당시인(三唐詩人)'으로 불리며 당시풍 한시로 이름남. 문집 『고죽유고』. 자동 색인 결함으로 최광유(신라 말)의 시 1수가 잘못 매핑됐다가 분리됨.",
    },
  },
  {
    id: 3366, name: '조식',
    fields: {
      era_period: '조선 중기',
      life_birth: 1501, life_death: 1572, life_raw: '1501-1572',
      bio_ko: '자 건중(楗仲), 호 남명(南冥), 본관 창녕. 조선 중기 성리학자. 이황과 더불어 영남학파의 양대 산맥. 평생 처사로서 출사하지 않고 후학을 양성. 사후 영의정 추증, 시호 문정(文貞). 문집 『남명집』. 자동 색인 결함으로 조위(梅溪)의 시 1수가 잘못 매핑됐다가 분리됨.',
    },
  },
  {
    id: 3432, name: '박효수',
    fields: {
      era_period: '고려 후기',
      life_birth: null, life_death: 1337, life_raw: '?-1337',
      bio_ko: '본관 죽산. 고려 후기 문신. 충숙왕·충혜왕 시기 활동. 시문에 능했고 동문선 등에 일부 시가 전한다. 자동 색인 결함으로 박원형(조선 전기)의 시 1수가 잘못 매핑됐다가 분리됨.',
    },
  },
  {
    id: 3451, name: '장현광',
    fields: {
      era_period: '조선 중기',
      life_birth: 1554, life_death: 1637, life_raw: '1554-1637',
      bio_ko: '자 덕회(德晦), 호 여헌(旅軒), 본관 인동. 조선 중기 성리학자. 이황 학통을 계승하면서도 독자적 우주론을 전개. 사후 영의정 추증, 시호 문강(文康). 문집 『여헌집』. 자동 색인 결함으로 장일(고려)의 시 1수가 잘못 매핑됐다가 분리됨.',
    },
  },
  {
    id: 3437, name: '이민구',
    fields: {
      era_period: '조선 중기',
      life_birth: 1589, life_death: 1670, life_raw: '1589-1670',
      bio_ko: '자 자시(子時), 호 동주(東洲), 본관 전주. 조선 중기 문신·문인. 인조반정 이후 관직 활동. 문장에 능했고 문집 『동주집』이 전한다. 자동 색인 결함으로 이문화(고려 말 조선 초)의 시 1수가 잘못 매핑됐다가 분리됨.',
    },
  },
];

console.log(`# B 라운드 잘못 매핑된 시인 row 정리 — ${UPDATES.length}명`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

for (const u of UPDATES) {
  const cur = await sql`SELECT id, name_zh, name_ko, poem_count, era_period, life_raw, bio_ko FROM poets WHERE id = ${u.id}`;
  if (cur.length === 0) { console.log(`❌ poet#${u.id} ${u.name}: 미존재`); continue; }
  const r = cur[0];
  console.log(`[poet#${r.id} ${r.name_zh}/${r.name_ko}] poem_count=${r.poem_count}`);
  for (const [k, v] of Object.entries(u.fields)) {
    const before = r[k];
    if (before === v) {
      console.log(`  ${k}: 변화 없음 (skip)`);
      continue;
    }
    const beforeStr = before == null ? '(null)' : String(before).slice(0, 60);
    const afterStr = v == null ? '(null)' : String(v).slice(0, 60);
    console.log(`  ${k}:`);
    console.log(`    BEFORE: ${beforeStr}${(before ?? '').length > 60 ? '…' : ''}`);
    console.log(`    AFTER:  ${afterStr}${(v ?? '').length > 60 ? '…' : ''}`);
  }

  if (APPLY) {
    // dynamic build: only fields that exist
    const f = u.fields;
    if ('era_period' in f) {
      await sql`UPDATE poets SET era_period = ${f.era_period} WHERE id = ${u.id}`;
    }
    if ('life_birth' in f) {
      await sql`UPDATE poets SET life_birth = ${f.life_birth} WHERE id = ${u.id}`;
    }
    if ('life_death' in f) {
      await sql`UPDATE poets SET life_death = ${f.life_death} WHERE id = ${u.id}`;
    }
    if ('life_raw' in f) {
      await sql`UPDATE poets SET life_raw = ${f.life_raw} WHERE id = ${u.id}`;
    }
    if ('bio_ko' in f) {
      await sql`UPDATE poets SET bio_ko = ${f.bio_ko} WHERE id = ${u.id}`;
    }
    console.log(`  ✅ UPDATED`);
  }
  console.log('');
}

if (!APPLY) console.log('--- DRY-RUN. --apply 추가 시 실행 ---');

await sql.end();
