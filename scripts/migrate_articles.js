#!/usr/bin/env node
/**
 * 하드코딩 HTML → articles DB 마이그레이션
 * Usage: node scripts/migrate_articles.js
 */

const fs = require('fs');
const path = require('path');

const SB_URL = 'https://iplxexvmrnzlqglfqrpg.supabase.co/rest/v1';
const SB_KEY = 'sb_publishable_SBqquD4OkM6a93H3dMPNRQ_X5JChwWI';

// 마이그레이션 대상 페이지
const PAGES = [
  { file: 'chinese-poetry/general/index.html', slug: 'chinese-poetry/general', section: 'chinese-poetry', title: '한시 일반론' },
  { file: 'chinese-poetry/general/literary-history/index.html', slug: 'chinese-poetry/general/literary-history', section: 'chinese-poetry', title: '문학사' },
  { file: 'chinese-poetry/general/masterworks/index.html', slug: 'chinese-poetry/general/masterworks', section: 'chinese-poetry', title: '명작 소개' },
  { file: 'chinese-poetry/books/index.html', slug: 'chinese-poetry/books', section: 'chinese-poetry', title: '서적 소개' },
  { file: 'korean-poetry/index.html', slug: 'korean-poetry', section: 'korean-poetry', title: '한국의 전통시문학' },
  { file: 'hanja/index.html', slug: 'hanja', section: 'hanja', title: '한자의 정의와 기원' },
  { file: 'hanja/exam/index.html', slug: 'hanja/exam', section: 'hanja', title: '한자 능력 검정 시험 안내' },
];

const ROOT = path.resolve(__dirname, '..');

function extractContent(html) {
  // 1) <style> 태그 제거
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  // 2) <script> 태그 제거
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  // 3) nav, footer, sidebar 제거
  html = html.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  html = html.replace(/<div[^>]*id="nav-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<div[^>]*id="footer-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 4) content 영역 추출 (다양한 패턴)
  let content = '';

  // template-5a/5b: .content-body 또는 .content 안의 내용
  let m = html.match(/<(?:div|main)[^>]*class="[^"]*content-body[^"]*"[^>]*>([\s\S]*?)(?=<\/(?:div|main)>\s*<\/(?:div|main)>\s*$)/i);
  if (m) { content = m[1]; }

  if (!content) {
    m = html.match(/<(?:div|main)[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*)/i);
    if (m) {
      content = m[1];
      // 마지막 닫는 태그들 정리
      content = content.replace(/<\/(?:div|main)>\s*<\/(?:div|main)>\s*<\/body>/i, '');
    }
  }

  // 못 찾으면 body 전체
  if (!content) {
    m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    content = m ? m[1] : html;
  }

  // 5) head, <html>, <body>, <!DOCTYPE> 정리
  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  content = content.replace(/<\/?html[^>]*>/gi, '');
  content = content.replace(/<\/?body[^>]*>/gi, '');
  content = content.replace(/<\/?head[^>]*>/gi, '');
  content = content.replace(/<meta[^>]*>/gi, '');
  content = content.replace(/<link[^>]*>/gi, '');
  content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');

  // 6) sidebar 관련 div 제거
  content = content.replace(/<aside[^>]*class="[^"]*sidebar[^"]*"[\s\S]*?<\/aside>/gi, '');
  content = content.replace(/<div[^>]*class="[^"]*sidebar[^"]*"[\s\S]*?<\/div>/gi, '');
  content = content.replace(/<div[^>]*id="sidebar[^"]*"[\s\S]*?<\/div>/gi, '');

  // 7) 빈 div/span class 속성 정리 (선택적)
  content = content.replace(/\s*class="[^"]*"/g, '');
  content = content.replace(/\s*id="[^"]*"/g, '');

  // 8) 연속 빈줄 정리
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  return content;
}

async function insertArticle(page, body) {
  const payload = {
    slug: page.slug,
    title: page.title,
    section: page.section,
    body: body,
    status: 'published',
    sort_order: 0,
  };

  const res = await fetch(`${SB_URL}/articles`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ ${page.slug}: ${res.status} ${err}`);
    return false;
  }

  const data = await res.json();
  console.log(`  ✓ ${page.slug} (id: ${data[0]?.id})`);
  return true;
}

async function main() {
  console.log('=== 아티클 마이그레이션 시작 ===\n');

  let ok = 0, fail = 0;

  for (const page of PAGES) {
    const filePath = path.join(ROOT, page.file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ 파일 없음: ${page.file}`);
      fail++;
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const body = extractContent(raw);

    if (body.length < 50) {
      console.warn(`  ⚠ 콘텐츠가 너무 짧음 (${body.length}자): ${page.file}`);
    }

    const success = await insertArticle(page, body);
    success ? ok++ : fail++;
  }

  console.log(`\n=== 완료: ${ok}건 성공, ${fail}건 실패 ===`);
}

main().catch(console.error);
