// 6 swap candidates의 1:1 시제 매칭 + 신규 INSERT 필요 시인 확인
// + 의심 케이스 (임윤지당/박제가/이건창)의 시제가 색인 어디에 있는지 검색

import postgres from 'postgres';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

const INDEX_FILE = 'docs/handoff/2026-04-26-automatic-collection-final-index.md';
const indexContent = readFileSync(INDEX_FILE, 'utf8');

// 작품 제목 색인 섹션 파싱
function extractTitlesFromSection(zhName) {
  const sectionRegex = new RegExp(`### .+ \\(${zhName}\\)([\\s\\S]+?)(?:\\n### |$)`);
  const m = indexContent.match(sectionRegex);
  if (!m) return null;
  const directLine = m[1].match(/- direct \d+건: (.+)/);
  if (!directLine) return [];
  return directLine[1].split(',').map(s => s.trim()).filter(Boolean);
}

const SWAP_TARGETS = [
  { from: 3412, fromName: '강위/姜瑋', toZh: '姜靜一堂', toName_ko: '강정일당' },
  { from: 3323, fromName: '신사임당/申師任堂', toZh: '申叔舟', toName_ko: '신숙주' },
  { from: 3332, fromName: '정인보/鄭寅普', toZh: '鄭敍', toName_ko: '정서' },
  { from: 3381, fromName: '허목/許穆', toZh: '金時習', toName_ko: '김시습' },
  { from: 3367, fromName: '이현보/李賢輔', toZh: '李荇', toName_ko: '이행' },
  { from: 3365, fromName: '김창흡/金昌翕', toZh: '金昌協', toName_ko: '김창협' },
];

console.log('=== Swap 매칭 검증 ===\n');
for (const t of SWAP_TARGETS) {
  const dbPoems = await sql`SELECT id, title_zh FROM poems WHERE poet_id = ${t.from} ORDER BY id`;
  const indexTitles = extractTitlesFromSection(t.toZh);

  const indexSet = new Set(indexTitles);
  const matched = dbPoems.filter(p => indexSet.has(p.title_zh));
  const unmatched = dbPoems.filter(p => !indexSet.has(p.title_zh));

  console.log(`[poet#${t.from} ${t.fromName} → ${t.toZh}/${t.toName_ko}]`);
  console.log(`  DB 시: ${dbPoems.length}수`);
  console.log(`  색인 ${t.toZh} 시제: ${indexTitles?.length ?? 'NOT FOUND'}건`);
  console.log(`  매칭: ${matched.length}/${dbPoems.length}`);
  if (unmatched.length && unmatched.length <= 30) {
    console.log(`  미매칭 (${unmatched.length}): ${unmatched.map(p => `#${p.id} 「${p.title_zh.slice(0, 30)}」`).join(', ')}`);
  } else if (unmatched.length > 30) {
    console.log(`  미매칭 ${unmatched.length}수 (생략)`);
  }
  console.log('');
}

// 신규 INSERT 필요 시인 확인 (이미 있는지 체크)
console.log('=== 신규 INSERT 필요 시인 (이미 DB에 있는지 확인) ===\n');
const candidates = ['姜靜一堂', '申叔舟', '鄭敍', '金時習', '金昌協', '李荇'];
for (const zh of candidates) {
  const rows = await sql`SELECT id, name_zh, name_ko, poem_count FROM poets WHERE name_zh = ${zh}`;
  if (rows.length === 0) {
    console.log(`  ❌ ${zh} : 미존재 (INSERT 필요)`);
  } else {
    rows.forEach(r => console.log(`  ✅ ${zh}/${r.name_ko ?? '?'} : poet#${r.id} (${r.poem_count}수)`));
  }
}

// 의심 케이스 시제 검색
console.log('\n=== 의심 케이스 시제 검색 (어떤 시인 섹션에 있나) ===\n');
const SUSPECT_TITLES = [
  { from: 3338, fromName: '임윤지당', titles: ['留別金璿', '茶店晝睡'] },
  { from: 3328, fromName: '박제가', titles: ['涇州龍朔寺閣兼柬雲栖上人'] },
  { from: 3345, fromName: '이건창', titles: ['雞林府公館西樓詩序 中詩'] },
];
for (const s of SUSPECT_TITLES) {
  console.log(`[poet#${s.from} ${s.fromName}]`);
  for (const title of s.titles) {
    // index에서 이 title이 어떤 시인 섹션에 있는지
    const lines = indexContent.split('\n');
    let currentPoet = null;
    const found = [];
    for (const line of lines) {
      const sec = line.match(/^### (.+) \((.+)\)$/);
      if (sec) currentPoet = `${sec[1]}/${sec[2]}`;
      if (currentPoet && line.includes(title)) found.push(currentPoet);
    }
    console.log(`  「${title}」: ${found.length ? [...new Set(found)].join(', ') : '색인 없음'}`);
  }
}

await sql.end();
