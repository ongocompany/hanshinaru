// B 라운드 — 9 신규 시인 INSERT
// 사용:
//   node scripts/maintenance/insert_b_round_poets.mjs           (dry-run)
//   node scripts/maintenance/insert_b_round_poets.mjs --apply

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 5, prepare: false });

const POETS = [
  {
    name_zh: '金尙憲', name_ko: '김상헌',
    era_period: '조선 중기',
    life_birth: 1570, life_death: 1652, life_raw: '1570-1652',
    bio_ko: '호 청음(淸陰)·석실산인(石室山人), 자 숙도(叔度). 조선 중기 문신. 병자호란 척화파로 항복 문서를 찢고 통곡하여 심양에 6년 억류. 효종 즉위 후 좌의정. 시호 문정(文正). 문집 『청음전집』 40권.',
    country: 'KR',
  },
  {
    name_zh: '金馹孫', name_ko: '김일손',
    era_period: '조선 전기',
    life_birth: 1464, life_death: 1498, life_raw: '1464-1498',
    bio_ko: '호 탁영(濯纓), 자 계운(季雲). 점필재 김종직 문인. 생육신 이맹전·조려와 교유한 조선 전기 사림의 핵심. 1498년 무오사화로 능지처참. 단종 추모 시문 다수. 문집 『탁영집』.',
    country: 'KR',
  },
  {
    name_zh: '李公升', name_ko: '이공승',
    era_period: '고려 중기',
    life_birth: 1099, life_death: 1183, life_raw: '1099-1183',
    bio_ko: '자 달부(達夫), 본관 청주, 시호 문정(文貞). 고려 중기 문신·시인. 한림학사·중서시랑평장사 역임. 천관사(天官寺) 방문 시가 이인로 『파한집』에 수록. 의종이 그의 청렴함을 "가을달처럼 티 없다"고 칭송.',
    country: 'KR',
  },
  {
    name_zh: '李元絃', name_ko: '이원현',
    era_period: null,
    life_birth: null, life_death: null, life_raw: null,
    bio_ko: '한국 한문학 시인. 생몰·시대 미상. 시제에 작자명이 직접 노출된 패턴(「李元絃詩」)으로 외부 시집에 인용된 형태로만 확인됨. 향후 사료 발견 시 메타 보강 예정.',
    country: 'KR',
  },
  {
    name_zh: '崔匡裕', name_ko: '최광유',
    era_period: '신라 말',
    life_birth: null, life_death: null, life_raw: '?-?',
    bio_ko: '통일신라 말기 문인. 885년 당나라에 숙위학생으로 파견되어 빈공과 급제. 최치원·박인범과 함께 \'신라 10현\'으로 불림. 한시 「御溝」가 협주명현십초시(夾注名賢十抄詩)에 수록. 동문선에 칠언율시 10수 전함.',
    country: 'KR',
  },
  {
    name_zh: '曺偉', name_ko: '조위',
    era_period: '조선 전기',
    life_birth: 1454, life_death: 1503, life_raw: '1454-1503',
    bio_ko: '호 매계(梅溪), 자 태허(太虛), 본관 창녕. 조선 전기 문신·학자. 김종직 문인으로 초기 사림파를 대표. 무오사화(1498) 때 의주 유배, 국내 유배가사의 효시 「만분가(萬憤歌)」를 남김. 문집 『매계집』.',
    country: 'KR',
  },
  {
    name_zh: '朴元亨', name_ko: '박원형',
    era_period: '조선 전기',
    life_birth: 1411, life_death: 1469, life_raw: '1411-1469',
    bio_ko: '자 지구(之衢), 호 만절당(晩節堂), 본관 죽산, 시호 문헌(文憲). 조선 전기 문신. 세조 즉위 후 좌익공신 3등에 책록되고 영의정에 오름. 과문(科文)과 시문에 능했음.',
    country: 'KR',
  },
  {
    name_zh: '張鎰', name_ko: '장일',
    era_period: '고려 후기',
    life_birth: 1207, life_death: 1276, life_raw: '1207-1276',
    bio_ko: '자 이지(弛之), 시호 장간(章簡), 본관 창녕. 고려 중·후기 문신. 창녕 향리 출신으로 고종 때 과거 급제. 문한·대간직을 역임하며 몽골 황제에게 올리는 표문 작성과 대몽외교에 간여한 외교관·문인.',
    country: 'KR',
  },
  {
    name_zh: '李文和', name_ko: '이문화',
    era_period: '고려 말 조선 초',
    life_birth: 1358, life_death: 1414, life_raw: '1358-1414',
    bio_ko: '자 백중(伯中), 호 오천(烏川), 본관 인천, 시호 공도(恭度). 고려 말 조선 초 문신. 1380년 문과 장원. 예문관대제학·대사헌 등 요직 역임. 사후 영의정 추증.',
    country: 'KR',
  },
];

console.log(`# B 라운드 신규 시인 INSERT — ${POETS.length}명`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log('');

for (const p of POETS) {
  // 중복 검사
  const dup = await sql`SELECT id, name_zh, name_ko, poem_count FROM poets WHERE name_zh = ${p.name_zh}`;
  if (dup.length > 0) {
    console.log(`⚠️  ${p.name_zh}/${p.name_ko}: 이미 존재 (poet#${dup[0].id}, ${dup[0].poem_count}수). SKIP`);
    continue;
  }

  if (APPLY) {
    const inserted = await sql`
      INSERT INTO poets (name_zh, name_ko, era_period, life_birth, life_death, life_raw, bio_ko, country, poem_count)
      VALUES (${p.name_zh}, ${p.name_ko}, ${p.era_period}, ${p.life_birth}, ${p.life_death}, ${p.life_raw}, ${p.bio_ko}, ${p.country}, 0)
      RETURNING id, name_zh, name_ko
    `;
    console.log(`✅ INSERT poet#${inserted[0].id} ${inserted[0].name_zh}/${inserted[0].name_ko}`);
  } else {
    console.log(`(dry) INSERT ${p.name_zh}/${p.name_ko} era=${p.era_period} life=${p.life_raw}`);
    console.log(`     bio: ${p.bio_ko.slice(0, 80)}...`);
  }
}

if (!APPLY) console.log('\n--- DRY-RUN. --apply 추가 시 실행 ---');

await sql.end();
