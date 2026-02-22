#!/usr/bin/env node
// =============================================================
//  한시나루 — JSON → Supabase 마이그레이션 스크립트
//  사용법:
//    1. npm install @supabase/supabase-js
//    2. SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate_to_supabase.js
//
//  ⚠️ 반드시 supabase_schema.sql 실행 후에 이 스크립트를 돌리세요!
//  ⚠️ SERVICE_KEY (service_role key)를 써야 RLS를 우회해서 INSERT 가능합니다.
//     Supabase Dashboard → Settings → API → service_role 에서 복사.
// =============================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── 환경 변수 ──
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 환경 변수를 설정하세요:');
  console.error('   SUPABASE_URL=https://xxx.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=eyJ...');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 파일 경로 ──
const ROOT = path.join(__dirname, '..');
const POEMS_PATH = path.join(ROOT, 'public/index/poems.v3.json');
const AUTHORS_PATH = path.join(ROOT, 'public/index/db_author.with_ko.json');
const HISTORY_PATH = path.join(ROOT, 'public/index/history_cards.json');

// ── JSON 읽기 ──
function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// ── 1. poets 마이그레이션 ──
async function migratePoets() {
  console.log('\n📚 poets 마이그레이션 시작...');
  const authorData = readJSON(AUTHORS_PATH);
  const authors = authorData.authors;

  const rows = Object.values(authors).map(a => ({
    id: a.titleId,
    name_zh: a.name.zh,
    name_ko: a.name.ko,
    bio_ko: a.bioKo || null,
    birth_year: a.life?.birth ?? null,
    birth_approx: a.life?.birthApprox ?? false,
    death_year: a.life?.death ?? null,
    death_approx: a.life?.deathApprox ?? false,
    life_raw: a.life?.raw || null,
    era_period: a.era?.period || null,
    era_confidence: a.era?.confidence || null,
    era_source: a.era?.source || null,
    birthplace_name: a.birthplace?.name || null,
    birthplace_name_zh: a.birthplace?.nameZh || null,
    birthplace_lat: a.birthplace?.lat ?? null,
    birthplace_lng: a.birthplace?.lng ?? null,
    relations: a.relations || [],
    source_url: a.sourceUrl || null,
  }));

  const { data, error } = await sb
    .from('poets')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('❌ poets 에러:', error.message);
    return false;
  }
  console.log(`✅ poets ${rows.length}명 INSERT 완료`);
  return true;
}

// ── 2. poems 마이그레이션 ──
async function migratePoems(poetNameToId) {
  console.log('\n📖 poems 마이그레이션 시작...');
  const poems = readJSON(POEMS_PATH);

  const rows = poems.map(p => ({
    poem_no_str: p.poemNoStr,
    poem_no: p.poemNo,
    title_zh: p.title.zh,
    title_ko: p.title.ko || null,
    poet_zh: p.poet.zh,
    poet_ko: p.poet.ko || null,
    poet_id: poetNameToId[p.poet.zh] || null,
    category: p.category || null,
    juan: p.juan || null,
    meter: p.meter || null,
    body_zh: p.poemZh,
    translation_ko: p.translationKo || null,
    commentary_ko: p.commentaryKo || null,
    jipyeong_zh: p.jipyeongZh || null,
    pinyin: p.pinyin || null,
    pingze: p.pingze || null,
    notes: p.notes || [],
    media: p.media || null,
  }));

  // Supabase는 한 번에 최대 ~1000행 정도 가능. 320행은 문제없음.
  const { data, error } = await sb
    .from('poems')
    .upsert(rows, { onConflict: 'poem_no_str' });

  if (error) {
    console.error('❌ poems 에러:', error.message);
    return false;
  }
  console.log(`✅ poems ${rows.length}편 INSERT 완료`);
  return true;
}

// ── 3. history_cards 마이그레이션 ──
async function migrateHistory() {
  console.log('\n🏛️  history_cards 마이그레이션 시작...');
  const cards = readJSON(HISTORY_PATH);

  // 중복 titleId 제거 (같은 ID가 여러 개면 마지막 것만 유지)
  const deduped = new Map();
  cards.forEach(c => deduped.set(c.titleId, c));
  console.log(`   원본 ${cards.length}개 → 중복 제거 후 ${deduped.size}개`);

  const rows = Array.from(deduped.values()).map(c => ({
    id: c.titleId,
    year: c.year,
    name_ko: c.name?.ko || null,
    name_zh: c.name?.zh || null,
    birth_year: c.life?.birth ?? null,
    death_year: c.life?.death ?? null,
    summary: c.summary || null,
    detail: c.detail || null,
    tags: c.tags || {},
    annotations: c.annotations || [],
  }));

  const { data, error } = await sb
    .from('history_cards')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('❌ history_cards 에러:', error.message);
    return false;
  }
  console.log(`✅ history_cards ${rows.length}개 INSERT 완료`);
  return true;
}

// ── 시인 이름 → ID 매핑 빌드 ──
function buildPoetNameToIdMap() {
  const authorData = readJSON(AUTHORS_PATH);
  const authors = authorData.authors;
  const map = {};

  for (const [id, a] of Object.entries(authors)) {
    // 한자 이름으로 매핑 (시 데이터의 poet.zh 와 연결)
    map[a.name.zh] = id;
  }

  return map;
}

// ── 검증 ──
async function verify() {
  console.log('\n🔍 검증 중...');

  const { count: poetCount } = await sb
    .from('poets').select('*', { count: 'exact', head: true });
  const { count: poemCount } = await sb
    .from('poems').select('*', { count: 'exact', head: true });
  const { count: histCount } = await sb
    .from('history_cards').select('*', { count: 'exact', head: true });

  console.log(`   poets: ${poetCount}명 (예상: 76)`);
  console.log(`   poems: ${poemCount}편 (예상: 320)`);
  console.log(`   history_cards: ${histCount}개 (예상: 39)`);

  // poet_id 연결 확인
  const { data: unlinked } = await sb
    .from('poems')
    .select('poem_no_str, poet_zh')
    .is('poet_id', null);

  if (unlinked && unlinked.length > 0) {
    console.log(`\n⚠️  poet_id 미연결 시 ${unlinked.length}편:`);
    unlinked.forEach(p => console.log(`   ${p.poem_no_str}: ${p.poet_zh}`));
  } else {
    console.log('   poet_id: 전부 연결됨 ✅');
  }
}

// ── 메인 ──
async function main() {
  console.log('🚀 한시나루 DB 마이그레이션 시작');
  console.log(`   URL: ${SUPABASE_URL}`);

  // 1. poets 먼저 (poems가 FK로 참조)
  const poetOk = await migratePoets();
  if (!poetOk) {
    console.error('poets 실패 → 중단');
    process.exit(1);
  }

  // 2. 시인 이름→ID 매핑 빌드 후 poems
  const poetNameToId = buildPoetNameToIdMap();
  console.log(`   시인 이름 매핑: ${Object.keys(poetNameToId).length}명`);

  const poemOk = await migratePoems(poetNameToId);
  if (!poemOk) {
    console.error('poems 실패 → 중단');
    process.exit(1);
  }

  // 3. history_cards
  const histOk = await migrateHistory();
  if (!histOk) {
    console.error('history_cards 실패 → 중단');
    process.exit(1);
  }

  // 4. 검증
  await verify();

  console.log('\n🎉 마이그레이션 완료!');
}

main().catch(err => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
