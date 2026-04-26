---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 사이트 재구축 라운드 1 — SSR 11개 라우트 + 데이터 통합 + 큐레이션 시드
date: 2026-04-27
author: 민철
---

# 이번 세션에서 완료한 작업

어제 [`2026-04-27-site-rebuild-kickoff.md`](2026-04-27-site-rebuild-kickoff.md)에서 결정한 마스터플랜 ([`spec/2026-04-27-site-rebuild-master-plan.md`](../spec/2026-04-27-site-rebuild-master-plan.md)) 기반, 사이트 SSR 전환과 데이터 통합을 라운드 1로 완료. Astro SSR 라우트 11개와 jinas DB 데이터 보강이 핵심.

## 1. Astro SSR 전환 (Round 1)

| 항목 | 변경 |
|---|---|
| 의존성 | `@astrojs/node`, `postgres` 추가 |
| `astro.config.mjs` | `output: 'server'` + node standalone adapter |
| Node 22.22.2 | nvm 사용 (Astro 6.x 강제 요구) |
| `src/lib/db.ts` | 신규 — postgres.js connection pool + 모든 쿼리 헬퍼 |
| `.env.local` | `HANSHINARU_DATABASE_URL` 추가 (현재 dev용 jds:jds) |
| `.env.example` | 신규 생성 |
| `.rules/coding-rules.md` | "Vanilla JS only" → "Astro 컴포넌트 + 서버 PG 직접 쿼리" |

## 2. 페이지 라우트 11개 (Round 1-6)

| URL | 파일 | 비고 |
|---|---|---|
| `/poems/[id]` | [`src/pages/poems/[id].astro`](../../src/pages/poems/%5Bid%5D.astro) | 시 단건 + annotations 섹션 + 책별 details/summary |
| `/poets` | [`src/pages/poets/index.astro`](../../src/pages/poets/index.astro) | 인덱스 + country 필터 + 검색 + 페이징 |
| `/poets/[slug]` | [`src/pages/poets/[slug].astro`](../../src/pages/poets/%5Bslug%5D.astro) | 시인 단건 + slug fallback (`k-{id}`) |
| `/china` | [`src/pages/china/index.astro`](../../src/pages/china/index.astro) | 중국 시대 5개 타임라인 |
| `/korea` | [`src/pages/korea/index.astro`](../../src/pages/korea/index.astro) | 한국 시대 6개 타임라인 |
| `/eras/[slug]` | [`src/pages/eras/[slug].astro`](../../src/pages/eras/%5Bslug%5D.astro) | cascade UX (좌 sticky / 우 약전+대표작), `?poet=` 딥링크 |
| `/books` | [`src/pages/books/index.astro`](../../src/pages/books/index.astro) | 카탈로그 (CN/KR 분리) |
| `/books/[slug]` | [`src/pages/books/[slug]/index.astro`](../../src/pages/books/%5Bslug%5D/index.astro) | 책 표지 + 진입 카드 |
| `/books/[slug]/volumes` | [`src/pages/books/[slug]/volumes/index.astro`](../../src/pages/books/%5Bslug%5D/volumes/index.astro) | 권 목록 + 시체 분류 |
| `/books/[slug]/volumes/[n]` | [`src/pages/books/[slug]/volumes/[n].astro`](../../src/pages/books/%5Bslug%5D/volumes/%5Bn%5D.astro) | 권 안의 시 목록 (한자→숫자 매핑) |
| `/books/[slug]/poems/[position]` | [`src/pages/books/[slug]/poems/[position].astro`](../../src/pages/books/%5Bslug%5D/poems/%5Bposition%5D.astro) | 시집 안 직접 진입 (matched/unmatched 모두) |

추가 변경:
- [`src/components/Nav.astro`](../../src/components/Nav.astro): Supabase 의존 제거 → `navigation.json` 직접 import
- [`src/components/Sidebar.astro`](../../src/components/Sidebar.astro): 동일
- [`src/layouts/BaseLayout.astro`](../../src/layouts/BaseLayout.astro): Nav/Footer 자동 fallback (새 SSR 페이지 자동 적용)
- [`src/data/navigation.json`](../../src/data/navigation.json): 마스터플랜 메뉴 구조 (한시 입문/서적/시인/작품/한자/도우미/커뮤니티)
- [`src/data/eras.ts`](../../src/data/eras.ts): 신규 — CN 5분류 + KR 6분류 정의 (era_slug ↔ era_period 매핑)
- [`src/pages/index.astro`](../../src/pages/index.astro): "둘러보기" 섹션 추가 (서적/시인/작품 발견 카드)

## 3. 데이터 보강 (Round 7) — jinas DB 직접 쓰기

### Step 1: `poets.poem_count` 백필
- 영향: **1,053명** (KR 93 + CN 960)
- KR 93명: 0 → 실제 값 (예: 이언진 252수, 정몽주 114수)
- CN 960명: 부정합 복구 (예: 寒山 16 → 308, 肅和 31 → 1)

### Step 2: CN `era_period` 백필
- 일괄 '당' (2,731명, 모두 NULL이었음)
- jds는 본질적으로 전당시 데이터라 99% 당대
- 정밀 분류(隋·五代 분리, 사초/성당/중당/만당)는 사이트 가동 후 재조사로 미룸 — 진우형 결정

### Step 3: `poem_annotations` 테이블 신설 + tang300 320수 적재
- jds alembic [`20260427_000007_poem_annotations.py`](../../../jds/alembic/versions/20260427_000007_poem_annotations.py): `poem_sources` DROP + `poem_annotations` CREATE
- jds models.py: `PoemAnnotation` 추가, `PoemSource` 제거
- 적재 스크립트 [`jds/scripts/load_tang300_annotations.py`](../../../jds/scripts/load_tang300_annotations.py)
- 적재 결과: 320/320
  - 캐노니컬 매칭 (poem_id 채움): **205수** (異体字 정규화 포함)
  - 자체 보존 (poem_id=NULL + body_zh_variant): **115수**
  - 풍부 메타: 번역 320, 해설 319, 집평 286, 주석 320

### Step 4: `featured_poets` / `featured_poems` 자동 시드
- 스크립트 [`jds/scripts/seed_featured.py`](../../../jds/scripts/seed_featured.py)
- 7개 era에 시인 61명 + 시 61수 (각 era top 10, modern은 5명만)
- `picked_by='auto'`, `note='자동 ranking by poem_count'` — 진우형 검수 시 덮어쓰기

## 4. 검증

전체 라우트 smoke test 통과 (23개 200 + 7개 404 정상). `/eras/tang`에서 featured 동작 확인 (백거이 → 두보 → 이백 순).

# 어디서 멈췄는지

라운드 1 (SSR + 데이터 통합) 완료. 다음 라운드는 jinas docker-compose 배포 또는 후속 데이터 정밀화.

# 핵심 판단과 이유

## 1. `poem_sources` 폐기 + `poem_annotations`로 통합
**판단**: 두 테이블 다 두지 않고 `poem_annotations`로 일원화.
**이유**: 진우형 지시 — "주석/해설/집평이 책마다 다를 수 있으니 두 버전 별도 보존". `poem_annotations`는 단순 매핑(poem_sources의 역할)도 다 담을 수 있어 중복 회피. 향후 다른 책 추가 시 같은 패턴으로 확장 가능.

## 2. tang300 매칭 실패 115수 → 자체 보존
**판단**: `poem_id=NULL` + `body_zh_variant`로 적재.
**이유**: 異体字(絶/絕), 異本(亂/敗 같은 한 글자 차이)으로 매칭 어려운 케이스가 많음. 매칭률 64.1% (정규화 후). 매칭 실패해도 tang300 자체 데이터는 풍부하므로 사이트에서 `/books/tang300/poems/[position]`으로 접근 가능. 정확도 개선은 후속 라운드.

## 3. CN 시인 era 일괄 '당' 백필
**판단**: 정밀 분류(위키 조사) 대신 일괄 '당' 백필.
**이유**: 진우형 결정 — "사이트 굴러가기 시작하는 시점에서 다시 재조사". jds는 전당시 데이터라 사실상 99% 당대. `eras.ts`의 당대 `matchPeriods: ['당','초당','성당','중당','만당']`이 다 잡으므로 사이트 동작에 무해. 정밀화는 후속.

## 4. 메뉴 SoT를 Supabase → `navigation.json` 단일화
**판단**: Supabase `site_menu` 테이블 의존 제거.
**이유**: 마스터플랜의 "데이터 SoT는 jds PostgreSQL 단일 통합" 원칙. Supabase는 인증/커뮤니티 등 다른 기능에만 남김. `Nav.astro`/`Sidebar.astro`는 `navigation.json` 직접 import. `src/lib/menu.ts`는 deprecated (다음 라운드 삭제).

## 5. 매칭 안 된 5명 시인 표기 정리는 후속
**판단**: 邱爲, 金昌緖, 唐 玄宗, 杜秋娘, 陳子昻 5명은 jds에 매칭 안 됨 — 본 라운드에서 미처리.
**이유**: 표기 차이(공백, 異体字, 別名) 정리에 위키 조사 필요. 시간 한계로 후속 라운드.

## 6. Node 22.22.2 강제
**판단**: nvm으로 Node 22로 전환 후 Astro dev 동작.
**이유**: Astro 6.x가 `>=22.12.0` 강제 (`>=20.20`은 동작 자체 불가). nvm에 22.22.2 설치되어 있어 사용. jinas 배포 시 docker image도 Node 22 필요.

## 7. 데이터 일괄 작업 모두 단계별 dry-run + 컨펌
**판단**: 5단계 백필/시드 작업 각각 SQL 미리보기 + 영향 범위 dry-run + 진우형 OK 후 실행.
**이유**: jinas DB는 production. CLAUDE.md 룰("jinas DB에 직접 쓰는 작업은 신중히") 준수. 진우형 비개발자 친화적 설명 (예: "DB값 vs 실제 시 개수 불일치 1,053명" → "명함 숫자가 안 맞는 시인 1,053명").

# 생성/수정/참조한 문서

## 생성

### hanshinaru
- `src/pages/poets/index.astro`
- `src/pages/poets/[slug].astro`
- `src/pages/china/index.astro`
- `src/pages/korea/index.astro`
- `src/pages/eras/[slug].astro`
- `src/pages/books/[slug]/volumes/index.astro`
- `src/pages/books/[slug]/volumes/[n].astro`
- `src/pages/books/[slug]/poems/[position].astro`
- `src/lib/db.ts`
- `src/data/eras.ts`
- `.env.example`
- `docs/handoff/2026-04-27-site-rebuild-round1-complete.md` (본 문서)

### jds
- `alembic/versions/20260427_000007_poem_annotations.py`
- `scripts/load_tang300_annotations.py`
- `scripts/seed_featured.py`

## 수정

### hanshinaru
- `astro.config.mjs` (output: server + node adapter)
- `package.json` (@astrojs/node, postgres 의존성)
- `src/pages/index.astro` (둘러보기 섹션 추가)
- `src/pages/poems/[id].astro` (annotations 섹션 추가)
- `src/pages/books/index.astro` (catalog → 신규 디자인)
- `src/pages/books/[slug]/index.astro` (이전 `[slug].astro`에서 이동 + getBookAnnotationCount 사용)
- `src/components/Nav.astro` (navigation.json 직접 import)
- `src/components/Sidebar.astro` (동일)
- `src/layouts/BaseLayout.astro` (Nav/Footer 자동 fallback)
- `src/data/navigation.json` (마스터플랜 메뉴 구조)
- `.rules/coding-rules.md` (Astro SSR 룰 갱신)
- `.env.local` (HANSHINARU_DATABASE_URL 추가)

### jds
- `pipeline/db/models.py` (PoemAnnotation 추가, PoemSource 제거, Book/Poem 관계 갱신)

## 참조
- `public/index/poems.v3.json` (당시삼백수 320수 풍부 메타 — 적재 소스)
- `public/index/db_author.with_ko.json` (당시삼백수 시인 76명 메타 — 본 라운드 미사용, 후속 정밀 백필 소스)
- `docs/spec/2026-04-27-site-rebuild-master-plan.md` (마스터플랜)
- `docs/handoff/2026-04-27-site-rebuild-kickoff.md` (어제 세션 핸드오프)

# 원래 계획과 달라진 점

## 1. `poem_sources` → `poem_annotations` 통합
- 마스터플랜에는 `poem_sources` (단순 매핑)만 정의
- 진우형 지시로 풍부 메타 보존이 필요 → `poem_annotations`로 통합 + `poem_sources` DROP
- 마스터플랜 `data-integration` 부분의 후행 결정

## 2. CN 시인 era 일괄 '당'
- 마스터플랜에는 5분류(선진~한대 / 위진남북조 / 당대 / 송 / 명청) 명시
- 실제 jds 데이터는 전당시 한정이라 분류 불필요 — 일괄 '당'으로 단순화
- 정밀 분류는 후속 (재조사)

## 3. 캐노니컬 매칭 64.1%
- 처음 매칭 시도 55.9% → 異体字 정규화 + 4자 fallback으로 64.1%
- 100% 매칭은 위키 lookup이나 OCR 정확도 개선 필요 — 후속

## 4. tang300 시인별 보기 카드 일시 제거
- 마스터플랜에 `/books/[slug]/poets` 명시
- 본 라운드에서 라우트 미구현 → 진입 카드 제거 (404 방지)
- 후속 라운드에서 카드 + 라우트 동시 추가

## 5. 71명 정밀 백필 미처리
- `db_author.with_ko.json`에 76명 풍부 메타(생몰년·약전·birthplace·relations) 존재
- 71명 1:1 매칭 가능 (94%)
- 진우형 결정 — "사이트 굴러간 후 재조사" 라운드에 일괄 처리

# 다음 세션의 첫 행동

## 부트 루틴
1. 본 핸드오프 + `.rules/` + `git log -20` 확인
2. `git status` — 본 라운드 커밋 상태 확인

## 라운드 2 후보 (진우형 결정 필요)

### A. 배포 (사이트 가동)
1. jinas `docker-compose.yml`에 `hanshinaru-web` 서비스 추가 (Node 22 image)
2. CF Tunnel 설정 → `hanshinaru.kr` 도메인 연결
3. production용 read-only role `hanshinaru_ro` 생성 + `.env` 분리
4. `npm run build` → SSR production 동작 확인

### B. 데이터 정밀화 (사이트는 dev만)
1. 매칭 안 된 5명 시인 표기 정리 (邱爲 등)
2. 71명 정밀 백필 (`db_author.with_ko.json` → 시인 bio/life/birthplace)
3. CN era_period 정밀 분류 (위키 조사 기반)
4. 한국 한시 1,616수 번역 (qwen 로컬/API)

### C. 잔여 라우트
1. `/books/tang300/poets` (시인별 보기)
2. `/search` (통합 검색 — full-text + 시맨틱)
3. `/poems` 인덱스 (작품 발견 트랙)

# 다음 세션이 피해야 할 함정

## 환경 / 인프라
- **Node 20에서 Astro dev 실패** — 반드시 `nvm use 22` 또는 PATH에 22.22.2 우선. 현재 `npm run dev`는 22 필수. jinas Docker image도 Node 22-alpine 등.
- **`.env.local`만 git에서 추적 안 됨** — `.env.example`은 가이드용. 새 환경에서 dev 시작 시 `cp .env.example .env.local` + 자격증명 입력.
- **jinas DB 직접 쓰기 신중히** — production. 모든 DDL/UPDATE 사전에 dry-run 필수.

## 코드 / 라우트
- **`src/lib/menu.ts`는 deprecated** — Nav/Sidebar에서 더 이상 import 안 함. 다음 라운드에서 삭제 가능. 다만 graphify 결과 파일에서만 참조.
- **`/books/[slug]/poets` 라우트 부재** — 책 표지의 시인별 카드 일시 제거 상태. 라우트 추가 시 카드도 같이 복원.
- **CN era 페이지 빈 상태** — `/eras/pre-han` `/eras/wei-jin` `/eras/song` `/eras/ming-qing` 4개는 era_period 매칭 데이터 없어서 "분류된 시인 없음" 표시. 정밀 백필 후 채워짐.

## 데이터
- **5명 시인 jds 미매칭** — 邱爲, 金昌緖, 唐 玄宗(공백), 杜秋娘, 陳子昻(陳子昂 정자 차이). 후속 정리 시 표기 정규화 + 시인 추가 또는 별명 매핑.
- **`featured_*`는 자동 시드** — 진우형 검수 후 수정해야 의미 있음. UI에서 "큐레이션됨" 표시 가능 (`picked_by='auto'` vs `'human'`).
- **`books.compiler_id` 미설정** — tang300/quantangshi 둘 다 NULL. 손수, 팽정구를 poets에 추가 후 연결 가능. 후속.

## 기존 정적 페이지
- **`src/pages/hansi/`, `community/`, `hanja/` 등 옛 정적 페이지** 그대로 남음. SSR 변환 또는 prerender 필요. 본 라운드에선 미처리. 사이트 가동 전 정리 또는 `export const prerender = true` 표시 필요.

# 후속 작업 (별도 spec 또는 라운드)

- 한국 시인 NULL slug 73명 보정 (수기 또는 한글→로마자 자동 변환)
- 한국 데이터 내 동일 title_id 중복 31건 정합성 점검 (어제 세션 잔재)
- CN 시인 era 정밀 분류 (위키 lookup → era_period 정규화)
- tang300 71명 정밀 백필 (`db_author.with_ko.json`의 bio/life/birthplace/relations)
- featured_poets/poems 진우형 수기 검수 + 노트
- 옛 정적 페이지(`hansi/`, `chinese-poetry/`, `korean-poetry/`) 정리 또는 SSR 마이그레이션
- `/search` 라우트 (jds API의 시맨틱 검색 활용 vs 직접 PG full-text)
- `/poems` 작품 인덱스 라우트
- jinas docker-compose 배포 + CF Tunnel
- read-only DB role + 자격증명 분리
- jinserver(레거시 DB) 마이그레이션 적용 여부
