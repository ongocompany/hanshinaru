/**
 * 집평 누락 데이터 추출 → Qwen 보완 요청용 프롬프트 생성
 *
 * 사용법:
 *   node scripts/fix_jipyeong.js --check        # 문제 목록만 출력
 *   node scripts/fix_jipyeong.js --generate      # 보완 요청용 프롬프트 JSON 생성
 *   python scripts/fix_jipyeong.py               # 실제 Qwen API 호출 (별도 스크립트)
 */
const fs = require('fs');
const path = require('path');

const SRC = 'docs/research/qwen_translations/qwen_translation_20260221_143125.json';
const POEMS_SRC = 'public/index/poems.full.json';
const OUTPUT = 'docs/research/qwen_translations/jipyeong_fix_requests.json';

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const poems = JSON.parse(fs.readFileSync(POEMS_SRC, 'utf8'));

// poems.full.json에서 시 데이터 매핑 (번호 → 원본 데이터)
const poemsMap = {};
for (const p of (Array.isArray(poems) ? poems : poems.poems || [])) {
  const no = String(p.poemNoStr || p.poemNo || '').replace(/\D/g, '').padStart(3, '0');
  if (no) poemsMap[no] = p;
}

function hasChineseChars(text) {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

function hasKoreanChars(text) {
  return /[\uac00-\ud7af]/.test(text);
}

function extractJipyeong(md) {
  // 집평 관련 섹션 추출
  const jpMatch = md.match(/(\[집평\]|\[集評\]|집평 원문[^]*?[:：]\s*\n)([\s\S]*?)(?=###\s|$)/);
  const jpTransMatch = md.match(/### 집평 번역\s*\n([\s\S]*?)(?=###\s|$)/);

  let cnText = '';
  let krText = '';

  if (jpMatch) {
    const section = jpMatch[0];
    const cnChars = (section.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const krChars = (section.match(/[\uac00-\ud7af]/g) || []).length;
    if (cnChars > 5) cnText = section;
    if (krChars > 10) krText = section;
  }
  if (jpTransMatch) {
    krText = jpTransMatch[1].trim();
  }

  return { cnText, krText };
}

const mode = process.argv[2] || '--check';

const cnOnlyList = [];  // 원문만 있음 (번역 누락)
const krOnlyList = [];  // 번역만 있음 (원문 누락)

for (const item of data.results) {
  const no = item.poemNoStr;
  const md = item.markdown || '';
  const jp = extractJipyeong(md);

  const hasCn = jp.cnText && hasChineseChars(jp.cnText) && (jp.cnText.match(/[\u4e00-\u9fff]/g) || []).length > 5;
  const hasKr = jp.krText && hasKoreanChars(jp.krText) && (jp.krText.match(/[\uac00-\ud7af]/g) || []).length > 10;

  if (hasCn && !hasKr) {
    cnOnlyList.push({ no, title: item.title, poet: item.poet, cnText: jp.cnText });
  } else if (!hasCn && hasKr) {
    krOnlyList.push({ no, title: item.title, poet: item.poet, krText: jp.krText });
  }
}

if (mode === '--check') {
  console.log(`\n=== 집평 번역 누락 (원문만 있음): ${cnOnlyList.length}편 ===`);
  for (const item of cnOnlyList) {
    console.log(`  ${item.no} | ${item.title} | ${item.poet}`);
  }

  console.log(`\n=== 집평 원문 누락 (번역만 있음): ${krOnlyList.length}편 ===`);
  for (const item of krOnlyList) {
    console.log(`  ${item.no} | ${item.title} | ${item.poet}`);
  }

  console.log(`\n총 보완 필요: ${cnOnlyList.length + krOnlyList.length}편`);
  console.log(`  - 번역 추가 필요: ${cnOnlyList.length}편`);
  console.log(`  - 원문 추가 필요: ${krOnlyList.length}편`);

} else if (mode === '--generate') {
  const requests = [];

  // 1. 번역 누락 → "이 집평 원문을 한국어로 번역해줘"
  for (const item of cnOnlyList) {
    const poem = poemsMap[item.no];
    const poemZh = poem ? (poem.poemZh || '').replace(/\[\d+\]/g, '') : '';

    requests.push({
      poemNoStr: item.no,
      title: item.title,
      poet: item.poet,
      type: 'translate_jipyeong',
      prompt: `아래 시의 집평 원문을 한국어로 번역해 주세요. 학술 스타일 평서문으로, 경어체 사용 금지.

시 번호: ${item.no}
시 제목: ${item.title}
시인: ${item.poet}

시 원문:
${poemZh}

집평 원문:
${item.cnText.replace(/\[집평\]|\[集評\]|집평 원문[^:：]*[:：]\s*/g, '').trim()}

출력 형식:
### 집평 번역
(한국어 번역 내용)
`
    });
  }

  // 2. 원문 누락 → 집평(원문+번역) 한 세트로 다시 생성
  for (const item of krOnlyList) {
    const poem = poemsMap[item.no];
    const poemZh = poem ? (poem.poemZh || '').replace(/\[\d+\]/g, '') : '';
    const jipyeongZh = poem ? (poem.jipyeongZh || '') : '';

    requests.push({
      poemNoStr: item.no,
      title: item.title,
      poet: item.poet,
      type: 'regenerate_jipyeong',
      prompt: `아래 시의 집평(集評)을 다시 작성해 주세요.
후대 유명 비평가들의 평을 찾아서, 한자 원문과 한국어 번역을 한 세트로 출력해 주세요.
한국어 번역은 학술 스타일 평서문으로, 경어체 사용 금지.
${jipyeongZh ? '\n기존 원본 데이터에 집평 원문이 있으면 그것을 우선 사용하세요.' : ''}

시 번호: ${item.no}
시 제목: ${item.title}
시인: ${item.poet}

시 원문:
${poemZh}
${jipyeongZh ? '\n기존 집평 원문 (참고):\n' + jipyeongZh : ''}

출력 형식:
[集評] ○ (한자 원문) — (출처: 비평가명, 저서명)
○ (한자 원문) — (출처)

### 집평 번역
(한국어 번역 내용)
`
    });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalRequests: requests.length,
    translateCount: cnOnlyList.length,
    findOriginalCount: krOnlyList.length,
    requests: requests
  }, null, 2), 'utf8');

  console.log(`\n[완료] ${OUTPUT} 생성`);
  console.log(`  - 번역 요청: ${cnOnlyList.length}편`);
  console.log(`  - 원문 검색 요청: ${krOnlyList.length}편`);
  console.log(`  - 총 요청: ${requests.length}편`);
  console.log(`\n다음 단계: python scripts/fix_jipyeong.py 실행`);
}
