// sonnet-subagent 30수 검수 후 MINOR 6건 학술 정확도 향상 정정
// 사용:
//   node scripts/maintenance/apply_sonnet30_minor_fixes.mjs           (dry-run)
//   node scripts/maintenance/apply_sonnet30_minor_fixes.mjs --apply   (DB UPDATE 실행)
//
// 정정 정책:
// - commentary_ko 본문에서 BEFORE 문자열을 AFTER로 정확히 교체 (substring replace)
// - quality 'sonnet-subagent' 그대로 유지 (검수·정정 흔적은 review_memo로 표시)
// - review_memo: '검수 후 MINOR 정정 (학술 정확도 향상)'
// - BEFORE가 commentary에 없으면 ABORT (안전 검사)

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
if (!dbUrl) throw new Error('HANSHINARU_DATABASE_URL not found in .env.local');

const sql = postgres(dbUrl, { max: 5, prepare: false });

const REVIEW_MEMO = '검수 후 MINOR 정정 (학술 정확도 향상)';

const FIXES = [
  {
    poem_id: 47326,
    title: '秋夜雨中',
    reason: '"가장 널리 알려진" 단독 단언 → 학계는 「題伽倻山」·「登潤州慈和寺」와 3대 대표작으로 병렬 기술',
    before: '최치원의 시 중 가장 널리 알려진 작품이다.',
    after: '최치원의 대표작 중 하나로 손꼽히는 작품이다.',
  },
  {
    poem_id: 47333,
    title: '留別西京金少尹',
    reason: '서경(西京)을 신라/고려 평양으로 오해할 여지 → 당나라 이경(二京) 체제에서 西京=長安임을 명기',
    before: '서경(西京)의 김소윤(金少尹)과 이별하며 지은 작품이다.',
    after: '서경(西京, 당나라의 도읍 장안)의 김소윤(金少尹)과 이별하며 지은 작품이다.',
  },
  {
    poem_id: 47342,
    title: '登潤州慈和寺上房',
    reason: '금릉·윤주 시문에서 謝氏는 사조(謝朓)를 가리키는 것이 일반적 (이백 「金陵城西樓月下吟」 등) → 사조 또는 사령운으로 열어둠',
    before: '사씨는 동진(東晋)의 시인 사령운(謝靈運)을 가리키며, 그의 문학적 유산이 이곳의 경치를 빛낸다는 뜻이다.',
    after: '사씨는 남조(南朝)의 시인 사조(謝朓) 또는 사령운(謝靈運)을 가리키는데, 금릉 일대 시문에서는 이백이 「金陵城西樓月下吟」 등에서 사조를 그리워한 전례가 있어 사조로 보는 것이 일반적이다.',
  },
  {
    poem_id: 47347,
    title: '和張進士村居病中見寄',
    reason: '가도(賈島)의 자는 浪仙·閬仙 두 표기가 통용 → 이표기와 생몰 명기',
    before: "'낭선(浪仙)'은 당나라 시인 가도(賈島)의 자(字)이고",
    after: "'낭선(浪仙)'은 당나라 시인 가도(賈島, 779-843)의 자(字, 閬仙으로도 표기)이고",
  },
  {
    poem_id: 47348,
    title: '泛海',
    reason: '장건승사(張騫乘槎) 전설은 황하 근원을 거슬러 오르다 은하수에 이른 것 (「博物志」 계열) → "은하수 근원"은 부정확',
    before: '한나라 장건(張騫)이 뗏목을 타고 은하수 근원을 찾았다는 전설',
    after: '한나라 장건(張騫)이 뗏목을 타고 황하 근원을 거슬러 오르다 은하수에 닿았다는 장건승사(張騫乘槎) 전설',
  },
  {
    poem_id: 47350,
    title: '姑蘇臺',
    reason: '고소대는 합려(闔閭) 초건, 부차(夫差) 증축이 정설 → 축조 주체 보완',
    before: '고소대는 춘추시대 오(吳)나라 왕 부차(夫差)가 서시(西施)와 향락을 즐겼다는 누대로',
    after: '고소대는 춘추시대 오(吳)나라 왕 합려(闔閭)가 처음 짓고 그 아들 부차(夫差)가 증축하여 서시(西施)와 함께 향락을 즐겼다는 누대로',
  },
];

console.log(`# sonnet-subagent MINOR 정정 — ${FIXES.length}건`);
console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log('');

let abort = false;

for (const fix of FIXES) {
  const rows = await sql`
    SELECT p.id, p.title_zh, p.commentary_ko, p.quality, p.review_memo,
           po.name_zh, po.name_ko
    FROM poems p
    JOIN poets po ON p.poet_id = po.id
    WHERE p.id = ${fix.poem_id}
  `;
  if (rows.length === 0) {
    console.log(`[poem#${fix.poem_id}] NOT FOUND — abort`);
    abort = true;
    continue;
  }
  const row = rows[0];
  const cur = row.commentary_ko ?? '';
  const has = cur.includes(fix.before);
  const idx = cur.indexOf(fix.before);

  console.log(`=== poem#${fix.poem_id} 「${row.title_zh}」 ${row.name_zh}(${row.name_ko}) [${row.quality}] ===`);
  console.log(`이유: ${fix.reason}`);
  console.log(`BEFORE 매치: ${has ? 'O' : 'X'} ${has ? `(idx=${idx})` : ''}`);
  if (!has) {
    console.log(`현재 commentary 첫 200자: ${cur.slice(0, 200)}…`);
    console.log(`찾는 BEFORE: ${fix.before}`);
    abort = true;
    console.log('');
    continue;
  }

  const next = cur.replace(fix.before, fix.after);
  if (next === cur) {
    console.log('REPLACE 결과 변화 없음 — abort');
    abort = true;
    console.log('');
    continue;
  }

  // 변경 부분 컨텍스트 출력 (앞뒤 30자)
  const ctxStart = Math.max(0, idx - 30);
  const beforeCtx = cur.slice(ctxStart, idx + fix.before.length + 30);
  const afterCtx = next.slice(ctxStart, ctxStart + (idx - ctxStart) + fix.after.length + 30);
  console.log(`길이 변화: ${cur.length} → ${next.length} (${next.length - cur.length >= 0 ? '+' : ''}${next.length - cur.length})`);
  console.log(`BEFORE ctx: …${beforeCtx.replace(/\n/g, ' ')}…`);
  console.log(`AFTER  ctx: …${afterCtx.replace(/\n/g, ' ')}…`);

  if (APPLY) {
    const updated = await sql`
      UPDATE poems
      SET commentary_ko = ${next},
          review_memo = ${REVIEW_MEMO}
      WHERE id = ${fix.poem_id}
        AND commentary_ko = ${cur}
    `;
    console.log(`UPDATE: ${updated.count} row`);
    if (updated.count !== 1) {
      console.log('⚠️ UPDATE row count 1 아님 — 수동 확인 필요');
      abort = true;
    }
  }
  console.log('');
}

if (abort) {
  console.log('⚠️ 일부 케이스 abort 또는 매치 실패. 위 로그 확인 후 수동 정정.');
}

if (!APPLY) {
  console.log('--- DRY-RUN. 실제 적용은 --apply 인자 추가 ---');
}

await sql.end();
