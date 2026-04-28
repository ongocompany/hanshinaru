// 9 swap 매핑 정정 (120 row) + 잘못 매핑된 시인 row 정리
// 도은집/근재집과 동일 패턴

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const env = readFileSync('.env.local','utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

// 매핑 정정 매트릭스
const REMAPS = [
  { from: 3412, fromName: '강위', to: 3470, toName: '강정일당', label: '靜一堂遺稿', mode: 'all' },
  { from: 3323, fromName: '신사임당', to: 3471, toName: '신숙주', label: '保閑齋集', mode: 'all' },
  { from: 3332, fromName: '정인보', to: 3472, toName: '정서', label: '鄭瓜亭+題墨竹後', mode: 'all' },
  { from: 3338, fromName: '임윤지당', to: 3473, toName: '임춘', label: '西河集', mode: 'all' },
  { from: 3328, fromName: '박제가', to: 3474, toName: '박인범', label: '涇州龍朔寺閣', mode: 'all' },
  { from: 3345, fromName: '이건창', to: 3475, toName: '이곡', label: '稼亭集 雞林府', mode: 'all' },
  { from: 3367, fromName: '이현보', to: 3476, toName: '이행', label: '容齋集', mode: 'ids', ids: [48257,48258,48259,48260,48261,48262,48263,48264,48265,48266,48267,48268,48269,48270,48271,48272,48273,48274,48275,48276,48277,48278,48279,48280] },
  { from: 3365, fromName: '김창흡', to: 3477, toName: '김창협', label: '農巖集', mode: 'ids', ids: [48055,48056,48057,48058,48059,48060,48061,48062,48063,48064,48065,48066,48067,48068,48069,48070,48071,48072,48073,48074,48075,48076] },
  { from: 3381, fromName: '허목', to: 3478, toName: '허봉', label: '荷谷先生集 詩鈔', mode: 'all' },
];

// 잘못 매핑된 시인 row 정리 (life/bio 정확화 + poem_count 조정)
const CLEANUPS = [
  { id: 3412, name_zh: '姜瑋', name_ko: '강위', life_birth: 1820, life_death: 1884, era_period: '근대 전환기',
    bio_ko: '개화기 한문학자·시인. 자 위옥(韋玉), 호 추금(秋琴). 김정희·정원용 문하. 청나라 사행과 일본 사행을 다녀와 개화에 영향을 끼쳤다. 「秋琴集」 등이 전한다. 본 DB의 옛 매핑은 강정일당(姜靜一堂)과 한자 성씨 혼동으로 발생했으며, 정정으로 0수가 되었다.' },
  { id: 3323, name_zh: '申師任堂', name_ko: '신사임당', life_birth: 1504, life_death: 1551, era_period: '조선 중기',
    bio_ko: '조선 중기의 여성 화가·시인. 본명 신인선(申仁善), 호 사임당(師任堂). 율곡 이이(李珥)의 모친. 그림·서예·자수에 뛰어났고 「초충도(草蟲圖)」가 대표작. 한시·산문도 남겼으나 본 DB에는 진짜 사임당의 시문이 아직 미적재 — 이전 매핑은 신숙주(申叔舟)와 한자 성씨 혼동의 결과로, 본 정정으로 0수가 되었다.' },
  { id: 3332, name_zh: '鄭寅普', name_ko: '정인보', life_birth: 1893, life_death: 1950, era_period: '근대',
    bio_ko: '근대 양명학자·국학자. 자 경업(經業), 호 위당(爲堂). 「조선사연구」, 「양명학연론」 등 한국학·민족학의 토대를 다진 학자. 본 DB에는 진짜 정인보의 시문이 아직 미적재 — 이전 매핑은 정서(鄭敍, 「鄭瓜亭」 작자)와 한자 성씨 혼동의 결과.' },
  { id: 3338, name_zh: '任允摯堂', name_ko: '임윤지당', life_birth: 1721, life_death: 1793, era_period: '조선 후기',
    bio_ko: '조선 후기 여성 성리학자. 호 윤지당(允摯堂). 산문 위주의 성리학설을 다수 남기고 「允摯堂遺稿」가 전한다. 본 DB에는 진짜 윤지당의 시문이 아직 미적재 — 이전 매핑은 임춘(林椿, 죽림고회)과 任/林 한자 시각적 유사로 인한 혼동의 결과.' },
  { id: 3328, name_zh: '朴齊家', name_ko: '박제가', life_birth: 1750, life_death: 1805, era_period: '조선 후기',
    bio_ko: '조선 후기 북학파 문인. 자 차수(次修), 호 초정(楚亭)·정유(貞蕤). 「北學議」, 「貞蕤集」을 남기고 청나라 사행 4회. 본 DB에는 진짜 박제가의 시문이 아직 미적재 — 이전 매핑은 박인범(朴仁範, 신라 말)과 한자 성씨 혼동의 결과.' },
  { id: 3345, name_zh: '李建昌', name_ko: '이건창', life_birth: 1852, life_death: 1898, era_period: '근대 전환기',
    bio_ko: '근대 양명학자·문인. 자 봉조(鳳藻), 호 영재(寧齋). 「黨議通略」, 「明美堂集」 등을 남겼다. 본 DB에는 진짜 이건창의 시문이 아직 미적재 — 이전 매핑은 이곡(李穀, 가정집)과 한자 성씨 혼동의 결과.' },
  { id: 3367, name_zh: '李賢輔', name_ko: '이현보', life_birth: 1467, life_death: 1555, era_period: '조선 전기',
    bio_ko: '조선 전기의 문신·문인. 자 비중(棐仲), 호 농암(聾巖)·설빈옹(雪鬢翁). 「漁父歌」 개작으로 강호가도(江湖歌道)의 효시. 「聾巖集」이 전한다. 영천·안동을 중심으로 활동.' },
  { id: 3365, name_zh: '金昌翕', name_ko: '김창흡', life_birth: 1653, life_death: 1722, era_period: '조선 후기',
    bio_ko: '조선 후기의 문신·시인. 자 자익(子益), 호 삼연(三淵). 김수항(金壽恒)의 셋째 아들, 김창집(金昌集)·김창협(金昌協)의 동생. 산수 유람과 은일 시로 이름났고 「三淵集」이 전한다.' },
  { id: 3381, name_zh: '許穆', name_ko: '허목', life_birth: 1595, life_death: 1682, era_period: '조선 중기',
    bio_ko: '조선 중기의 문신·학자. 자 화보(和甫)·문보(文父), 호 미수(眉叟). 남인의 영수 중 한 사람. 의고체 산문으로 알려진 「記言」이 대표 저작. 본 DB에는 진짜 허목의 시문이 아직 미적재 — 이전 매핑은 허봉(許篈, 荷谷)과 한자 성씨 동일 + 시대 인접으로 인한 혼동의 결과.' },
];

console.log(APPLY ? '== APPLY MODE ==' : '== DRY-RUN MODE ==');
console.log('');

// PHASE 1: 매핑 정정 (120 row)
console.log('## PHASE 1 — 매핑 정정');
let totalRemapped = 0;
for (const r of REMAPS) {
  const beforeFrom = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${r.from}`;
  const beforeTo = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${r.to}`;
  let candidates;
  if (r.mode === 'all') {
    candidates = await sql`SELECT id FROM poems WHERE poet_id = ${r.from}`;
  } else {
    candidates = await sql`SELECT id FROM poems WHERE poet_id = ${r.from} AND id = ANY(${r.ids})`;
  }
  console.log(`  [${r.fromName}#${r.from} → ${r.toName}#${r.to}] (${r.label}) 대상 ${candidates.length}수`);
  if (APPLY && candidates.length > 0) {
    const memo = `한자 성씨 swap 정정 (${r.fromName}→${r.toName}, ${r.label})`;
    if (r.mode === 'all') {
      await sql`UPDATE poems SET poet_id = ${r.to}, review_memo = ${memo} WHERE poet_id = ${r.from}`;
    } else {
      await sql`UPDATE poems SET poet_id = ${r.to}, review_memo = ${memo} WHERE poet_id = ${r.from} AND id = ANY(${r.ids})`;
    }
    const afterFrom = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${r.from}`;
    const afterTo = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${r.to}`;
    console.log(`    ✓ from ${beforeFrom[0].n}→${afterFrom[0].n}, to ${beforeTo[0].n}→${afterTo[0].n}`);
    totalRemapped += candidates.length;
  }
}
console.log(`총 ${APPLY ? '실행' : '예정'} 매핑 변경: ${APPLY ? totalRemapped : REMAPS.reduce((s,r) => s + (r.mode === 'all' ? '?' : r.ids.length), 0)} row`);

// PHASE 2: poet row cleanup
console.log('\n## PHASE 2 — 잘못 매핑된 시인 row 정리');
for (const c of CLEANUPS) {
  const actual = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${c.id}`;
  console.log(`  poet#${c.id} ${c.name_zh}/${c.name_ko}: 실제 ${actual[0].n}수, era→${c.era_period}, life→${c.life_birth}-${c.life_death}`);
  if (APPLY) {
    const lifeRaw = `${c.life_birth}-${c.life_death}`;
    await sql`UPDATE poets SET
      poem_count = ${actual[0].n},
      life_birth = ${c.life_birth},
      life_death = ${c.life_death},
      life_raw = ${lifeRaw},
      era_period = ${c.era_period},
      bio_ko = ${c.bio_ko}
      WHERE id = ${c.id}`;
  }
}

// PHASE 3: 신규 시인의 poem_count 동기화
console.log('\n## PHASE 3 — 신규 시인 poem_count 동기화');
const NEW_IDS = [3470, 3471, 3472, 3473, 3474, 3475, 3476, 3477, 3478];
for (const id of NEW_IDS) {
  const actual = await sql`SELECT COUNT(*)::int AS n FROM poems WHERE poet_id = ${id}`;
  const [p] = await sql`SELECT name_zh, name_ko, poem_count FROM poets WHERE id = ${id}`;
  console.log(`  poet#${id} ${p.name_zh}/${p.name_ko}: 실제 ${actual[0].n}수 (current poem_count=${p.poem_count})`);
  if (APPLY && actual[0].n !== p.poem_count) {
    await sql`UPDATE poets SET poem_count = ${actual[0].n} WHERE id = ${id}`;
  }
}

await sql.end();
