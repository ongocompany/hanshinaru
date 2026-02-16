/**
 * 평수운(平水韻) JSON DB 변환 스크립트
 *
 * 입력: docs/平水韻.docx (Word 문서)
 * 출력: public/index/pingshui_yun.json
 *
 * 데이터 구조:
 * {
 *   meta: { total_groups, total_chars, ... },
 *   groups: {
 *     "上平一東": { tone, group, no, rhyme, chars, ci_chars },
 *     ...
 *   },
 *   char_map: { "東": { tone, rhyme_key }, ... }  // 빠른 검색용
 * }
 *
 * tone: "平" (上平聲+下平聲) 또는 "仄" (上聲+去聲+入聲)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const docxPath = path.join(__dirname, '../docs/平水韻.docx');
const outPath = path.join(__dirname, '../public/index/pingshui_yun.json');

// ── 1. docx에서 텍스트 추출 ──
console.log('1. docx에서 텍스트 추출 중...');

if (!fs.existsSync(docxPath)) {
  console.error(`Error: 파일을 찾을 수 없습니다: ${docxPath}`);
  process.exit(1);
}

const rawXml = execSync(
  `unzip -p "${docxPath}" word/document.xml`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);

// XML 태그 제거하여 순수 텍스트만 추출
const rawText = rawXml.replace(/<[^>]*>/g, '').replace(/\s+/g, '');

console.log(`   추출된 텍스트 길이: ${rawText.length}자`);

// ── 2. 운목 헤더 파싱 ──
console.log('2. 운목(韻目) 파싱 중...');

// 한자 숫자→아라비아 숫자 변환
const cnNumMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
  '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30
};

function cnToNum(cnStr) {
  return cnNumMap[cnStr] || 0;
}

// 성조 분류별 정보
const toneCategories = [
  { prefix: '上平聲', group: '上平', tone: '平' },
  { prefix: '下平聲', group: '下平', tone: '平' },
  { prefix: '上聲',   group: '上',   tone: '仄' },
  { prefix: '去聲',   group: '去',   tone: '仄' },
  { prefix: '入聲',   group: '入',   tone: '仄' }
];

// 정규식: 운목 헤더 패턴 (예: "上平聲一東", "入聲十七洽")
// "部" 섹션 헤더 (예: "上平聲部", "入聲部") 는 제외
const headerRegex = /(上平聲|下平聲|上聲|去聲|入聲)((?:二十|三十|十)?[一二三四五六七八九十]?)(.)/g;

// 모든 운목 위치 찾기
const headers = [];
let match;
while ((match = headerRegex.exec(rawText)) !== null) {
  const [fullMatch, categoryStr, numStr, rhymeChar] = match;

  // "部" 섹션 헤더 건너뛰기 (숫자가 비어있으면 "上平聲部" 같은 것)
  if (!numStr) continue;

  const num = cnToNum(numStr);
  if (num === 0) continue;

  const category = toneCategories.find(c => c.prefix === categoryStr);
  if (!category) continue;

  headers.push({
    position: match.index,
    fullMatch,
    categoryStr,
    group: category.group,
    tone: category.tone,
    no: num,
    rhyme: rhymeChar,
    key: `${category.group}${numStr}${rhymeChar}`
  });
}

console.log(`   발견된 운목: ${headers.length}개`);

// ── 3. 각 운목의 한자 목록 추출 ──
console.log('3. 각 운목별 한자 추출 중...');

const groups = {};
const charMap = {};
let totalChars = 0;
let totalCiChars = 0;
let totalCiCharsFromDict = 0;

for (let i = 0; i < headers.length; i++) {
  const header = headers[i];
  const startPos = header.position + header.fullMatch.length;
  const endPos = (i + 1 < headers.length) ? headers[i + 1].position : rawText.length;

  let charBlock = rawText.substring(startPos, endPos);

  // "部" 섹션 헤더 제거 (예: "上聲部", "去聲部" 등)
  charBlock = charBlock.replace(/(上平聲|下平聲|上聲|去聲|入聲)部/g, '');

  // 【詞】와 【辭】 분리
  let mainPart = charBlock;
  let ciPart = '';
  let ciFromDict = '';

  const ciIdx = charBlock.indexOf('【詞】');
  const ciDictIdx = charBlock.indexOf('【辭】');

  if (ciIdx !== -1) {
    mainPart = charBlock.substring(0, ciIdx);
    if (ciDictIdx !== -1 && ciDictIdx > ciIdx) {
      ciPart = charBlock.substring(ciIdx + 3, ciDictIdx);
      ciFromDict = charBlock.substring(ciDictIdx + 3);
    } else {
      ciPart = charBlock.substring(ciIdx + 3);
    }
  } else if (ciDictIdx !== -1) {
    mainPart = charBlock.substring(0, ciDictIdx);
    ciFromDict = charBlock.substring(ciDictIdx + 3);
  }

  // 한자만 필터링 (CJK Unified Ideographs 범위)
  const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

  const mainChars = (mainPart.match(cjkRegex) || []);
  const ciChars = (ciPart.match(cjkRegex) || []);
  const ciDictChars = (ciFromDict.match(cjkRegex) || []);

  // 첫 번째 글자는 운목 이름이므로 이미 포함됨 (rhyme char)
  // 하지만 실제 데이터에서 운목 이름 뒤에 바로 같은 글자가 나옴 (예: "一東東同銅...")
  // 그래서 그냥 모두 포함

  const groupData = {
    tone: header.tone,
    group: header.group,
    no: header.no,
    rhyme: header.rhyme,
    chars: mainChars,
    ci_chars: ciChars.length > 0 ? ciChars : undefined,
    ci_dict_chars: ciDictChars.length > 0 ? ciDictChars : undefined
  };

  groups[header.key] = groupData;

  // char_map에 등록 (메인 글자)
  mainChars.forEach(ch => {
    if (!charMap[ch]) {
      charMap[ch] = { tone: header.tone, rhyme_key: header.key };
    }
    // 이미 등록된 글자는 첫 번째 운목 우선 (다음자)
  });

  // 【詞】 글자도 char_map에 등록 (ci 표시 추가)
  ciChars.forEach(ch => {
    if (!charMap[ch]) {
      charMap[ch] = { tone: header.tone, rhyme_key: header.key, ci: true };
    }
  });

  // 【辭】 글자도 등록
  ciDictChars.forEach(ch => {
    if (!charMap[ch]) {
      charMap[ch] = { tone: header.tone, rhyme_key: header.key, ci_dict: true };
    }
  });

  totalChars += mainChars.length;
  totalCiChars += ciChars.length;
  totalCiCharsFromDict += ciDictChars.length;
}

// ── 4. JSON 출력 ──
console.log('4. JSON 파일 생성 중...');

const result = {
  meta: {
    name: '平水韻',
    name_ko: '평수운',
    description: '宋代 劉淵 편찬, 남송 이후 시운(詩韻)의 표준',
    total_groups: Object.keys(groups).length,
    total_main_chars: totalChars,
    total_ci_chars: totalCiChars,
    total_ci_dict_chars: totalCiCharsFromDict,
    total_unique_chars: Object.keys(charMap).length,
    tone_summary: {
      '平': { desc: '평성 (上平聲 + 下平聲)', count: Object.values(groups).filter(g => g.tone === '平').length },
      '仄': { desc: '측성 (上聲 + 去聲 + 入聲)', count: Object.values(groups).filter(g => g.tone === '仄').length }
    },
    group_summary: {
      '上平': Object.values(groups).filter(g => g.group === '上平').length,
      '下平': Object.values(groups).filter(g => g.group === '下平').length,
      '上': Object.values(groups).filter(g => g.group === '上').length,
      '去': Object.values(groups).filter(g => g.group === '去').length,
      '入': Object.values(groups).filter(g => g.group === '入').length
    },
    source: 'docs/平水韻.docx',
    generated_at: new Date().toISOString().split('T')[0]
  },
  groups,
  char_map: charMap
};

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

// ── 5. 결과 요약 ──
console.log('\n═══════════════════════════════════════');
console.log('  평수운 JSON DB 변환 완료!');
console.log('═══════════════════════════════════════');
console.log(`  운목 수: ${result.meta.total_groups}개 (목표: 106개)`);
console.log(`  메인 한자: ${totalChars}자`);
console.log(`  【詞】한자: ${totalCiChars}자`);
console.log(`  【辭】한자: ${totalCiCharsFromDict}자`);
console.log(`  고유 한자 수: ${result.meta.total_unique_chars}자`);
console.log(`  ─────────────────────────────────────`);
console.log(`  평성(平): ${result.meta.tone_summary['平'].count}운`);
console.log(`  측성(仄): ${result.meta.tone_summary['仄'].count}운`);
console.log(`  ─────────────────────────────────────`);
console.log(`  上平聲: ${result.meta.group_summary['上平']}운`);
console.log(`  下平聲: ${result.meta.group_summary['下平']}운`);
console.log(`  上聲:   ${result.meta.group_summary['上']}운`);
console.log(`  去聲:   ${result.meta.group_summary['去']}운`);
console.log(`  入聲:   ${result.meta.group_summary['入']}운`);
console.log(`  ─────────────────────────────────────`);
console.log(`  출력: ${outPath}`);
console.log('═══════════════════════════════════════\n');
