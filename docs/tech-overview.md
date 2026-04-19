---
epic_id: tech-overview
doc_type: reference
status: active
title: 한시나루 기술 개요
date: 2026-04-19
---

# 한시나루 기술 개요

한시(漢詩) 감상·학습 웹 서비스 (hanshinaru.kr). 이 문서 하나로 프로젝트 전체를 파악할 수 있도록 작성됨.

---

## 1. 프로젝트 개요

- **서비스명**: 한시나루 (hanshinaru.kr)
- **성격**: 당시삼백수(300수) 기반으로 시작 → 전당시(47,198수) 확장 예정
- **주요 기능**: 시 감상/검색, 시인 탐색, 역사 타임라인, 한시 작성 도우미, AI 저작 도구

---

## 2. 프론트엔드

### 기술 스택

| 항목 | 내용 |
|------|------|
| 언어 | Vanilla HTML / CSS / JavaScript (프레임워크 없음) |
| 인증/DB | Supabase JS v2 (CDN) |
| 배포 | GitHub Pages (main 브랜치 자동 배포) |
| 도메인 | hanshinaru.kr (CNAME) |
| CI/CD | GitHub Actions (뉴스 크롤러 자동화) |

### 사이트 페이지 구조

```
/ (index.html)               ← 메인 (Hero + 오늘의 시 + 섹션 소개)
/tang300/                    ← 당시삼백수 300수 (현재 핵심 콘텐츠)
/poem/                       ← 시 상세 페이지
/poets/                      ← 시인 목록/상세
/chinese-poetry/             ← 중국 한시 (서브 메뉴 포함)
/korean-poetry/              ← 한국 한시
/history/                    ← 역사 타임라인
/hanja/                      ← 한자·한문
/community/                  ← 커뮤니티 (게시판)
/writing-helper/             ← 한시 작성 도우미
/auth/                       ← 로그인/회원가입
/admin/                      ← 관리자 도구
/tools/ai-writer/            ← AI 저작 도구 (개발 중)
/tools/tts-studio/           ← TTS 스튜디오 (1.2GB, git 분리 필요)
```

### 공용 모듈 (`shared/`)

| 파일 | 역할 |
|------|------|
| `supabase.js` | Supabase 클라이언트 초기화 → `window.sb`, `window.SB_REST_URL` |
| `nav.html` | 공용 네비게이션 바 |
| `footer.html` | 공용 푸터 |
| `styles.css` | 공용 스타일 |
| `auth-state.js` | 로그인 상태 관리 |
| `components.js` | 공용 UI 컴포넌트 |
| `board/` | 게시판 모듈 (board.css 포함) |

### 디자인 원칙

- 네비게이션 바: 배경 `#1C2122`, 글씨 흰색
- 본문 최대폭: 1300px, 가운데 정렬
- 좌우 2분할 레이아웃: 좌측 300px 고정, 우측 1000px 스크롤
- 배경색: `#FBFAFA`

---

## 3. 데이터 레이어

데이터는 3개 레이어로 구성됨.

### 3-1. 정적 JSON (`public/index/`)

사이트 빌드/배포와 함께 서빙되는 정적 파일들.

| 파일 | 내용 |
|------|------|
| `poems.compact.json` | 시 목록 (컴팩트 포맷) |
| `poems.v3.json` | 시 전체 데이터 (v3) |
| `db_author.with_ko.json` | 시인 정보 (한국어 포함) |
| `history_cards.json` | 역사 카드 데이터 |
| `korean_timeline.json` | 한국 타임라인 |
| `ui_settings.json` | UI 설정값 |
| `pingshui_yun.json` | 평수운 데이터 |
| `hyeonto_data.json` | 현토 데이터 |
| `poet_verses.json` | 시인별 대표 구절 |
| `news_articles.json` | 한시 관련 뉴스 |

**고품질 owned 콘텐츠**: `poems.full.owned.json` (당삼백 기반, translationKoOwned / notesOwned / jipyeongKoOwned / ownedContentMeta 포함)

### 3-2. Supabase DB (동적 콘텐츠)

- **URL**: `https://iplxexvmrnzlqglfqrpg.supabase.co`
- **API Key** (anon/public): `sb_publishable_SBqquD4OkM6a93H3dMPNRQ_X5JChwWI`
- **REST API**: `/rest/v1`

주요 테이블:
| 테이블 | 내용 |
|--------|------|
| `articles` | 사이트 아티클 (slug, Quill HTML body, cover_image, status) |
| `site_menu` | 재귀 parent_id 기반 3단계 메뉴 구조 |
| 게시판 관련 | 커뮤니티 게시판 |

- 인증: Supabase Auth (회원가입/로그인)
- 마이그레이션 SQL: `scripts/supabase_schema.sql`

### 3-3. JDS API (전당시, 연동 예정)

전당시(全唐詩) 47,198수를 제공하는 내부 FastAPI 서버.

- **운영**: jinas (Synology NAS) Docker Compose
- **내부망**: `http://jinas:8080`
- **Tailscale**: `http://100.115.194.12:8080`
- **외부 노출**: 미완 (Cloudflare Tunnel 또는 Synology 역방향 프록시 예정)

주요 엔드포인트:

| 경로 | 설명 |
|------|------|
| `GET /api/poems` | 시 목록 (필터: volume, poet, category, q) |
| `GET /api/poems/{id}` | 시 상세 (annotations 포함) |
| `GET /api/poems/search` | fulltext / semantic / hybrid 검색 |
| `GET /api/poets` | 시인 목록 |
| `GET /api/poets/{id}` | 시인 상세 |
| `GET /api/hanshinaru/poems` | 한시나루 호환 포맷 |
| `GET /api/hanshinaru/poets` | 한시나루 호환 시인 포맷 |

각 시 필드: `body_zh` (원문), `translation_ko` (번역), `commentary_ko` (JSON: reading+commentary+notes), `jipyeong_zh` (집평), `preface_zh` (서문)

시맨틱 검색: pgvector (gemini-embedding-001, dim=768, HNSW), mode=semantic/hybrid 지원

---

## 4. 백엔드 / 인프라

### GitHub Pages + Actions

- main 브랜치 push → 즉시 배포 (별도 빌드 없음, 순수 정적)
- GitHub Actions: 뉴스 크롤러 (`scripts/crawl_news.js`) 자동 실행

### JDS 서버 (전당시)

```
jinas (Synology NAS, 192.168.0.3)
  └── Docker Compose
       ├── jds-api-1 (FastAPI + uvicorn, :8080→:8000)
       └── jds-db-1  (pgvector/pgvector:pg17, :5433→:5432)
```

- DB: PostgreSQL 17 + pgvector
- 테이블: poets, poems, annotations, poem_embeddings
- 네트워크: Tailscale Mesh VPN

### 도메인/네트워크

- hanshinaru.kr → GitHub Pages CNAME
- 개발 머신: jinmbp (로컬)
- Supabase 프로젝트: `iplxexvmrnzlqglfqrpg`

---

## 5. 스크립트 / 빌드 도구 (`scripts/`)

Node.js + Python 혼합. 주요 스크립트:

| 스크립트 | 용도 |
|----------|------|
| `build_poems_v3.js` | poems.v3.json 빌드 |
| `migrate_to_supabase.js` | Supabase 마이그레이션 |
| `merge_owned_data.js` | owned 콘텐츠 병합 |
| `crawl_news.js` | 한시 뉴스 크롤링 (CI) |
| `auto-push.sh` | 자동 push 스크립트 |
| `generate_qwen_translation.py` | Qwen 번역 생성 |
| `generate_gemini_translation_sample.py` | Gemini 번역 샘플 |

---

## 6. 개발 워크플로우

### 3AI 체제

| AI | 페르소나 | 역할 | 설정 |
|----|----------|------|------|
| Claude | 민철 | 설계 + 구현 리드 | CLAUDE.md |
| Gemini | 재민 | 자료수집 + 정리 | docs/ai-roles/gemini.md |
| Codex | 지훈 | 리뷰 + 운영 | AGENTS.md |

- AI 간 소통: `docs/inbox/` 프로토콜
- 브랜치: **main 직접 작업** (worktree는 사용자 확인 후 분리)
- 코딩 원칙: `.rules/coding-rules.md` 참조

### 세션 시작 순서

1. `docs/handoff/` 최신 파일 읽기
2. `.rules/` 숙지
3. `git log --oneline -20` 확인
4. 작업 시작

### 종료 시

`docs/handoff/YYYY-MM-DD-{주제}.md` 핸드오프 문서 작성

---

## 7. 현재 진행 중인 작업 (2026-04)

| 항목 | 상태 | 파일 |
|------|------|------|
| AI Writer | 구현 중 (세션 영속성 완료) | `tools/ai-writer/` |
| 전당시 JDS 연동 | 기획 중 | — |

### 기술 부채

- `tools/tts-studio/` 1.2GB → git에서 분리 필요 (.gitignore + 별도 저장소)
- Supabase anon key 하드코딩 → 환경변수화 필요 (현재 public key이므로 우선순위 낮음)
- `shared/template-5a.html`, `template-5b.html` → 정리 필요

---

## 8. 자매 프로젝트

| 프로젝트 | 내용 |
|----------|------|
| JDS | 전당시 파싱·번역·API 서버 (`/development/jds`) |
| 한자한자 (hanjahanja) | 한글→한자 변환앱, 한자 사전 데이터 공유 가능 |
| hime | 한자 입력기 |
