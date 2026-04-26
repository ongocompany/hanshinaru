---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한시나루 사이트 재구축 마스터 플랜
date: 2026-04-27
author: 민철
---

# 목적

한시나루 사이트를 "당시삼백수 한정 UI" 잔재에서 벗어나 **중국·한국 한시 종합 플랫폼**으로 재구축한다.
이 문서는 IA(정보 구조), URL 정책, 데이터 통합 모델, 인프라 결정의 단일 출처(SoT)다.

# 배경

- 기존 `chinese-poetry/`, `tang300/` 디렉토리는 옛 서비스 잔재로 의도해 삭제(staged for deletion).
  새 Astro 사이트와 호환되지 않으며, "책 한 권" 중심 UI라 확장성에 제약.
- 데이터는 두 갈래로 살아 있다.
  - **중국**: jds(전당시 파이프라인) PostgreSQL — 시 45,951수, 시인 2,731명, 번역·독음·주석·시맨틱 검색 완비
  - **한국**: hanshinaru `public/index/korean_*_chronology.v1.json` — 시 1,616건, 시인 148명, 원문 직접확보, 번역 미완
- jds 측 `api/routers/hanshinaru.py`로 한시나루 전용 라우터가 미리 마련돼 있다.
- 시 4만 수+를 정적 빌드하는 것은 비현실적.

# 핵심 결정 사항

| 영역 | 결정 |
|---|---|
| 데이터 SoT | jds PostgreSQL 단일 통합. 한국 한시도 jds 스키마로 흡수 |
| 호스팅 | jinas docker-compose에 `hanshinaru-web` 컨테이너 추가, Astro Node SSR, CF Tunnel로 외부 노출 |
| DB 접근 | hanshinaru-web → PostgreSQL 직접 쿼리(`postgres.js` 권장). jds API 의존성 0. jds API는 외부 공개용으로 별도 유지 |
| IA 트랙 | 책 트랙 + 큐레이션 트랙(one-page cascade) + 시인 백과 + 작품 발견 |
| URL 정책 | 시인=핀인/로마자 slug, 시=글로벌 숫자 ID, 책=영문 약칭 slug, 시대=영문/음역 slug |
| 시대 분류 (중국 5분류) | 선진~한대 / 위진남북조 / 당대 / 송 / 명청 |
| 시대 분류 (한국 6분류) | 고대~통일신라 / 고려 / 조선전기 / 조선중기 / 조선후기 / 근대 |
| 큐레이션 | 하이브리드 — 자동 ranking 후보 → 형 검수 → `featured_poets` / `featured_poems` 테이블 |
| 탑 메뉴 | 한시 입문(드롭다운: 중국/한국) · 서적 · 시인 · 검색 · 한자와 한문 · 작성 도우미 · 커뮤니티 |
| 번역 워크플로우 | qwen 로컬(jinserver) 샘플 10수 검수 → 합격이면 일괄 / 불합격이면 deepseek4 또는 qwen 3.6 API |
| MVP 노출 정책 | 중국·한국 동시 출시. 번역 미완분은 "AI 번역 진행 중" 배지로 원문 노출 |

## 기존 [coding-rules.md](../../.rules/coding-rules.md)와의 정합성

- 기존 룰: "Vanilla JS — 프레임워크 없이 순수 HTML/CSS/JS"
- 본 마스터 플랜에서 **Astro Node SSR**로 전환하므로 룰을 갱신해야 한다.
- 갱신안: "Astro 컴포넌트 + 서버 측 PostgreSQL 직접 쿼리. 클라이언트 사이드 SPA 프레임워크는 도입하지 않는다(Vanilla JS만 client-side에 사용)."
- 룰 파일 갱신은 본 spec 승인 이후 별도 PR로 처리.

# IA 트랙 정의

## 🅐 책 트랙 (Volume Mode)

**목적**: 전권 보유 책을 색인·순서대로 정독.
**대상**: 당시삼백수, 전당시, 그리고 향후 추가될 전권 수록 가능 책.

### 라우트
| URL | 컨텐츠 |
|---|---|
| `/books` | 책 카탈로그 (카드 그리드) |
| `/books/[slug]` | 책 표지 페이지: 서지·편자·시대 + 진입 메뉴 (권별 / 시인별 / 색인) |
| `/books/[slug]/volumes` | 권/章 목차 |
| `/books/[slug]/volumes/[n]` | 한 권 안의 시 목록 |
| `/books/[slug]/poets` | 책에 등장하는 시인 인덱스 |

### 거대 책(전당시 900권) navigation
- 권 색인을 시대(초당/성당/중당/만당) 그룹핑 + sticky 사이드바
- 권 → 시인 → 시 트리 lazy load
- "이 권 안 검색" 미니 검색바
- "랜덤 시" 버튼

## 🅑 큐레이션 트랙 (Era Mode) — 핵심

**목적**: 시대→대표시인→대표작 흐름으로 입문자 친화 큐레이션.
**대상**: 모든 시 (책 종속 X).
**원칙**: 시대 한 페이지 안에서 시인 대표작까지 cascade. 깊이 2단(시대 페이지 → 시 단건)만 유지.

### 라우트
| URL | 컨텐츠 |
|---|---|
| `/china` | 중국 권역 진입 — 시대 5개 타임라인 |
| `/korea` | 한국 권역 진입 — 시대 6개 타임라인 |
| `/eras/[slug]` | 시대 한 페이지 (cascade UX) |

### `/eras/[slug]` 페이지 구조 (cascade)
- 헤더: 시대명·연도 + 시대 개요 에디토리얼(3-5문단)
- **데스크탑**: 좌우 2컬럼
  - 좌측 sticky: 대표시인 리스트 (시인 카드, 시기 그룹)
  - 우측: 선택된 시인의 약전 미니 + 대표작 5-10수 카드 + "전체 시 보기 →" CTA
  - URL: `/eras/tang?poet=li-bai` 형태로 시인 선택을 query string에 반영(딥링크)
- **모바일**: 시인 카드 수직 cascade, 클릭 시 아코디언 펼침

## 🅒 시인 백과

| URL | 컨텐츠 |
|---|---|
| `/poets` | 시인 인덱스 (필터: 권역×시대×작품수) |
| `/poets/[slug]` | 시인 단건 (약전 + 대표작 + 동시대 시인 + 수록 책) |
| `/poets/[slug]/poems` | 시인의 전체 시 (검색·필터·페이징, 별도 페이지) |

## 🅓 작품 발견

| URL | 컨텐츠 |
|---|---|
| `/poems` | 작품 인덱스 (필터: 권역·시대·체재·번역상태) |
| `/poems/[id]` | 시 단건 (모든 트랙 종착지) |
| `/search?q=` | 통합 검색 (full-text + 시맨틱 hybrid) |

### `/poems/[id]` 컨텍스트 링크 (트랙 회귀)
- 📚 *『당시삼백수』 권5으로 돌아가기*
- 🌊 *당대 시인 페이지로*
- 👤 *이백의 모든 시 보기*
- ✨ *비슷한 시 추천 (시맨틱)*

# URL/slug 규칙

| 타입 | 규칙 | 예시 |
|---|---|---|
| 중국 시인 | 핀인 + 하이픈, 성-이름 | 李白 → `li-bai`, 杜甫 → `du-fu`, 王維 → `wang-wei` |
| 한국 시인 | 국립국어원 로마자 + 하이픈 | 최치원 → `choe-chiwon`, 정지상 → `jeong-jisang`, 이황 → `yi-hwang` |
| 동명이인 | 시대/호 suffix | `kim-suyeong-modern` vs `kim-suyeong-joseon` |
| 책 | 짧은 영문 약칭 | 唐詩三百首 → `tang300`, 全唐詩 → `quantangshi`, 東京雜記 → `donggyeong-japgi` |
| 시대 | 영문/음역 | 당대 → `tang`, 고려 → `goryeo`, 조선후기 → `joseon-late` |
| 시 | DB 글로벌 숫자 ID | `/poems/12345` |

시(poem)만 숫자인 이유: 〈無題〉·〈感遇〉·〈春望〉 같은 동명이작이 너무 많아 영문 slug가 충돌. 페이지의 `<title>`/OG 미리보기에서 "靜夜思 · 李白 — 한시나루"로 보이게 보완.

# 데이터 통합 모델 (jds 스키마 변경 요약)

상세는 jds 측 spec [`jds/docs/spec/2026-04-27-hanshinaru-integration.md`](../../../jds/docs/spec/2026-04-27-hanshinaru-integration.md) 참조.

## 변경 요약

- `poets` 테이블: `country CHAR(2)`, `slug VARCHAR(64)` 컬럼 추가
- `poems` 테이블: `country CHAR(2)` 컬럼 추가, `volume` nullable 변환
- 새 테이블 `books` (id, slug, title_zh, title_ko, country, era_period, compiler_id, intro_ko, has_full_volumes BOOL)
- 새 테이블 `poem_sources` (poem_id, book_id, position) — 한 시가 여러 책에 수록 대응
- 새 테이블 `featured_poets` (era_slug, poet_id, rank, picked_by, picked_at, note)
- 새 테이블 `featured_poems` (era_slug, poem_id, rank, picked_by, picked_at, note)

`books.has_full_volumes`로 책 트랙 노출 여부 판별.

## 한국 한시 import 매핑

원천: [korean-poems-chronology.v1.json](../../public/index/korean_poems_chronology.v1.json), [korean-poets-chronology.v1.json](../../public/index/korean_poets_chronology.v1.json)

| 한국 데이터 | jds 컬럼 |
|---|---|
| `poemId` (KHS-CHOE-W1-0001) | 별도 컬럼 `external_id` 또는 `poems.id` 신규 시퀀스 |
| `author.zh / .ko` | `poets.name_zh / .name_ko` |
| `author.authorId` (KAUTH-CHOE-CHIWON) | `poets.title_id` + `poets.slug` (slug 변환) |
| `era.label` ('신라 말') | `poets.era_period` |
| `era.startYear / endYear` | `poets.life_birth/death` 보조 |
| `text.poemZh` | `poems.body_zh` |
| `sourceWork.collectionTitle` ('孤雲集 卷一') | `books.title_zh` + `poem_sources.position` |
| `rights.*` | jds에 미구현. 향후 `poem_rights` 테이블 추가 검토 |

번역 미완분은 `poems.translation_ko = NULL`, `status = 'parsed'`로 적재. UI에서 "AI 번역 진행 중" 배지.

# 인프라

```
[브라우저]
   ↓ HTTPS (CF Tunnel)
[jinas: docker-compose]
  ├─ jds-db-1            pgvector/pg17     ← 단일 SoT
  ├─ jds-api-1           FastAPI           ← 외부 공개용 (선택)
  └─ hanshinaru-web-1    Astro Node SSR    ← 신규
        ├─ src/lib/db.ts (postgres.js connection pool)
        └─ src/pages/**  Astro endpoints + SSR pages
```

- DB 직접 쿼리: `postgresql://hanshinaru_ro:****@jds-db-1:5432/jds` (read-only role 권장)
- 시맨틱 검색·복잡 집계는 jds API 호출 가능(선택)

## 메뉴 시스템

기존 [src/lib/menu.ts](../../src/lib/menu.ts)는 Supabase `site_menu` 테이블에서 동적 fetch.
이번 재구축에서:
- 메뉴 SoT를 [src/data/navigation.json](../../src/data/navigation.json)으로 단일화 검토 (Supabase 의존 정리)
- 또는 site_menu 테이블 갱신만으로 메뉴 변경 가능 — 형 결정 필요

# 작업 단계 (2주)

## Week 1 — 데이터 통합 + 번역 시동
| Day | 작업 | 위치 |
|---|---|---|
| 1 | jds alembic 마이그레이션 (스키마 변경만) | jds |
| 1-2 | 한국 한시 import 스크립트 작성 + dry-run | jds |
| 2 | import 본 실행 (시인 148명 + 시 1,616건 흡수) | jinas DB |
| 3 | qwen 로컬 샘플 10수 번역 + 품질 판정 | jinserver |
| 3-5 | 한국 한시 일괄 번역 (qwen 로컬 또는 API) | jinserver |
| 5 | 임베딩 생성 (1,616수, $0 추정) | jinas |

## Week 2 — 사이트 SSR + 핵심 라우트 4개
| Day | 작업 | 위치 |
|---|---|---|
| 6 | Astro `@astrojs/node` adapter 추가 + `output: 'server'` 전환 | hanshinaru |
| 6 | jinas docker-compose에 `hanshinaru-web` 추가 | jinas |
| 7-8 | `/poems/[id]`, `/poets/[slug]` 라우트 + DB 쿼리 헬퍼 | hanshinaru |
| 9 | `/books/[slug]`, `/eras/[slug]` 라우트 + cascade UX | hanshinaru |
| 10 | navigation 한국 시대 분류 보강 + 홈 hero 갱신 | hanshinaru |
| 11 | CF Tunnel → hanshinaru.kr 도메인 연결 | DNS |
| 12 | 통합 검색(`/search`) — full-text 우선, 시맨틱은 후속 | hanshinaru |

# 미정 사항 (후속 결정)

- 메뉴 SoT 일원화 (navigation.json 단일 vs site_menu 테이블 유지)
- 큐레이션 자동 ranking 알고리즘 (단순 `poem_count` vs 위키 인용수 등 외부 신호 결합)
- 한자 학습·작성 도우미 메뉴 통합 시점
- `poem_rights` 테이블 도입 시점 (한국 한시 권리 정보 보존)

# 후행 문서

- [ ] handoff: `docs/handoff/2026-04-27-site-rebuild-kickoff.md`
- [ ] 페이지 컴포넌트 spec (Week 2 진입 시)
- [ ] 큐레이션 ranking 알고리즘 spec (Week 1 후반)
