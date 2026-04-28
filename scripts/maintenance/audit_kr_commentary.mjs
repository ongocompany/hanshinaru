// E. KR commentary 잔여 hallucination 검수 — 패턴 카운트
// 일회성 진단 스크립트. 작업 후 정리(archive 또는 삭제).
//
// 사용: node audit_kr_commentary.mjs [--samples=N] [--pattern=label]
//   - 인자 없으면 전체 패턴 카운트만
//   - --samples=N 이면 각 패턴별 처음 N건의 시 ID/제목/시인/매치 부분 출력

import postgres from 'postgres';
import { readFileSync } from 'fs';

const argv = process.argv.slice(2);
const sampleArg = argv.find(a => a.startsWith('--samples='));
const SAMPLES = sampleArg ? parseInt(sampleArg.split('=')[1], 10) : 0;
const patternArg = argv.find(a => a.startsWith('--pattern='));
const ONLY_LABEL = patternArg ? patternArg.split('=')[1] : null;

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
if (!dbUrl) throw new Error('HANSHINARU_DATABASE_URL not found in .env.local');

const sql = postgres(dbUrl, { max: 5, prepare: false });

const PATTERNS = {
  // 1. CRITICAL — 도은집 정정 잔재 (0건이어야 함)
  '[critical] 이언진': /이언진|李彦瑱/,
  '[critical] 송목관': /송목관|松穆館/,
  '[critical] 통신사': /통신사/,
  '[critical] 역관': /\b역관\b|역관(?:으|이|을|의|들|들이|들을)/,
  '[critical] 우상(虞裳)': /虞裳|\b우상\b/,
  '[critical] 연도 1763': /1763/,

  // 2. 과장/판박이 표현
  '[hype] 명편': /명편/,
  '[hype] 걸작': /걸작/,
  '[hype] 백미': /백미/,
  '[hype] 정수': /정수/,
  '[hype] 정점': /정점/,
  '[hype] 지대한': /지대한/,
  '[hype] 훌륭한': /훌륭한/,
  '[hype] 명작': /명작/,

  // 3. 인물 인용 (사실 검증 후보)
  '[ref] 이백/李白': /이백|李白/,
  '[ref] 두보/杜甫': /두보|杜甫/,
  '[ref] 도연명/陶淵明': /도연명|陶淵明/,
  '[ref] 소식/소동파': /소식\(蘇軾\)|蘇軾|소동파|蘇東坡/,
  '[ref] 왕유/王維': /왕유|王維/,
  '[ref] 백거이/白居易': /백거이|白居易/,
  '[ref] 이하/李賀': /이하\(李賀\)|李賀/,
  '[ref] 한유/韓愈': /한유\(韓愈\)|韓愈/,
  '[ref] 굴원/屈原': /굴원|屈原/,

  // 4. 시집/문집 인용 패턴
  '[col] 『..集』': /『[^』]*集』/,
  '[col] 「..集」': /「[^」]*集」/,

  // 5. 4자리 연도 (검증 후보)
  '[year] 4자리 연도': /\b(?:1[0-9]{3}|20[0-2][0-9])\b/,

  // 6. 본받/영향
  '[infl] 본받/영향': /본받|영향을 받|모방하/,

  // 7. 사행
  '[diplo] 사행': /사행/,
};

const rows = await sql`
  SELECT p.id, p.title_zh, p.commentary_ko, p.quality, p.review_memo,
         po.id as poet_id, po.name_zh, po.name_ko, po.era_period
  FROM poems p
  JOIN poets po ON p.poet_id = po.id
  WHERE po.country = 'KR'
    AND p.commentary_ko IS NOT NULL
    AND p.commentary_ko <> ''
  ORDER BY p.id
`;

console.log(`KR commentary 보유: ${rows.length}수`);
console.log('');

// quality 분포
console.log('quality 분포:');
const qDist = {};
rows.forEach(r => {
  const k = r.quality ?? '(null)';
  qDist[k] = (qDist[k] ?? 0) + 1;
});
Object.entries(qDist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([q, n]) => console.log(`  ${q.padEnd(22)} ${n}수`));
console.log('');

// 패턴별 매치 카운트
console.log('패턴별 매치 수:');
console.log('-'.repeat(50));
const matchMap = {};
for (const [label, regex] of Object.entries(PATTERNS)) {
  if (ONLY_LABEL && !label.includes(ONLY_LABEL)) continue;
  const matched = rows.filter(r => regex.test(r.commentary_ko));
  matchMap[label] = matched;
  console.log(`  ${label.padEnd(28)} ${String(matched.length).padStart(5)}수`);
}
console.log('');

// 샘플 출력
if (SAMPLES > 0) {
  console.log('=== 샘플 ===');
  for (const [label, matched] of Object.entries(matchMap)) {
    if (matched.length === 0) continue;
    console.log('');
    console.log(`[${label}] (${matched.length}수 중 ${Math.min(SAMPLES, matched.length)}건 샘플)`);
    const regex = PATTERNS[label];
    matched.slice(0, SAMPLES).forEach(r => {
      const m = r.commentary_ko.match(regex);
      const idx = m ? r.commentary_ko.indexOf(m[0]) : -1;
      const snippet = idx >= 0
        ? '…' + r.commentary_ko.slice(Math.max(0, idx - 25), Math.min(r.commentary_ko.length, idx + 60)) + '…'
        : '';
      console.log(`  poem#${r.id} ${r.name_zh}「${r.title_zh}」 [${r.quality}]`);
      console.log(`    ${snippet.replace(/\n/g, ' ')}`);
    });
  }
}

await sql.end();
