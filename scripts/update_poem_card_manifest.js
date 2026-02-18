#!/usr/bin/env node
/**
 * 메인페이지 日日五首 이미지 manifest 자동 생성
 *
 * 사용법: node scripts/update_poem_card_manifest.js
 *
 * public/assets/main_page_poem/ 폴더의 jpg 파일을 스캔하고
 * poems.full.json에서 제목/시인 정보를 가져와 manifest.json을 생성합니다.
 *
 * 이미지 파일명 규칙: {poemNo 3자리}.jpg (예: 007.jpg, 268.jpg)
 */

const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'public', 'assets', 'main_page_poem');
const POEMS_PATH = path.join(__dirname, '..', 'public', 'index', 'poems.full.json');
const MANIFEST_PATH = path.join(IMG_DIR, 'manifest.json');

// 주석 마커/괄호 제거: "張九齡[1]" → "張九齡", "〈春思〉" → "春思"
function stripNotes(text) {
  return (text || '')
    .replace(/[\[\［]\s*\d+\s*[\]\］]/g, '')
    .replace(/[〈〉《》]/g, '')
    .trim();
}

function main() {
  // 1. 이미지 폴더 스캔
  const files = fs.readdirSync(IMG_DIR)
    .filter(f => /^\d{3}\.jpg$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.log('이미지 파일이 없습니다. (public/assets/main_page_poem/*.jpg)');
    return;
  }

  console.log(`이미지 ${files.length}개 발견: ${files.join(', ')}`);

  // 2. poems.full.json 로딩
  const poems = JSON.parse(fs.readFileSync(POEMS_PATH, 'utf-8'));
  const poemMap = new Map();
  for (const p of poems) {
    poemMap.set(p.poemNo, p);
  }

  // 3. manifest 생성
  const manifest = [];
  const missing = [];

  for (const file of files) {
    const no = parseInt(file.replace('.jpg', ''), 10);
    const poem = poemMap.get(no);

    if (!poem) {
      missing.push(file);
      continue;
    }

    const titleZh = typeof poem.title === 'object'
      ? stripNotes(poem.title.zh)
      : stripNotes(String(poem.title));

    const poetZh = typeof poem.poet === 'object'
      ? stripNotes(poem.poet.zh)
      : stripNotes(String(poem.poet));

    const poetKo = typeof poem.poet === 'object'
      ? (poem.poet.ko || '')
      : '';

    manifest.push({
      no,
      file,
      title: titleZh,
      poet: poetZh,
      poetKo,
    });
  }

  // 4. 저장
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(`\n✅ manifest.json 생성 완료 (${manifest.length}개 항목)`);
  manifest.forEach(m => {
    console.log(`   ${m.file} → ${m.poet}(${m.poetKo}) 《${m.title}》`);
  });

  if (missing.length > 0) {
    console.log(`\n⚠️  poems.full.json에서 찾을 수 없는 파일: ${missing.join(', ')}`);
  }
}

main();
