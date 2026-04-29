-- 시대별 시인 풀 추출 (Phase 1)
-- 본 세션: D 라운드 cycle 3a 기초 큐레이션 데이터
-- KR 6 시대 + CN 4 (당 4분화). CN 6 (한·위진·송·원·명·청)은 jds 데이터 0 → 별 세션.

\set ON_ERROR_STOP on

\echo '=== KR 시인 풀 (132명, era_slug 분류) ==='
WITH kr_poets AS (
  SELECT id, name_ko, name_zh, life_birth, life_death, life_raw, slug, era_period, poem_count, bio_ko,
    CASE
      WHEN era_period IN ('고구려','백제','신라','통일신라','신라 말') THEN 'ancient-silla'
      WHEN era_period IN ('고려 전기','고려 중기','고려') THEN 'goryeo-early-mid'
      WHEN era_period IN ('고려 후기','고려 말','고려 말~조선 초','고려 말 조선 초','조선 전기') THEN 'goryeo-mal-joseon-cho'
      WHEN era_period IN ('조선 중기','조선 중기~후기','조선 전기~후기') THEN 'joseon-jung'
      WHEN era_period = '조선 후기' THEN 'joseon-hu'
      WHEN era_period IN ('근대 전환기','근대') THEN 'geundae'
      ELSE NULL
    END AS era_slug
  FROM poets WHERE country='KR'
)
SELECT json_agg(
  json_build_object(
    'id', id,
    'name_ko', name_ko,
    'name_zh', name_zh,
    'life_birth', life_birth,
    'life_death', life_death,
    'life_raw', life_raw,
    'slug', slug,
    'era_period', era_period,
    'era_slug', era_slug,
    'poem_count', poem_count,
    'has_bio', (bio_ko IS NOT NULL AND length(bio_ko) > 50)
  ) ORDER BY era_slug, poem_count DESC NULLS LAST, life_birth NULLS LAST
) AS payload
FROM kr_poets WHERE era_slug IS NOT NULL
\gset
\echo :payload

\echo '=== CN 시인 풀 (당 4분화 108명) ==='
WITH cn_poets AS (
  SELECT id, name_ko, name_zh, life_birth, life_death, life_raw, slug, era_period, poem_count, bio_ko,
    CASE
      WHEN era_period = '초당' THEN 'chu-tang'
      WHEN era_period = '성당' THEN 'sheng-tang'
      WHEN era_period = '중당' THEN 'zhong-tang'
      WHEN era_period = '만당' THEN 'wan-tang'
      ELSE NULL
    END AS era_slug
  FROM poets WHERE country='CN'
)
SELECT json_agg(
  json_build_object(
    'id', id,
    'name_ko', name_ko,
    'name_zh', name_zh,
    'life_birth', life_birth,
    'life_death', life_death,
    'life_raw', life_raw,
    'slug', slug,
    'era_period', era_period,
    'era_slug', era_slug,
    'poem_count', poem_count,
    'has_bio', (bio_ko IS NOT NULL AND length(bio_ko) > 50)
  ) ORDER BY era_slug, poem_count DESC NULLS LAST, life_birth NULLS LAST
) AS payload2
FROM cn_poets WHERE era_slug IS NOT NULL
\gset
\echo :payload2
