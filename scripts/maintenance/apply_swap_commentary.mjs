// 5 chunks 결과 JSONL → jinas DB의 9 시인 commentary_ko 갱신
// 각 시인별 금지 표현 검사 + 길이 검증 + apply

import postgres from 'postgres';
import { readFileSync, readdirSync, existsSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const QUALITY = 'opus-subagent-v2';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

console.log(APPLY ? '== APPLY MODE ==' : '== DRY-RUN MODE ==');
console.log('');

const RESULTS_DIR = '/tmp/swap-commentary/results';
if (!existsSync(RESULTS_DIR)) {
  console.error(`결과 디렉토리 없음: ${RESULTS_DIR}`);
  process.exit(1);
}

// 시인별 금지 표현 (chunk별 금지)
const FORBIDDEN_BY_POET = {
  3470: { name: '강정일당', patterns: [/강위\b|姜瑋/, /추금\b|秋琴/, /개화/, /사행/, /청나라 사행/, /일본 사행/, /개화파/, /1820|1884/] },
  3471: { name: '신숙주', patterns: [/신사임당|申師任堂/, /사임당/, /율곡|李珥/, /초충도/, /자수\b/, /1504|1551/] },
  3472: { name: '정서', patterns: [/정인보|鄭寅普/, /위당/, /양명학/, /1893|1950/, /근대 학자/] },
  3473: { name: '임춘', patterns: [/임윤지당|任允摯堂/, /윤지당/, /성리학자/, /1721|1793/] },
  3474: { name: '박인범', patterns: [/박제가|朴齊家/, /초정/, /북학/, /연행/, /1750|1805/] },
  3475: { name: '이곡', patterns: [/이건창|李建昌/, /영재/, /양명학/, /1852|1898/] },
  3476: { name: '이행', patterns: [/이현보|李賢輔/, /농암|聾巖/, /설빈옹/, /漁父歌|어부가/, /안동/, /영천/, /분천/, /강호가도/, /1467|1555/] },
  3477: { name: '김창협', patterns: [/삼연|三淵/, /三淵集/, /1653|1722/] },
  3478: { name: '허봉', patterns: [/허목|許穆/, /미수|眉叟/, /記言/, /1595|1682/, /남인/] },
};

// chunk 파일 → poet_id 추정 위해 DB 매칭
const idToPoetCache = new Map();
async function getPoetId(poemId) {
  if (idToPoetCache.has(poemId)) return idToPoetCache.get(poemId);
  const [r] = await sql`SELECT poet_id FROM poems WHERE id = ${poemId}`;
  idToPoetCache.set(poemId, r?.poet_id);
  return r?.poet_id;
}

const files = readdirSync(RESULTS_DIR).filter(f => f.endsWith('.jsonl')).sort();
console.log(`결과 파일: ${files.length}개`);

const all = [];
const issues = [];
for (const file of files) {
  const content = readFileSync(`${RESULTS_DIR}/${file}`, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  let parsed = 0, skipped = 0;
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (typeof obj.id !== 'number' || typeof obj.commentary_ko !== 'string') {
        skipped++;
        issues.push(`${file}: invalid line ${JSON.stringify(obj).slice(0, 80)}`);
        continue;
      }
      all.push(obj);
      parsed++;
    } catch (e) {
      skipped++;
      issues.push(`${file}: parse error ${line.slice(0, 80)}`);
    }
  }
  console.log(`  ${file}: ${parsed} parsed, ${skipped} skipped`);
}

if (issues.length > 0) {
  console.log('\n--- 이슈 ---');
  issues.forEach(i => console.log('  ' + i));
}

console.log('');
console.log(`총 commentary 항목: ${all.length}수`);

// 길이
const lens = all.map(r => r.commentary_ko.length);
const min = Math.min(...lens), max = Math.max(...lens);
const avg = (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(0);
console.log(`길이: min=${min} max=${max} avg=${avg}`);
const tooShort = all.filter(r => r.commentary_ko.length < 150);
const tooLong = all.filter(r => r.commentary_ko.length > 400);
if (tooShort.length) console.log(`  ⚠️ 150자 미만: ${tooShort.length}수 — ${tooShort.slice(0,5).map(r=>'#'+r.id).join(',')}`);
if (tooLong.length) console.log(`  ⚠️ 400자 초과: ${tooLong.length}수 — ${tooLong.slice(0,5).map(r=>'#'+r.id).join(',')}`);

// 금지 표현 검사 (시인별)
console.log('\n금지 표현 검사 (시인별):');
const violations = [];
for (const r of all) {
  const pid = await getPoetId(r.id);
  const rules = FORBIDDEN_BY_POET[pid];
  if (!rules) continue;
  for (const re of rules.patterns) {
    if (re.test(r.commentary_ko)) {
      violations.push({ id: r.id, poet_id: pid, poet_name: rules.name, pattern: re.toString(), snippet: r.commentary_ko.match(re)?.[0] });
      break;
    }
  }
}
console.log(`  위반 row: ${violations.length}수`);
if (violations.length > 0) {
  violations.forEach(v => console.log(`    poem#${v.id} (${v.poet_name}#${v.poet_id}): ${v.pattern} → "${v.snippet}"`));
}

// 중복/누락/extra
const ids = all.map(r => r.id);
const dupes = ids.filter((v, i, a) => a.indexOf(v) !== i);
if (dupes.length) console.log(`⚠️ 중복 id: ${dupes.join(', ')}`);

const NEW_POET_IDS = [3470, 3471, 3472, 3473, 3474, 3475, 3476, 3477, 3478];
const dbTargetRows = await sql`SELECT id FROM poems WHERE poet_id = ANY(${NEW_POET_IDS}) ORDER BY id`;
const dbIds = new Set(dbTargetRows.map(r => r.id));
const missing = [...dbIds].filter(id => !ids.includes(id));
const extra = ids.filter(id => !dbIds.has(id));
console.log(`\nDB 대상 ${dbIds.size}수 vs 결과 ${ids.length}수: 누락 ${missing.length}, 비대상 ${extra.length}`);
if (missing.length) console.log(`  누락 id: ${missing.slice(0, 10).join(', ')}`);
if (extra.length) console.log(`  비대상 id: ${extra.slice(0, 10).join(', ')}`);

if (!APPLY) {
  console.log('\n--apply 인자로 실제 UPDATE 실행 (commentary_ko, quality, review_memo, reviewed_at).');
  await sql.end();
  process.exit(0);
}

if (violations.length > 0) {
  console.error('금지 표현 위반 있음. apply 중단.');
  await sql.end();
  process.exit(1);
}
if (missing.length > 0) {
  console.error('누락 있음. apply 중단.');
  await sql.end();
  process.exit(1);
}

console.log('\nUPDATE 실행 중...');
let updated = 0;
for (const r of all) {
  const pid = await getPoetId(r.id);
  const poetName = FORBIDDEN_BY_POET[pid]?.name ?? `poet#${pid}`;
  const memo = `한자 성씨 swap 정정 → ${poetName} + commentary 재생성`;
  const result = await sql`
    UPDATE poems
    SET commentary_ko = ${r.commentary_ko},
        quality = ${QUALITY},
        review_memo = ${memo},
        reviewed_at = NOW()
    WHERE id = ${r.id}
    RETURNING id`;
  if (result.length === 1) updated++;
}
console.log(`UPDATE 완료: ${updated}/${all.length} row`);

await sql.end();
