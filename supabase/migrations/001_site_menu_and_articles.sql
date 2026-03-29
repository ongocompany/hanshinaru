-- =============================================
-- SC-002: 콘텐츠 DB화 마이그레이션
-- 실행: Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- 1. site_menu: 네비게이션/사이드바 메뉴 구조
CREATE TABLE IF NOT EXISTS site_menu (
  id          serial PRIMARY KEY,
  section     text NOT NULL,          -- 'chinese-poetry', 'korean-poetry', 'community', 'hanja', 'writing-helper'
  label       text NOT NULL,          -- 메뉴에 표시되는 이름
  path        text NOT NULL,          -- URL 경로
  parent_id   int REFERENCES site_menu(id) ON DELETE SET NULL,
  sort_order  int DEFAULT 0,
  is_top_menu boolean DEFAULT false,  -- 탑 네비 드롭다운에도 표시
  disabled    boolean DEFAULT false,  -- 비활성 메뉴 (작성도우미 등)
  created_at  timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_site_menu_section ON site_menu(section);
CREATE INDEX idx_site_menu_parent ON site_menu(parent_id);

-- RLS: 읽기는 모두 허용, 쓰기는 admin만
ALTER TABLE site_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_menu_read" ON site_menu
  FOR SELECT USING (true);

CREATE POLICY "site_menu_write" ON site_menu
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. articles: 콘텐츠 페이지
CREATE TABLE IF NOT EXISTS articles (
  id          serial PRIMARY KEY,
  slug        text UNIQUE NOT NULL,   -- URL 경로 (예: 'chinese-poetry/literary-history/tang')
  title       text NOT NULL,
  subtitle    text,
  body        text,                   -- HTML (Quill 에디터 출력)
  cover_image text,                   -- 대표 이미지 URL
  section     text NOT NULL,          -- site_menu.section과 매칭
  sort_order  int DEFAULT 0,
  status      text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_section ON articles(section);
CREATE INDEX idx_articles_status ON articles(status);

-- RLS: published만 공개 읽기, 쓰기는 admin만
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_read_published" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "articles_read_all_admin" ON articles
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "articles_write" ON articles
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 3. articles 이미지 저장용 Storage 버킷
-- (Supabase Dashboard > Storage에서 수동 생성 필요)
-- 버킷명: article-images
-- 공개 읽기: true
-- 허용 MIME: image/*

-- =============================================
-- 초기 메뉴 데이터 삽입
-- =============================================

-- 탑메뉴 + 사이드바 1단계
INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu) VALUES
  -- 중국 시문학
  ('chinese-poetry', '중국 시문학',       '/chinese-poetry/general/',  NULL, 1, true),
  ('chinese-poetry', '일반론',            '/chinese-poetry/general/',  NULL, 1, false),
  ('chinese-poetry', '시인과 작품',       '/chinese-poetry/poets/',    NULL, 2, true),
  ('chinese-poetry', '변천사',            '/chinese-poetry/history/',  NULL, 3, true),

  -- 한국의 한시
  ('korean-poetry', '한국의 한시',        '/korean-poetry/',           NULL, 1, true),
  ('korean-poetry', '개요',              '/korean-poetry/',           NULL, 1, false),
  ('korean-poetry', '시인과 작품',        '/korean-poetry/poets/',     NULL, 2, true),

  -- 커뮤니티
  ('community', '커뮤니티',              '/community/',               NULL, 1, true),
  ('community', '공지사항',              '/community/notice/',        NULL, 1, false),
  ('community', '자유게시판',            '/community/forum/',         NULL, 2, false),
  ('community', '뉴스',                 '/community/news/',          NULL, 3, false),
  ('community', '묻고 답하기',           '/community/qna/',           NULL, 4, false),
  ('community', '창작마당',              '/community/showcase/',      NULL, 5, false),

  -- 한자와 한문
  ('hanja', '한자와 한문',               '/hanja/',                   NULL, 1, true),
  ('hanja', '한자와 한문',               '/hanja/',                   NULL, 1, false),
  ('hanja', '한자 시험',                '/hanja/exam/',              NULL, 2, false),

  -- 작성도우미
  ('writing-helper', '작성도우미',        '/writing-helper/',          NULL, 1, true);

-- 사이드바 2단계 (일반론 하위)
INSERT INTO site_menu (section, label, path, parent_id, sort_order) VALUES
  ('chinese-poetry', '문학사',    '/chinese-poetry/literary-history/', (SELECT id FROM site_menu WHERE path = '/chinese-poetry/general/' AND is_top_menu = false LIMIT 1), 1),
  ('chinese-poetry', '명작 소개', '/chinese-poetry/masterworks/',      (SELECT id FROM site_menu WHERE path = '/chinese-poetry/general/' AND is_top_menu = false LIMIT 1), 2),
  ('chinese-poetry', '서적 소개', '/chinese-poetry/books/',            (SELECT id FROM site_menu WHERE path = '/chinese-poetry/general/' AND is_top_menu = false LIMIT 1), 3);

-- 사이드바 3단계 (문학사 하위)
INSERT INTO site_menu (section, label, path, parent_id, sort_order) VALUES
  ('chinese-poetry', '선진~한대',   '/chinese-poetry/literary-history/pre-han/',   (SELECT id FROM site_menu WHERE path = '/chinese-poetry/literary-history/' LIMIT 1), 1),
  ('chinese-poetry', '위진남북조',  '/chinese-poetry/literary-history/wei-jin/',   (SELECT id FROM site_menu WHERE path = '/chinese-poetry/literary-history/' LIMIT 1), 2),
  ('chinese-poetry', '당대',       '/chinese-poetry/literary-history/tang/',      (SELECT id FROM site_menu WHERE path = '/chinese-poetry/literary-history/' LIMIT 1), 3),
  ('chinese-poetry', '송대 이후',   '/chinese-poetry/literary-history/post-tang/', (SELECT id FROM site_menu WHERE path = '/chinese-poetry/literary-history/' LIMIT 1), 4);
