#!/usr/bin/env node
/**
 * merge_owned_data.js
 *
 * 목적: poems.full.json (22개 필드, 320편)을 정리해서 poems.v2.json (15개 필드)로 변환
 *
 * 주요 작업:
 * 1. translationKoOwned → translationKo 병합
 * 2. jipyeongKoOwned → jipyeongKo 병합
 * 3. notesOwned → notes 병합
 * 4. commentaryKoOwned → commentaryKo 변환
 * 5. 불필요한 필드 7개 삭제 (sourceUrl, poemSimp, titleId, ownedContentMeta 등)
 * 6. 필드 순서 재정렬 (15개 필드)
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const INPUT_FILE = path.join(__dirname, '../public/index/poems.full.json');
const OUTPUT_FILE = path.join(__dirname, '../public/index/poems.v2.json');

// 통계 변수
let stats = {
  totalPoems: 0,
  translationMerged: 0,
  jipyeongMerged: 0,
  notesMerged: 0,
  commentaryRenamed: 0,
  fieldsDeleted: 0
};

/**
 * 1편의 시를 변환하는 함수
 */
function transformPoem(poem) {
  const result = {};

  // 1. translationKoOwned → translationKo 병합
  let translationKo = poem.translationKo || '';
  if (poem.translationKoOwned && poem.translationKoOwned.trim() !== '') {
    translationKo = poem.translationKoOwned;
    stats.translationMerged++;
  }

  // 2. jipyeongKoOwned → jipyeongKo 병합
  let jipyeongKo = poem.jipyeongKo || '';
  if (poem.jipyeongKoOwned && poem.jipyeongKoOwned.trim() !== '') {
    jipyeongKo = poem.jipyeongKoOwned;
    stats.jipyeongMerged++;
  }

  // 3. notesOwned → notes 병합
  let notes = poem.notes || [];
  if (poem.notesOwned && Array.isArray(poem.notesOwned) && poem.notesOwned.length > 0) {
    notes = poem.notesOwned;
    stats.notesMerged++;
  }

  // 4. commentaryKoOwned → commentaryKo 변환
  let commentaryKo = '';
  if (poem.commentaryKoOwned && poem.commentaryKoOwned.trim() !== '') {
    commentaryKo = poem.commentaryKoOwned;
    stats.commentaryRenamed++;
  } else if (poem.commentaryKo && poem.commentaryKo.trim() !== '') {
    commentaryKo = poem.commentaryKo;
  }

  // 5. 필드 순서대로 재구성 (15개 필드)
  result.poemNoStr = poem.poemNoStr;
  result.poemNo = poem.poemNo;
  result.title = poem.title;
  result.poet = poem.poet;
  result.category = poem.category;
  result.juan = poem.juan;
  result.meter = poem.meter;
  result.poemZh = poem.poemZh;
  result.jipyeongZh = poem.jipyeongZh || '';
  result.translationKo = translationKo;
  result.jipyeongKo = jipyeongKo;

  // commentaryKo는 값이 있을 때만 포함
  if (commentaryKo && commentaryKo.trim() !== '') {
    result.commentaryKo = commentaryKo;
  }

  result.notes = notes;
  result.pinyin = poem.pinyin || '';
  result.pingze = poem.pingze || ''; // 빈 문자열이어도 유지

  // media는 youtube 배열이 비어있지 않을 때만 포함
  if (poem.media && poem.media.youtube && poem.media.youtube.length > 0) {
    result.media = poem.media;
  }

  // 6. 삭제된 필드 카운트 (7개)
  const deletedFields = ['sourceUrl', 'poemSimp', 'titleId', 'translationKoOwned',
                         'jipyeongKoOwned', 'notesOwned', 'ownedContentMeta'];
  deletedFields.forEach(field => {
    if (poem.hasOwnProperty(field)) {
      stats.fieldsDeleted++;
    }
  });

  return result;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🤖 poems.full.json → poems.v2.json 변환 시작\n');

  // 1. 입력 파일 읽기
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 에러: 입력 파일을 찾을 수 없어. ${INPUT_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const poems = JSON.parse(rawData);

  stats.totalPoems = poems.length;
  console.log(`📖 총 ${stats.totalPoems}편의 시를 불러왔어.`);

  // 2. 변환
  const transformedPoems = poems.map(poem => transformPoem(poem));

  // 3. 출력 파일 쓰기
  const outputData = JSON.stringify(transformedPoems, null, 2);
  fs.writeFileSync(OUTPUT_FILE, outputData, 'utf8');

  // 4. 파일 크기 계산
  const fileSizeBytes = fs.statSync(OUTPUT_FILE).size;
  const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

  // 5. 통계 출력
  console.log('\n✅ 변환 완료!\n');
  console.log('📊 변환 통계:');
  console.log(`   - 총 편수: ${stats.totalPoems}편`);
  console.log(`   - translationKo 병합 (Owned → base): ${stats.translationMerged}건`);
  console.log(`   - jipyeongKo 병합 (Owned → base): ${stats.jipyeongMerged}건`);
  console.log(`   - notes 병합 (Owned → base): ${stats.notesMerged}건`);
  console.log(`   - commentaryKo 변환: ${stats.commentaryRenamed}건`);
  console.log(`   - 삭제된 필드 (총 횟수): ${stats.fieldsDeleted}건`);
  console.log(`\n📦 결과 파일:`);
  console.log(`   - 경로: ${OUTPUT_FILE}`);
  console.log(`   - 크기: ${fileSizeKB} KB (${fileSizeMB} MB)`);
  console.log(`\n🎯 시스템 가동률 99% — 형, 작업 완료했어!`);
}

// 실행
try {
  main();
} catch (error) {
  console.error('\n❌ 에러 발생:', error.message);
  console.error(error.stack);
  process.exit(1);
}
