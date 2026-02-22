#!/usr/bin/env node
/**
 * build_poems_v3.js
 *
 * poems.full.json(원본) + Qwen 번역 → 깨끗한 poems.v3.json 생성
 *
 * 데이터 소스:
 *   1. poems.full.json — 원본 (구조 필드: title, poet, poemZh, jipyeongZh 등)
 *   2. qwen_translation — Qwen 320편 전체 번역 (translationKo, jipyeongKo, commentaryKo, notes)
 *   3. jipyeong_fix — 집평 번역 보정 95편
 *
 * [N] 마커: 원본 한자 필드에서 일괄 제거
 * 주석: Qwen 마크다운에서 파싱 → 자동매칭용 구조 (headKo, headZh)
 *
 * Usage:
 *   node scripts/build_poems_v3.js           # 빌드 실행
 *   node scripts/build_poems_v3.js --dry-run  # 통계만 출력
 */

const fs = require('fs');
const path = require('path');

// ── 경로 설정 ──
const POEMS_ORIG = path.join(__dirname, '../public/index/poems.full.json');
const QWEN_FULL = path.join(__dirname, '../docs/research/qwen_translations/qwen_translation_20260221_143125.json');
const FIX_SAMPLE = path.join(__dirname, '../docs/research/qwen_translations/jipyeong_fix_20260222_082242.json');
const FIX_FULL = path.join(__dirname, '../docs/research/qwen_translations/jipyeong_fix_20260222_084939.json');
const OUTPUT = path.join(__dirname, '../public/index/poems.v3.json');

const DRY_RUN = process.argv.includes('--dry-run');

// ══════════════════════════════════════════
//  유틸리티
// ══════════════════════════════════════════

/** [N] 마커 제거 */
function stripMarkers(text) {
  if (!text) return '';
  return text.replace(/\[\d+\]/g, '');
}

// ══════════════════════════════════════════
//  Qwen 마크다운 파서
// ══════════════════════════════════════════

/** ### 번역 섹션 추출 */
function extractTranslation(md) {
  if (!md) return '';
  const match = md.match(/###\s*번역\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (!match) return '';
  return match[1].trim().replace(/ {2}\n/g, '\n');
}

/** ### 해설 섹션 추출 */
function extractCommentary(md) {
  if (!md) return '';
  const match = md.match(/###\s*해설\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/);
  if (!match) return '';
  return match[1].trim();
}

/**
 * 집평 한글 번역 추출 (3가지 패턴 처리)
 *
 * 매칭 순서:
 *   1. ### 집평 번역 → 한글 번역 (146편+)
 *   2. ### 집평 → 내용이 한글이면 사용 (40편, [집평] prefix 등)
 *   3. ### 집평 원문 → 한문이므로 skip (fix 결과에서 처리)
 *
 * @returns {string} 한글 집평 번역. 없으면 빈 문자열
 */
function extractJipyeongKo(md) {
  if (!md) return '';

  // 1) ### 집평 번역
  let match = md.match(/###\s*집평\s*번역\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (match) return match[1].trim();

  // 2) ### 집평 (정확히 — 뒤에 번역/원문이 안 붙은 것)
  match = md.match(/###\s*집평\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (match) {
    const content = match[1].trim();
    // 한글이 포함되어 있으면 한글 번역으로 판단
    if (/[가-힣]/.test(content)) {
      return content;
    }
    // 한문만 있으면 원문 → 사용 안 함
    return '';
  }

  // 3) ### 집평 원문 → 한문이므로 여기서는 추출 안 함
  return '';
}

/**
 * 집평 원문(한문) 존재 여부 확인 (통계용)
 */
function hasJipyeongWonmun(md) {
  if (!md) return false;
  return /###\s*집평\s*원문\s*\n/.test(md);
}

/**
 * fix 응답에서 집평 번역 텍스트 추출
 */
function extractFixJipyeong(response) {
  if (!response) return '';
  // ### 집평 번역 헤딩 이후
  const match = response.match(/###\s*집평\s*번역\s*\n([\s\S]*?)$/);
  if (match) return match[1].trim();
  // 헤딩 없이 바로 텍스트
  return response.trim();
}

/**
 * ### 주석 섹션 → 구조화된 배열로 파싱
 *
 * Qwen 주석 포맷: 1) **한글키워드**(漢字): 설명...
 *
 * @returns {Array<{headKo: string, headZh: string, text: string}>}
 */
function parseNotes(md) {
  if (!md) return [];

  const match = md.match(/###\s*주석\s*\n([\s\S]*?)(?=\n###\s|\n##\s|\n---\s*$|$)/);
  if (!match) return [];

  const text = match[1].trim();
  const notes = [];
  const entries = text.split(/\n(?=\d+\)\s)/);

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    // 번호 제거
    const numMatch = trimmed.match(/\d+\)\s*(.*)/s);
    if (!numMatch) continue;
    const rest = numMatch[1].trim();

    // **키워드**(한자): 설명 패턴
    const headMatch = rest.match(/\*\*(.+?)\*\*(?:\((.+?)\))?[\s:：]*(.*)/s);
    if (!headMatch) {
      notes.push({ no: String(notes.length + 1), head: '', headKo: '', headZh: '', text: rest });
      continue;
    }

    const headKo = headMatch[1].trim();
    let headZh = (headMatch[2] || '').trim();
    const desc = headMatch[3].trim();

    // headKo 안에 한자가 섞여 있는 경우 headZh로 추출
    if (!headZh) {
      const zhInKo = headKo.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/);
      if (zhInKo) headZh = zhInKo[0];
    }

    // head = headZh 우선 (admin 호환용 alias)
    const head = headZh || headKo;
    notes.push({ no: String(notes.length + 1), head, headKo, headZh, text: desc });
  }

  return notes;
}

// ══════════════════════════════════════════
//  메인
// ══════════════════════════════════════════

function main() {
  console.log('='.repeat(60));
  console.log('  poems.v3.json 클린 빌드');
  console.log('='.repeat(60));
  console.log();

  // 1. 파일 로드
  const origPoems = JSON.parse(fs.readFileSync(POEMS_ORIG, 'utf8'));
  const qwenData = JSON.parse(fs.readFileSync(QWEN_FULL, 'utf8'));

  // Qwen 맵: poemNoStr → markdown
  const qwenMap = new Map();
  for (const item of qwenData.results) {
    if (item.markdown) {
      qwenMap.set(item.poemNoStr, item.markdown);
    }
  }

  // Fix 맵: poemNoStr → response
  const fixMap = new Map();
  function loadFix(filePath) {
    if (!fs.existsSync(filePath)) {
      console.warn(`  (fix 파일 없음: ${path.basename(filePath)})`);
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const item of data.results) {
      if (item.response && !item.error) {
        fixMap.set(item.poemNoStr, item.response);
      }
    }
  }
  loadFix(FIX_SAMPLE);
  loadFix(FIX_FULL);

  console.log(`  원본 poems.full.json: ${origPoems.length}편`);
  console.log(`  Qwen 번역: ${qwenMap.size}편`);
  console.log(`  집평 fix: ${fixMap.size}건`);
  console.log();

  // 2. 빌드
  const stats = {
    translationQwen: 0,
    translationLegacy: 0,
    jipyeongFix: 0,
    jipyeongQwen: 0,
    jipyeongWonmunOnly: 0,   // 한문 원문만 있고 fix도 없는 경우
    jipyeongNone: 0,
    commentaryAdded: 0,
    notesQwen: 0,
    notesEmpty: 0,
    markersStripped: 0,
  };

  const warnings = [];
  const result = [];

  for (const orig of origPoems) {
    const no = orig.poemNoStr;
    const qwenMd = qwenMap.get(no);

    // ── 구조 필드 (원본, [N] 마커 제거) ──
    let poemZhRaw = orig.poemZh || '';
    let jipyeongZhRaw = orig.jipyeongZh || '';

    // poemZh에 [集評]이 섞여있는 경우 분리 (046번 등 원본 크롤링 오류)
    const jipIdx = poemZhRaw.indexOf('[集評]');
    if (jipIdx >= 0) {
      if (!jipyeongZhRaw) {
        jipyeongZhRaw = poemZhRaw.slice(jipIdx);
      }
      poemZhRaw = poemZhRaw.slice(0, jipIdx).trim();
      warnings.push(`${no}: poemZh에서 [集評] 분리됨`);
    }

    const poemZhClean = stripMarkers(poemZhRaw);
    const jipyeongZhClean = stripMarkers(jipyeongZhRaw);
    const poetZhClean = stripMarkers(orig.poet?.zh || '');

    if (poemZhClean !== (orig.poemZh || '')) stats.markersStripped++;

    // title 필드도 [N] 마커 제거
    const titleZhClean = stripMarkers(orig.title?.zh || '');
    const titleKoClean = stripMarkers(orig.title?.ko || '');

    const poem = {
      poemNoStr: no,
      poemNo: orig.poemNo,
      title: { zh: titleZhClean, ko: titleKoClean },
      poet: { zh: poetZhClean, ko: orig.poet?.ko || '' },
      category: orig.category,
      juan: orig.juan,
      meter: orig.meter,
      poemZh: poemZhClean,
    };

    // jipyeongZh — 원본에 있는 경우만
    if (jipyeongZhClean) {
      poem.jipyeongZh = jipyeongZhClean;
    }

    // ── translationKo: Qwen 우선 ──
    if (qwenMd) {
      const translation = extractTranslation(qwenMd);
      if (translation) {
        poem.translationKo = translation;
        stats.translationQwen++;
      } else {
        poem.translationKo = orig.translationKo || '';
        stats.translationLegacy++;
        warnings.push(`${no}: Qwen 번역 추출 실패 → 레거시 사용`);
      }
    } else {
      poem.translationKo = orig.translationKo || '';
      stats.translationLegacy++;
    }

    // ── jipyeongKo: fix > Qwen > 빈값 ──
    const fixResponse = fixMap.get(no);
    if (fixResponse) {
      const fixText = extractFixJipyeong(fixResponse);
      if (fixText) {
        poem.jipyeongKo = fixText;
        stats.jipyeongFix++;
      } else {
        stats.jipyeongNone++;
      }
    } else if (qwenMd) {
      const qwenJipyeong = extractJipyeongKo(qwenMd);
      if (qwenJipyeong) {
        poem.jipyeongKo = qwenJipyeong;
        stats.jipyeongQwen++;
      } else if (hasJipyeongWonmun(qwenMd)) {
        // 한문 원문만 있고 fix도 없는 경우
        stats.jipyeongWonmunOnly++;
        warnings.push(`${no}: 집평 원문(한문)만 있고 fix 결과 없음`);
      } else {
        stats.jipyeongNone++;
      }
    } else {
      stats.jipyeongNone++;
    }

    // ── commentaryKo: Qwen에서만 ──
    if (qwenMd) {
      const commentary = extractCommentary(qwenMd);
      if (commentary) {
        poem.commentaryKo = commentary;
        stats.commentaryAdded++;
      }
    }

    // ── notes: Qwen 주석 파싱 ──
    if (qwenMd) {
      const notes = parseNotes(qwenMd);
      if (notes.length > 0) {
        poem.notes = notes;
        stats.notesQwen++;
      } else {
        poem.notes = [];
        stats.notesEmpty++;
      }
    } else {
      poem.notes = [];
      stats.notesEmpty++;
    }

    // ── pinyin, pingze: 원본 유지 ──
    if (orig.pinyin) poem.pinyin = orig.pinyin;
    if (orig.pingze) poem.pingze = orig.pingze;

    // ── media: 원본 유지 ──
    if (orig.media && orig.media.youtube && orig.media.youtube.length > 0) {
      poem.media = orig.media;
    }

    result.push(poem);
  }

  // 3. 통계 출력
  console.log('-'.repeat(40));
  console.log('  빌드 통계');
  console.log('-'.repeat(40));
  console.log(`  translationKo:`);
  console.log(`    Qwen 번역:    ${stats.translationQwen}편`);
  console.log(`    레거시:       ${stats.translationLegacy}편`);
  console.log(`  jipyeongKo:`);
  console.log(`    fix 반영:     ${stats.jipyeongFix}편`);
  console.log(`    Qwen 추출:    ${stats.jipyeongQwen}편`);
  console.log(`    원문만(미번역):${stats.jipyeongWonmunOnly}편`);
  console.log(`    없음:         ${stats.jipyeongNone}편`);
  console.log(`  commentaryKo:   ${stats.commentaryAdded}편`);
  console.log(`  notes:`);
  console.log(`    Qwen 파싱:    ${stats.notesQwen}편`);
  console.log(`    빈 배열:      ${stats.notesEmpty}편`);
  console.log(`  [N]마커 제거:   ${stats.markersStripped}편`);

  // jipyeongKo 합계 검증
  const jipTotal = stats.jipyeongFix + stats.jipyeongQwen;
  const origJipCount = origPoems.filter(p => p.jipyeongZh && p.jipyeongZh.trim()).length;
  console.log();
  console.log(`  * 원본 jipyeongZh 보유: ${origJipCount}편`);
  console.log(`  * 최종 jipyeongKo 보유: ${jipTotal}편`);

  // 4. 경고 출력
  if (warnings.length > 0) {
    console.log();
    console.log('-'.repeat(40));
    console.log(`  경고 (${warnings.length}건)`);
    console.log('-'.repeat(40));
    for (const w of warnings) {
      console.log(`  ! ${w}`);
    }
  }

  // 5. 샘플 검증
  console.log();
  console.log('-'.repeat(40));
  console.log('  샘플 검증');
  console.log('-'.repeat(40));
  for (const sno of ['001', '005', '050', '100', '236', '320']) {
    const p = result.find(r => r.poemNoStr === sno);
    if (!p) continue;
    console.log(`  ${sno} ${p.title.zh} (${p.poet.ko})`);
    console.log(`    translationKo: ${(p.translationKo || '').substring(0, 60)}...`);
    console.log(`    jipyeongKo:    ${(p.jipyeongKo || '(없음)').substring(0, 60)}...`);
    console.log(`    commentaryKo:  ${(p.commentaryKo || '(없음)').substring(0, 60)}...`);
    console.log(`    notes: ${p.notes.length}개`);
    if (p.notes.length > 0) {
      const n = p.notes[0];
      console.log(`      [0] ${n.headKo}(${n.headZh || '-'}): ${n.text.substring(0, 40)}...`);
    }
    console.log(`    필드: ${Object.keys(p).length}개`);
    console.log();
  }

  if (DRY_RUN) {
    console.log('='.repeat(60));
    console.log('  dry-run 모드 — 파일 미생성');
    console.log('='.repeat(60));
    return;
  }

  // 6. 저장
  const outputData = JSON.stringify(result, null, 2);
  fs.writeFileSync(OUTPUT, outputData, 'utf8');

  const fileSizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
  const fileSizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
  console.log('='.repeat(60));
  console.log(`  빌드 완료!`);
  console.log(`  출력: ${OUTPUT}`);
  console.log(`  크기: ${fileSizeKB} KB (${fileSizeMB} MB)`);
  console.log(`  시 수: ${result.length}편`);

  // 필드 수 범위
  const fieldCounts = result.map(p => Object.keys(p).length);
  const minFields = Math.min(...fieldCounts);
  const maxFields = Math.max(...fieldCounts);
  console.log(`  필드: ${minFields}~${maxFields}개`);
  console.log('='.repeat(60));
}

try {
  main();
} catch (err) {
  console.error('에러:', err.message);
  console.error(err.stack);
  process.exit(1);
}
