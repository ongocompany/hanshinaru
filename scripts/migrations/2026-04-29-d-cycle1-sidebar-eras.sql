-- D 라운드 cycle 1: 사이드바 메뉴 시대 확장 + 메뉴 이름 변경
-- 대상 DB: Supabase (hanshinaru), table: site_menu
-- 실행: Supabase SQL Editor 또는 service_role key로 REST 호출
--
-- 변경 요약:
-- 1) 메뉴 이름 변경: '대표작가와 작품소개' → '오늘의 한시' (id 32, 34)
-- 2) 시대 부모 카테고리 INSERT (CN, KR 각 1)
-- 3) 시대 individual INSERT (CN 7 + KR 3)
-- 합계: UPDATE 2, INSERT 12

BEGIN;

-- 1) 메뉴 이름 변경
UPDATE site_menu SET label = '오늘의 한시' WHERE id = 32;  -- 중국
UPDATE site_menu SET label = '오늘의 한시' WHERE id = 34;  -- 한국

-- 2) 시대 부모 카테고리 + 자식 INSERT (CTE로 부모 id 참조)
WITH cn_parent AS (
  INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
  VALUES ('hansi', '시대', '/hansi/chinese/eras/', 30, 3, false, false)
  RETURNING id
),
kr_parent AS (
  INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
  VALUES ('hansi', '시대', '/hansi/korean/eras/', 31, 3, false, false)
  RETURNING id
),
cn_eras AS (
  INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
  SELECT 'hansi', t.label, t.path, (SELECT id FROM cn_parent), t.sort_order, false, false
  FROM (VALUES
    ('전한·후한', '/hansi/chinese/eras/qian-han/', 1),
    ('위진남북조', '/hansi/chinese/eras/wei-jin/', 2),
    ('당',         '/hansi/chinese/eras/tang/',     3),
    ('송',         '/hansi/chinese/eras/song/',     4),
    ('원',         '/hansi/chinese/eras/yuan/',     5),
    ('명',         '/hansi/chinese/eras/ming/',     6),
    ('청',         '/hansi/chinese/eras/qing/',     7)
  ) AS t(label, path, sort_order)
  RETURNING id
),
kr_eras AS (
  INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
  SELECT 'hansi', t.label, t.path, (SELECT id FROM kr_parent), t.sort_order, false, false
  FROM (VALUES
    ('신라',  '/hansi/korean/eras/silla/',   1),
    ('고려',  '/hansi/korean/eras/goryeo/',  2),
    ('조선',  '/hansi/korean/eras/joseon/',  3)
  ) AS t(label, path, sort_order)
  RETURNING id
)
SELECT
  (SELECT COUNT(*) FROM cn_eras) AS cn_eras_inserted,
  (SELECT COUNT(*) FROM kr_eras) AS kr_eras_inserted;

-- 검증 SELECT
SELECT id, section, label, path, parent_id, sort_order
  FROM site_menu
 WHERE section = 'hansi'
 ORDER BY parent_id NULLS FIRST, sort_order;

-- 문제 없으면 COMMIT, 이상하면 ROLLBACK
COMMIT;
-- ROLLBACK;
