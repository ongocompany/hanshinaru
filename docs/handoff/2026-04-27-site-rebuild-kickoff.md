---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 사이트 재구축 킥오프 — IA 결정 + jds 스키마 통합 + 한국 한시 적재
date: 2026-04-27
author: 민철
---

# 이번 세션에서 완료한 작업

## 1. 사이트 재구축 IA 의사결정 (브레인스토밍)

기존 `chinese-poetry/`, `tang300/`이 의도해서 삭제된 잔재(=Astro 기반 신축의 일부)임을 확인.
중국·한국 한시 종합 플랫폼으로의 재구축 방향을 진우형과 합의.

**핵심 결정**:
- 데이터 SoT: jds PostgreSQL (jinas) 단일 통합
- 호스팅: jinas docker-compose에 `hanshinaru-web` 추가, Astro Node SSR + CF Tunnel
- DB 접근: hanshinaru-web → PostgreSQL 직접 쿼리 (jds API는 외부 공개용으로 분리)
- IA 트랙 4개: 책 트랙 + 큐레이션 트랙(one-page cascade) + 시인 백과 + 작품 발견
- URL slug: 시인=핀인/로마자, 시=글로벌 숫자ID, 책=영문약칭, 시대=영문/음역
- 시대 5/6분류: 중국(선진~한대 / 위진남북조 / 당대 / 송 / 명청), 한국(고대~통일신라 / 고려 / 조선전기 / 조선중기 / 조선후기 / 근대)
- 큐레이션: 하이브리드 (자동 ranking + 형 검수)
- MVP: 중국·한국 동시 출시, 번역 미완분은 "AI 번역 진행 중" 배지로 원문 노출

상세는 [docs/spec/2026-04-27-site-rebuild-master-plan.md](../spec/2026-04-27-site-rebuild-master-plan.md) 참조.

## 2. jds 스키마 확장 + 적용

마이그레이션 2건 작성·적용 (jinas DB):
- `20260427_000005_hanshinaru_integration`: country/slug 컬럼, books/poem_sources/featured_* 테이블
- `20260427_000006_extend_title_id_length`: title_id VARCHAR(32) → VARCHAR(128)

jinas alembic head: `20260427_000006`로 이동 완료.

## 3. 데이터 적재

| 단계 | 결과 |
|---|---|
| backfill | 기존 poets 2,731명에 `country='CN'` + 핀인 slug, poems 45,951수에 `country='CN'` |
| books 시드 | `tang300` (당시삼백수, 320수), `quantangshi` (전당시, 45,951수) |
| 한국 한시 import | 시인 117명, 시 1,616수 (KAUTH-* title_id, 깨끗한 slug 44명) |

**현재 jinas DB 상태**: poets CN 2,731 + KR 117 = **2,848명** / poems CN 45,951 + KR 1,616 = **47,567수**.

# 어디서 멈췄는지

데이터 통합 완료까지. 다음 세션은 사이트 SSR 전환부터.

# 핵심 판단과 이유

- **jds API 강제 미사용 결정**: 진우형 의견. jds API는 외부 공개용 별도 유지. hanshinaru-web은 PostgreSQL 직접 쿼리(권장: postgres.js).
- **slug 정책 단순화**: 한국 시인 148명 중 "KAUTH-author-XXX" hash 형태(=영문 매핑 미완)는 slug=NULL로 두고 후속 검수 작업으로 위임. 이렇게 한 이유: 강제로 hash slug를 부여하면 사이트 URL이 `/poets/author-ec9d84ec` 같이 흉해지고, 후속 정리 시 URL이 깨짐.
- **books 시드는 전권 보유 책만**: 한국 한시는 `collectionTitle` 86종 발췌라 책 단위 트랙에 부적합. 한국 측 책 카탈로그는 후속 spec에서 결정.
- **`poems.volume` nullable 변환**: 한국 한시는 책마다 권 개념이 달라 빈 경우 多.

# 생성/수정/참조한 문서

생성:
- `hanshinaru/docs/spec/2026-04-27-site-rebuild-master-plan.md`
- `jds/docs/2026-04-27-hanshinaru-integration.md`
- `jds/alembic/versions/20260427_000005_hanshinaru_integration.py`
- `jds/alembic/versions/20260427_000006_extend_title_id_length.py`
- `jds/scripts/backfill_country_slug.py`
- `jds/scripts/seed_books.py`
- `jds/scripts/import_korean_hansi.py`
- `hanshinaru/docs/handoff/2026-04-27-site-rebuild-kickoff.md` (본 문서)

수정:
- `jds/pipeline/db/models.py` (Poet/Poem 컬럼 추가, Book/PoemSource/FeaturedPoet/FeaturedPoem 클래스 추가, title_id String 128로 확장)
- `jds/pyproject.toml` (pypinyin>=0.50 추가)

참조:
- `hanshinaru/public/index/poems.v3.json` (당시삼백수 320수 데이터)
- `hanshinaru/public/index/korean_poets_chronology.v1.json`, `korean_poems_chronology.v1.json` (한국 한시 원천)
- `hanshinaru/docs/handoff/2026-04-26-automatic-collection-final-index.md` (한국 한시 자동 수집 색인)
- `jds/docs/handoff.md` (jds 인프라 + jinas 배포)
- `jds/api/routers/hanshinaru.py` (기존 한시나루 전용 라우터)

# 원래 계획과 달라진 점

- **title_id 컬럼 길이 확장 추가**: 처음 spec에는 없었으나 한국 한시 import 단계에서 `KAUTH-ANONYMOUS-JOSEON-COURT-SONG` (32자) 케이스로 발견. revision 20260427_000006으로 즉시 처리.
- **한국 시인 148명 중 117명 적재**: 한국 데이터 내 동일 title_id 중복으로 upsert 시 31명 덮어씀. 한국 데이터 정합성 이슈로 후속 보정 작업.
- **`pypinyin` 의존성 추가**: spec에는 명시 없었으나 backfill에서 필요. pyproject.toml에 추가.

# 다음 세션의 첫 행동

1. **부트 루틴 실행**: 이 핸드오프 + `.rules/` + `git log -20` 확인
2. **사이트 SSR 전환 시작**:
   - hanshinaru에 `@astrojs/node` adapter 설치
   - `astro.config.mjs`의 `output: 'static'` → `output: 'server'`
   - `src/lib/db.ts` 작성 (`postgres.js` connection pool)
   - 환경변수 `HANSHINARU_DATABASE_URL` 정의 (jds DB read-only role 권장)
3. **첫 라우트 1개**: `/poems/[id].astro` (가장 단순한 시 단건). DB 직접 쿼리 + 기본 렌더.
4. **검증**: 로컬 dev server에서 `/poems/12345` 같은 URL로 시 한 수 표시 확인.

# 다음 세션이 피해야 할 함정

- **jds editable install이 worktree로 link되어 있을 수 있음** — `.venv/lib/.../site-packages/jds`의 Editable project location 확인. 깨져 있으면 `cd jds && .venv/bin/pip install -e .` 로 본 리포 재link.
- **jinas DB에 직접 쓰는 작업은 신중히** — `JDS_DATABASE_URL='postgresql://jds:jds@100.115.194.12:5433/jds'` 가 production. 변경 전 항상 dry-run 또는 SQL 미리보기.
- **한국 시인 117명 중 73명이 slug=NULL** — 사이트 라우팅에서 NULL slug fallback 처리 필요 (예: `/poets/k-{id}` 임시 라우트).
- **`featured_poets` / `featured_poems` 비어 있음** — 큐레이션 트랙 페이지 구현 시 빈 상태 UX 또는 자동 ranking 시드 작업 먼저.
- **메뉴 SoT 결정 미정** — `src/data/navigation.json` vs Supabase `site_menu` 테이블. 사이트 재구축 시 첫 라운드 안에 결정 필요.
- **한국 한시 1,616수 모두 번역 미완** — 본 세션에서 번역까지 못 갔음. qwen 로컬 샘플 → 합격 시 일괄, 불합격 시 deepseek4/qwen3.6 API 흐름은 spec에 명시.

# 후속 작업 (별도 세션 또는 spec 필요)

- 한국 시인 NULL slug 73명 보정 (수기 또는 한글→로마자 자동 변환)
- 한국 데이터 내 동일 title_id 중복 31건 정합성 점검
- 당시삼백수 ↔ 전당시 320수 매핑 (poem_sources)
- `featured_poets` / `featured_poems` 자동 ranking 시드 + 형 검수
- 한국 한시용 번역 프롬프트 (`v4_batch_korean.txt`) 작성 + qwen 샘플 번역
- 한국 한시 임베딩 생성 (`generate_embeddings.py` 그대로)
- 메뉴 SoT 결정 + navigation 한국 시대 분류 보강
- jinserver(레거시 DB) 마이그레이션 적용 여부 결정
