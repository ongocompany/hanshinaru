-- D 라운드 cycle 3a: 시대 재구조화 (사조/시기 분화)
-- 대상 DB: Supabase (hanshinaru), table: site_menu
-- 실행: Supabase SQL Editor 또는 service_role key REST 호출
--
-- 변경 요약:
-- 1) CN 7시대 → 10시대 (당 → 초당·성당·중당·만당 4분화)
-- 2) KR 3시대 → 6시대 (왕조 → 시기 분화: 국가형성기·고려초중기·여말선초·조선중기·조선후기·근대)
-- 3) cycle 1에 INSERT한 시대 자식 행 전체 DELETE 후 새 슬러그로 INSERT
--
-- 주의:
--   - cycle 1 SQL에서 INSERT된 시대 자식 행(id 47~56)이 전제. 부모 행(id 45·46)은 유지.
--   - 본 SQL은 부모 자식 path만 새 슬러그로 갱신. 부모 자체는 변하지 않음.

BEGIN;

-- 1) cycle 1에서 INSERT한 시대 자식 행 전부 삭제 (CN 7 + KR 3)
--    parent_id로 식별 (45=CN시대, 46=KR시대)
DELETE FROM site_menu
 WHERE section = 'hansi'
   AND parent_id IN (45, 46)
   AND path LIKE '/hansi/%/eras/%';

-- 2) CN 10 시대 새 INSERT (당 4분화 + 나머지 6 왕조)
INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
SELECT 'hansi', t.label, t.path, 45, t.sort_order, false, false
FROM (VALUES
  ('전한·후한',   '/hansi/chinese/eras/qian-han/',   1),
  ('위진남북조', '/hansi/chinese/eras/wei-jin/',    2),
  ('초당',        '/hansi/chinese/eras/chu-tang/',   3),
  ('성당',        '/hansi/chinese/eras/sheng-tang/', 4),
  ('중당',        '/hansi/chinese/eras/zhong-tang/', 5),
  ('만당',        '/hansi/chinese/eras/wan-tang/',   6),
  ('송',          '/hansi/chinese/eras/song/',       7),
  ('원',          '/hansi/chinese/eras/yuan/',       8),
  ('명',          '/hansi/chinese/eras/ming/',       9),
  ('청',          '/hansi/chinese/eras/qing/',      10)
) AS t(label, path, sort_order);

-- 3) KR 6 시대 새 INSERT (시기 분화)
INSERT INTO site_menu (section, label, path, parent_id, sort_order, is_top_menu, disabled)
SELECT 'hansi', t.label, t.path, 46, t.sort_order, false, false
FROM (VALUES
  ('국가형성기~신라말기', '/hansi/korean/eras/ancient-silla/',         1),
  ('고려 초중기',         '/hansi/korean/eras/goryeo-early-mid/',      2),
  ('여말선초',            '/hansi/korean/eras/goryeo-mal-joseon-cho/', 3),
  ('조선 중기',           '/hansi/korean/eras/joseon-jung/',           4),
  ('조선 후기',           '/hansi/korean/eras/joseon-hu/',             5),
  ('근대',                '/hansi/korean/eras/geundae/',               6)
) AS t(label, path, sort_order);

-- 검증
SELECT id, label, path, parent_id, sort_order
  FROM site_menu
 WHERE section = 'hansi' AND parent_id IN (45, 46)
 ORDER BY parent_id, sort_order;

-- 정상이면 COMMIT, 이상하면 ROLLBACK
COMMIT;
-- ROLLBACK;
