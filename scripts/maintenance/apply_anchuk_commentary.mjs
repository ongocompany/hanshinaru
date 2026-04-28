// 5 chunks의 결과 JSONL을 읽어 jinas DB의 안축(3469) commentary_ko 갱신.
// 기본 dry-run. --apply 시 실제 UPDATE.

import postgres from 'postgres';
import { readFileSync, readdirSync, existsSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const QUALITY = 'opus-subagent-v2';
const REVIEW_MEMO_TAG = '근재집 127수 매핑 정정 (안중근→안축) + commentary 재생성';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

console.log(APPLY ? '== APPLY MODE ==' : '== DRY-RUN MODE ==');
console.log('');

const RESULTS_DIR = '/tmp/anchuk-translate/results';
if (!existsSync(RESULTS_DIR)) {
  console.error(`결과 디렉토리 없음: ${RESULTS_DIR}`);
  process.exit(1);
}

// 모든 chunk 결과 수집
const files = readdirSync(RESULTS_DIR).filter(f => f.match(/^chunk-\d+\.jsonl$/)).sort();
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
console.log('');

if (issues.length > 0) {
  console.log('--- 이슈 ---');
  issues.forEach(i => console.log('  ' + i));
  console.log('');
}

console.log(`총 commentary 항목: ${all.length}수`);

// 길이 분포
const lens = all.map(r => r.commentary_ko.length);
const min = Math.min(...lens), max = Math.max(...lens);
const avg = (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(0);
console.log(`길이: min=${min} max=${max} avg=${avg}`);
const tooShort = all.filter(r => r.commentary_ko.length < 150);
const tooLong = all.filter(r => r.commentary_ko.length > 400);
if (tooShort.length) console.log(`  ⚠️ 150자 미만: ${tooShort.length}수`);
if (tooLong.length) console.log(`  ⚠️ 400자 초과: ${tooLong.length}수`);

// 금지 표현 검사
const forbidden = [
  /안중근|安重根/, /근대(?!.*까지)/, /하얼빈/, /이토/, /순국/, /독립/,
  /옥중/, /의사\b/, /대한제국/, /1909|1910|1879/,
];
const violations = [];
for (const r of all) {
  for (const re of forbidden) {
    if (re.test(r.commentary_ko)) {
      violations.push({ id: r.id, pattern: re.toString(), snippet: r.commentary_ko.match(re)?.[0] });
      break;
    }
  }
}
console.log(`금지 표현 위반: ${violations.length}수`);
if (violations.length > 0) {
  violations.forEach(v => console.log(`  poem#${v.id}: ${v.pattern} → "${v.snippet}"`));
}

// 중복 id 검사
const ids = all.map(r => r.id);
const dupes = ids.filter((v, i, a) => a.indexOf(v) !== i);
if (dupes.length) console.log(`⚠️ 중복 id: ${dupes.join(', ')}`);

// DB 대상 id 검증 (poet#3469, 47671 제외)
const dbTargetRows = await sql`
  SELECT id FROM poems WHERE poet_id = 3469 AND id <> 47671 ORDER BY id`;
const dbIds = new Set(dbTargetRows.map(r => r.id));
const missing = [...dbIds].filter(id => !ids.includes(id));
const extra = ids.filter(id => !dbIds.has(id));
console.log(`DB 대상 vs 결과: 누락 ${missing.length}, 비대상 ${extra.length}`);
if (missing.length) console.log(`  누락 id: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
if (extra.length) console.log(`  비대상 id: ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? '...' : ''}`);

if (!APPLY) {
  console.log('');
  console.log('--apply 인자로 실행하면 UPDATE 실행 (commentary_ko, quality, review_memo 갱신).');
  await sql.end();
  process.exit(0);
}

if (violations.length > 0) {
  console.error('금지 표현 위반 있음. apply 중단.');
  await sql.end();
  process.exit(1);
}
if (missing.length > 0) {
  console.error('DB 대상 누락 있음. apply 중단.');
  await sql.end();
  process.exit(1);
}

console.log('');
console.log('UPDATE 실행 중...');
let updated = 0;
for (const r of all) {
  const result = await sql`
    UPDATE poems
    SET commentary_ko = ${r.commentary_ko},
        quality = ${QUALITY},
        review_memo = ${REVIEW_MEMO_TAG},
        reviewed_at = NOW()
    WHERE id = ${r.id}
    RETURNING id`;
  if (result.length === 1) updated++;
}
console.log(`UPDATE 완료: ${updated}/${all.length} row`);

await sql.end();
