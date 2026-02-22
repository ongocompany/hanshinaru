-- =============================================================
--  한시나루 — Supabase DB 스키마
--  형이 Supabase SQL Editor (https://supabase.com/dashboard)에서
--  이 파일 전체를 복사해서 실행하면 됩니다.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. poets 테이블 (76명)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.poets (
  id text PRIMARY KEY,                    -- titleId (예: "C328")
  name_zh text NOT NULL,                  -- 한자 이름 (예: "賈島")
  name_ko text NOT NULL,                  -- 한글 이름 (예: "가도")
  bio_ko text,                            -- 한글 전기/소개글
  birth_year integer,                     -- 출생년 (null 가능)
  birth_approx boolean DEFAULT false,     -- 출생년 추정 여부
  death_year integer,                     -- 사망년 (null 가능)
  death_approx boolean DEFAULT false,     -- 사망년 추정 여부
  life_raw text,                          -- 원문 생몰년 표기 (예: "779~843")
  era_period text,                        -- 시대 구분: "early"/"high"/"mid"/"late"
  era_confidence text,                    -- 시대 판정 신뢰도
  era_source text,                        -- 시대 판정 근거
  birthplace_name text,                   -- 출생지 한글 (예: "하북성 범양")
  birthplace_name_zh text,                -- 출생지 한자 (예: "河北省 范陽")
  birthplace_lat double precision,        -- 위도
  birthplace_lng double precision,        -- 경도
  relations jsonb DEFAULT '[]'::jsonb,    -- 관계도 [{targetId, type, label, desc}]
  source_url text,                        -- 출처 URL
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. poems 테이블 (320편)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.poems (
  poem_no_str text PRIMARY KEY,           -- "001" ~ "320"
  poem_no integer NOT NULL,               -- 1 ~ 320
  title_zh text NOT NULL,                 -- 한자 제목
  title_ko text,                          -- 한글 제목
  poet_zh text NOT NULL,                  -- 시인 한자명
  poet_ko text,                           -- 시인 한글명
  poet_id text REFERENCES public.poets(id), -- 시인 FK
  category text,                          -- "五言古詩", "七言律詩" 등
  juan text,                              -- "卷一" ~ "卷八"
  meter integer,                          -- 5 (오언) 또는 7 (칠언)
  body_zh text NOT NULL,                  -- 한자 원문 (\n 줄바꿈)
  translation_ko text,                    -- 한글 번역
  commentary_ko text,                     -- 한글 해설 (장문)
  jipyeong_zh text,                       -- 집평 원문
  pinyin text,                            -- 병음 (\n 줄바꿈)
  pingze text,                            -- 평측 (\n 줄바꿈, 근체시만)
  notes jsonb DEFAULT '[]'::jsonb,        -- 주석 [{no, head, headKo, headZh, text}]
  media jsonb,                            -- {youtube: ["url1", "url2"]}
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 3. history_cards 테이블 (39개)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.history_cards (
  id text PRIMARY KEY,                    -- titleId (예: "H001")
  year integer NOT NULL,                  -- 사건 발생년
  name_ko text,                           -- 한글 사건명
  name_zh text,                           -- 한자 사건명
  birth_year integer,                     -- 사건 시작년
  death_year integer,                     -- 사건 종료년 (null = 단발)
  summary text,                           -- 짧은 요약
  detail text,                            -- 상세 설명 (장문)
  tags jsonb DEFAULT '{}'::jsonb,         -- {era:[], emperor:[], theme:[]}
  annotations jsonb DEFAULT '[]'::jsonb,  -- [{key, type, title, summary, source}]
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 4. RLS (Row Level Security) 정책
--    SELECT = 누구나, INSERT/UPDATE/DELETE = 로그인 사용자만
-- ─────────────────────────────────────────────

-- poets
ALTER TABLE public.poets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poets_read" ON public.poets
  FOR SELECT USING (true);
CREATE POLICY "poets_write" ON public.poets
  FOR ALL USING (auth.role() = 'authenticated');

-- poems
ALTER TABLE public.poems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poems_read" ON public.poems
  FOR SELECT USING (true);
CREATE POLICY "poems_write" ON public.poems
  FOR ALL USING (auth.role() = 'authenticated');

-- history_cards
ALTER TABLE public.history_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_read" ON public.history_cards
  FOR SELECT USING (true);
CREATE POLICY "history_write" ON public.history_cards
  FOR ALL USING (auth.role() = 'authenticated');
