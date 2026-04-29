-- D 라운드 cycle 3b: Supabase 큐레이션 테이블 신규
-- 대상 DB: Supabase (hanshinaru)
-- 목적: jds@jinas:5433의 큐레이션 subset을 Supabase로 동기화 → 시대 페이지·오늘의 한시·reading 검색에서 anon key fetch
--
-- 분량 추정 (2026-04-29):
--   hansi_curated_poets ~178행 (CN 108 + KR 132 - 중복) — 1 MB 이하
--   hansi_curated_poems ~457행 — 1.5 MB (body_zh + translation_ko + commentary_ko 포함)
--   합계 ~2.5 MB → Supabase 무료 500 MB 한도의 0.5%

BEGIN;

-- ─── 시인 큐레이션 테이블 ────────────────────────────────────────────
DROP TABLE IF EXISTS public.hansi_curated_poets CASCADE;
CREATE TABLE public.hansi_curated_poets (
  jds_id        integer PRIMARY KEY,             -- jds.poets.id
  country       char(2) NOT NULL,                -- 'CN' | 'KR'
  era_slug      text NOT NULL,                   -- chu-tang, ancient-silla 등
  name_ko       text NOT NULL,
  name_zh       text,
  life_birth    integer,
  life_death    integer,
  life_raw      text,
  slug          text,                            -- jds 기존 slug
  era_period    text,                            -- jds 원본 era_period (참조용)
  poem_count    integer,                         -- jds 적재 분량 (큐레이션 외 분량 포함)
  bio_ko        text,                            -- 시인 약력
  sort_order    integer,                         -- 시대 내 정렬 (poem_count desc 기준)
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX idx_hansi_curated_poets_era ON public.hansi_curated_poets (country, era_slug, sort_order);

-- ─── 시 큐레이션 테이블 ──────────────────────────────────────────────
DROP TABLE IF EXISTS public.hansi_curated_poems CASCADE;
CREATE TABLE public.hansi_curated_poems (
  jds_id          integer PRIMARY KEY,           -- jds.poems.id
  poet_jds_id     integer NOT NULL REFERENCES public.hansi_curated_poets(jds_id) ON DELETE CASCADE,
  country         char(2) NOT NULL,
  era_slug        text NOT NULL,
  title_ko        text,
  title_zh        text,
  body_zh         text,                          -- 한문 원문
  translation_ko  text,                          -- 한국어 번역
  commentary_ko   text,                          -- 학술 해설
  is_notable      boolean DEFAULT false,
  quality         text,                          -- opus-subagent / sonnet-subagent / null
  category        text,
  genre           text,
  in_daily_pool   boolean DEFAULT false,         -- 오늘의 한시 회전 풀 포함 여부
  sort_order      integer,                       -- 시대 내 정렬 (notable+quality 기준)
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_hansi_curated_poems_era    ON public.hansi_curated_poems (country, era_slug, sort_order);
CREATE INDEX idx_hansi_curated_poems_daily  ON public.hansi_curated_poems (country, in_daily_pool) WHERE in_daily_pool = true;
CREATE INDEX idx_hansi_curated_poems_poet   ON public.hansi_curated_poems (poet_jds_id);

-- ─── RLS: anon 읽기 허용 ──────────────────────────────────────────────
ALTER TABLE public.hansi_curated_poets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hansi_curated_poems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_poets" ON public.hansi_curated_poets;
CREATE POLICY "anon_read_poets" ON public.hansi_curated_poets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_read_poems" ON public.hansi_curated_poems;
CREATE POLICY "anon_read_poems" ON public.hansi_curated_poems
  FOR SELECT USING (true);

-- 검증
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_name='hansi_curated_poets') AS poets_table,
  (SELECT count(*) FROM information_schema.tables WHERE table_name='hansi_curated_poems') AS poems_table;

COMMIT;
-- ROLLBACK;
