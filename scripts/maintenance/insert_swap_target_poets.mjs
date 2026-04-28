// 9 신규 시인 INSERT (한자 성씨 swap 정정 대상)
// 기본 dry-run, --apply 로 실제 INSERT

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const env = readFileSync('.env.local','utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

const NEW_POETS = [
  {
    name_zh: '姜靜一堂', name_ko: '강정일당', life_birth: 1772, life_death: 1832,
    era_period: '조선 후기',
    bio_ko: '조선 후기의 여성 성리학자. 호 정일당(靜一堂). 사가에서 학문을 닦고 시·문·성리학을 펼친 대표적 여성 학자. 부군 윤광연(尹光演, 호 坦園)을 대신해 시문을 짓기도 했다. 「靜一堂遺稿」가 전한다.',
  },
  {
    name_zh: '申叔舟', name_ko: '신숙주', life_birth: 1417, life_death: 1475,
    era_period: '조선 전기',
    bio_ko: '조선 전기의 문신·학자. 자 범옹(泛翁), 호 보한재(保閑齋). 세종 시기 집현전 학사로 훈민정음 해례에 참여하고 「東國正韻」 편찬을 주도. 세조 즉위에 참여하여 6대 왕(세종~성종)을 섬기며 영의정에 이름. 「保閑齋集」이 전한다.',
  },
  {
    name_zh: '鄭敍', name_ko: '정서', life_birth: null, life_death: null,
    era_period: '고려',
    bio_ko: '고려 인종~의종 시기 문신·시인. 호 과정(瓜亭). 의종의 외척과 갈등으로 동래에 유배. 유배지에서 임금을 그리며 한문 가요 「鄭瓜亭(정과정곡)」을 지어 한국 가사문학의 효시로 꼽힌다.',
  },
  {
    name_zh: '林椿', name_ko: '임춘', life_birth: null, life_death: null,
    era_period: '고려 중기',
    bio_ko: '고려 무신정권기 문인. 자 기지(耆之), 호 西河. 무신난(1170)으로 가문 몰락 후 평생 빈한·방랑. 죽림고회(竹林高會) 7현의 한 명. 한문 가전체 「국순전(麴醇傳)」, 시집 「西河集」을 남겼다.',
  },
  {
    name_zh: '朴仁範', name_ko: '박인범', life_birth: null, life_death: null,
    era_period: '신라 말',
    bio_ko: '신라 말 문인. 당나라 빈공과(賓貢科) 급제 후 신라로 귀국, 한림학사·수찬 역임. 「涇州龍朔寺閣兼柬雲栖上人」 등 칠언율시로 격조 높은 시작을 남겨 최치원과 함께 신라 말 문풍을 일으켰다.',
  },
  {
    name_zh: '李穀', name_ko: '이곡', life_birth: 1298, life_death: 1351,
    era_period: '고려 후기',
    bio_ko: '고려 후기의 문신·문인. 자 중부(仲父), 호 가정(稼亭). 이색(李穡)의 부친. 원의 제과(制科) 합격 후 원·고려 양조에서 관직. 「稼亭集」이 전하며 원·고려 사행시·논문 다수. 안축(安軸)·이제현(李齊賢) 등과 동시대 활동.',
  },
  {
    name_zh: '李荇', name_ko: '이행', life_birth: 1478, life_death: 1534,
    era_period: '조선 전기',
    bio_ko: '조선 전기 문신·문인. 자 택지(擇之), 호 용재(容齋). 갑자사화(1504)로 충주에 유배. 중종반정 후 복귀해 좌찬성·대제학 역임. 「容齋集」이 전한다. 박상(朴祥) 등과 함께 조선 한시의 황금기를 이끈 사대부.',
  },
  {
    name_zh: '金昌協', name_ko: '김창협', life_birth: 1651, life_death: 1708,
    era_period: '조선 후기',
    bio_ko: '조선 후기 문신·학자. 자 중화(仲和), 호 농암(農巖). 김수항(金壽恒)의 차남. 김창집(金昌集)의 동생, 김창흡(金昌翕)의 형. 1675년 부친 귀양길 동행. 청풍(淸風)·영평(永平) 농암에 은거. 「農巖集」이 전한다. 사림 산림학파의 지도자.',
  },
  {
    name_zh: '許篈', name_ko: '허봉', life_birth: 1551, life_death: 1588,
    era_period: '조선 중기',
    bio_ko: '조선 중기 문신·문인. 자 미숙(美叔), 호 하곡(荷谷). 허엽(許曄)의 차남, 허균(許筠)의 형, 허난설헌(許蘭雪軒)의 오빠. 율곡 비판 글로 종성에 유배. 후에 강원도 춘천·황해도 일대를 방랑. 「荷谷先生集」이 전한다.',
  },
];

console.log(APPLY ? '== APPLY MODE ==' : '== DRY-RUN MODE ==');
console.log('');

const inserted = {};
for (const p of NEW_POETS) {
  const existing = await sql`SELECT id FROM poets WHERE name_zh = ${p.name_zh}`;
  if (existing.length > 0) {
    console.log(`  [skip ] ${p.name_zh}/${p.name_ko} 이미 존재 poet#${existing[0].id}`);
    inserted[p.name_zh] = existing[0].id;
    continue;
  }
  if (APPLY) {
    const lifeRaw = (p.life_birth || p.life_death)
      ? `${p.life_birth ?? '?'}-${p.life_death ?? '?'}`
      : null;
    const result = await sql`
      INSERT INTO poets
        (name_zh, name_ko, life_birth, life_death, life_raw, era_period, country, bio_ko, poem_count)
      VALUES
        (${p.name_zh}, ${p.name_ko}, ${p.life_birth}, ${p.life_death}, ${lifeRaw},
         ${p.era_period}, 'KR', ${p.bio_ko}, 0)
      RETURNING id`;
    inserted[p.name_zh] = result[0].id;
    console.log(`  [insert] ${p.name_zh}/${p.name_ko} → poet#${result[0].id}`);
  } else {
    console.log(`  [would insert] ${p.name_zh}/${p.name_ko} (life=${p.life_birth}~${p.life_death}, era=${p.era_period})`);
  }
}

if (APPLY) {
  console.log('');
  console.log('=== INSERT 결과 (json) ===');
  console.log(JSON.stringify(inserted, null, 2));
}

await sql.end();
