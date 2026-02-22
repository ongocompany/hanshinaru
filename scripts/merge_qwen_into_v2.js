#!/usr/bin/env node
/**
 * merge_qwen_into_v2.js
 *
 * Qwen 번역 데이터를 poems.v2.json에 병합:
 * 1. translationKo (번역) — Qwen 320편 전체 번역으로 교체
 * 2. jipyeongKo (집평 번역) — fix 95건 우선, 나머지 Qwen 전체에서
 * 3. commentaryKo (해설) — Qwen 320편 번역에서 추출
 *
 * Usage:
 *   node scripts/merge_qwen_into_v2.js           # 병합 실행
 *   node scripts/merge_qwen_into_v2.js --dry-run  # 미리보기만
 */

const fs = require('fs');
const path = require('path');

// ── 경로 설정 ──
const POEMS_V2 = path.join(__dirname, '../public/index/poems.v2.json');
const QWEN_FULL = path.join(__dirname, '../docs/research/qwen_translations/qwen_translation_20260221_143125.json');
const FIX_SAMPLE = path.join(__dirname, '../docs/research/qwen_translations/jipyeong_fix_20260222_082242.json');
const FIX_FULL = path.join(__dirname, '../docs/research/qwen_translations/jipyeong_fix_20260222_084939.json');
const OUTPUT = path.join(__dirname, '../public/index/poems.v3.json');

const DRY_RUN = process.argv.includes('--dry-run');

// ── 파싱 유틸 ──

/**
 * 마크다운에서 ### 번역 섹션 추출
 */
function extractTranslation(md) {
  if (!md) return '';
  const match = md.match(/###\s*번역\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (!match) return '';
  // 마크다운 줄바꿈(trailing 2spaces) → 일반 줄바꿈
  return match[1].trim().replace(/ {2}\n/g, '\n');
}

/**
 * 마크다운에서 ### 해설 섹션 추출
 */
function extractCommentary(md) {
  if (!md) return '';
  // ### 해설 찾기 (줄 시작)
  const match = md.match(/###\s*해설\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/);
  if (!match) return '';
  return match[1].trim();
}

/**
 * 마크다운에서 ### 집평 번역 섹션 추출
 */
function extractJipyeongKo(md) {
  if (!md) return '';
  const match = md.match(/###\s*집평\s*번역\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (!match) return '';
  return match[1].trim();
}

/**
 * fix 결과의 response에서 집평 번역 텍스트 추출
 */
function extractFixJipyeong(response) {
  if (!response) return '';
  // "### 집평 번역" 헤딩 이후 텍스트
  const match = response.match(/###\s*집평\s*번역\s*\n([\s\S]*?)$/);
  if (match) return match[1].trim();
  // 헤딩 없이 바로 텍스트인 경우 (regenerate 타입)
  // [集評] 로 시작하는 경우 전체 반환
  if (response.includes('[集評]') || response.includes('[집평]')) {
    return response.trim();
  }
  return response.trim();
}

// ── 메인 ──
function main() {
  console.log('🔄 Qwen 데이터 → poems.v2.json 병합 시작\n');

  // 1. 파일 로드
  if (!fs.existsSync(POEMS_V2)) {
    console.error('❌ poems.v2.json 없음');
    process.exit(1);
  }
  if (!fs.existsSync(QWEN_FULL)) {
    console.error('❌ Qwen 전체 번역 파일 없음');
    process.exit(1);
  }

  const poems = JSON.parse(fs.readFileSync(POEMS_V2, 'utf8'));
  const qwenData = JSON.parse(fs.readFileSync(QWEN_FULL, 'utf8'));

  // 2. Qwen 320편 번역 → poemNoStr 기반 맵 생성
  const qwenMap = new Map();
  for (const item of qwenData.results) {
    if (item.markdown) {
      qwenMap.set(item.poemNoStr, item.markdown);
    }
  }

  // 3. 집평 fix 결과 로드 + 병합
  const fixMap = new Map();

  function loadFixFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ fix 파일 없음: ${filePath}`);
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const item of data.results) {
      if (item.response && !item.dry_run && !item.error) {
        fixMap.set(item.poemNoStr, {
          response: item.response,
          type: item.type,
        });
      }
    }
  }

  loadFixFile(FIX_SAMPLE);
  loadFixFile(FIX_FULL);

  console.log(`📖 poems.v2.json: ${poems.length}편`);
  console.log(`📖 Qwen 번역: ${qwenMap.size}편`);
  console.log(`📖 집평 fix: ${fixMap.size}건`);
  console.log();

  // 4. 병합
  let translationReplaced = 0;
  let translationSkipped = 0;
  let commentaryAdded = 0;
  let commentaryUpdated = 0;
  let jipyeongFixed = 0;
  let jipyeongFromQwen = 0;

  for (const poem of poems) {
    const no = poem.poemNoStr;
    const qwenMd = qwenMap.get(no);

    // 4a. translationKo — Qwen 320편 전체 번역으로 교체
    if (qwenMd) {
      const translation = extractTranslation(qwenMd);
      if (translation) {
        poem.translationKo = translation;
        translationReplaced++;
      } else {
        translationSkipped++;
      }
    }

    // 4b. commentaryKo 추출 (Qwen 320편 전체)
    if (qwenMd) {
      const commentary = extractCommentary(qwenMd);
      if (commentary) {
        if (!poem.commentaryKo || poem.commentaryKo.trim() === '') {
          commentaryAdded++;
        } else {
          commentaryUpdated++;
        }
        poem.commentaryKo = commentary;
      }
    }

    // 4c. jipyeongKo — fix 결과 우선, 나머지는 Qwen 전체에서 교체
    const fix = fixMap.get(no);
    if (fix) {
      const fixText = extractFixJipyeong(fix.response);
      if (fixText) {
        poem.jipyeongKo = fixText;
        jipyeongFixed++;
      }
    } else if (qwenMd) {
      // fix 대상이 아닌 시 → Qwen 전체 번역에서 집평 번역 추출 (기존 레거시도 교체)
      const qwenJipyeong = extractJipyeongKo(qwenMd);
      if (qwenJipyeong) {
        poem.jipyeongKo = qwenJipyeong;
        jipyeongFromQwen++;
      }
    }
  }

  // 5. 필드 순서 재정렬 (commentaryKo 위치 고정)
  const orderedPoems = poems.map(p => {
    const result = {};
    result.poemNoStr = p.poemNoStr;
    result.poemNo = p.poemNo;
    result.title = p.title;
    result.poet = p.poet;
    result.category = p.category;
    result.juan = p.juan;
    result.meter = p.meter;
    result.poemZh = p.poemZh;
    result.jipyeongZh = p.jipyeongZh || '';
    result.translationKo = p.translationKo;
    result.jipyeongKo = p.jipyeongKo || '';
    if (p.commentaryKo && p.commentaryKo.trim() !== '') {
      result.commentaryKo = p.commentaryKo;
    }
    result.notes = p.notes || [];
    result.pinyin = p.pinyin || '';
    result.pingze = p.pingze || '';
    if (p.media && p.media.youtube && p.media.youtube.length > 0) {
      result.media = p.media;
    }
    return result;
  });

  // 6. 통계 출력
  console.log('📊 병합 통계:');
  console.log(`   translationKo Qwen 교체: ${translationReplaced}편`);
  console.log(`   translationKo 추출 실패: ${translationSkipped}편`);
  console.log(`   commentaryKo 신규 추가: ${commentaryAdded}편`);
  console.log(`   commentaryKo 업데이트: ${commentaryUpdated}편`);
  console.log(`   jipyeongKo fix 반영: ${jipyeongFixed}편`);
  console.log(`   jipyeongKo Qwen 교체: ${jipyeongFromQwen}편`);

  if (DRY_RUN) {
    console.log('\n🏁 dry-run 모드 — 파일 미생성');
    return;
  }

  // 7. 저장
  const outputData = JSON.stringify(orderedPoems, null, 2);
  fs.writeFileSync(OUTPUT, outputData, 'utf8');

  const fileSizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
  console.log(`\n✅ 병합 완료!`);
  console.log(`   출력: ${OUTPUT}`);
  console.log(`   크기: ${fileSizeKB} KB`);
  console.log(`   필드: ${Object.keys(orderedPoems[0]).length}개`);
}

try {
  main();
} catch (err) {
  console.error('❌ 에러:', err.message);
  process.exit(1);
}
