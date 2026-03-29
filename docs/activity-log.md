# 민철 활동 로그
> 세션 시작 시 이 파일을 읽어서 연속성을 유지합니다.
> 마지막 업데이트: 2026-03-29

---

## 프로젝트 상태 요약

### 배포
- **도메인**: hanshinaru.kr (GitHub Pages, main 브랜치)
- **리포**: github.com/ongocompany/hanshinaru
- **마지막 커밋**: 2026-03-29 (`b573bdb` SC-002 Phase 2)
- **자동화**: GitHub Actions 뉴스 크롤러 + Astro 빌드 배포 (신규)

### 현재 진행 중: SC-002 Astro 전환
- **결정 사항**: 전면 Supabase DB + Astro SSG 전환
- **Phase 1 완료**: Astro 초기화 + UI 레이아웃 확정
- **Phase 2 완료**: DB 스키마 설계 (site_menu, articles)
- **Phase 3 완료**: DB 연결 + 동적 라우팅 + admin 에디터
- **다음**: Phase 4 — 페이지별 템플릿 전환 (하드코딩 → DB)

### 완료된 주요 작업
- SC-001: app.js(7모듈) + board.js(8모듈) 분리 완료
- Astro 6.1 프로젝트 셋업 (Node 22, GitHub Actions)
- 통일 레이아웃 시스템: Nav + Sidebar(재귀 3단계) + Content + Footer
- 모바일 반응형 동시 설계
- Noto Serif SC 웹폰트 (CJK Extension A~E, 고한자 지원)
- 콘텐츠 DB 스키마: site_menu + articles 테이블
- Supabase DB 마이그레이션 완료 (기존)
- **새 Supabase 계정 세팅 (2026-03-30)**
  - 프로젝트: hanshinaru (`iplxexvmrnzlqglfqrpg`, ap-northeast-2)
  - 테이블: profiles, site_menu, articles + RLS + 트리거
  - Storage: article-images 버킷
  - Admin: admin@hanshinaru.kr
  - 크리덴셜 3곳 교체 (supabase.js, auth-state.js, components.js)
- **Astro DB 연결 (Phase 3)**
  - src/lib/supabase.ts — 빌드 타임 REST fetch
  - src/lib/menu.ts — site_menu → 트리 변환
  - Nav.astro, Sidebar.astro → DB fetch로 교체
  - [...slug].astro — articles 동적 라우팅
- **Admin 아티클 에디터 (Phase 3)**
  - admin/articles.html + articles.js
  - Quill WYSIWYG (이미지/비디오 삽입)
  - 메뉴 관리 모달 (CRUD + 순서 변경)
- 메인 페이지 히어로 + 오늘의 시 구현
- 시인 모달 두루마리 UI
- 관리자 툴 (데이터/역사 관리)
- 타임라인 시대별 구조
- 한국의 한시 기본 구조
- 커뮤니티 게시판 기본 구조

### 미완료/대기 중인 작업
- **SC-002 Phase 4**: 페이지별 템플릿 전환 (하드코딩 → DB)
- **SC-002 Phase 5**: admin 아티클 에디터 (Quill + 이미지 업로드)
- timeline(history) 페이지 개편 — 별도 논의 필요 (모달 방식 UX 문제)
- 한시 작성 도우미 (MVP)
- TTS 기능 연동 (Qwen3-TTS)
- 콘텐츠 마이그레이션 (readdy 서버)

### 정리가 필요한 기술 부채
- tools/ 1.2GB (tts-studio) git 분리
- 루트 임시 파일 정리
- settings.local.json 경로 수정

---

## 최근 활동

### 2026-03-29
- **SC-001 완료**: app.js(2,222줄→7모듈) + board.js(3,381줄→8모듈) 분리
  - board.js는 `window._B` 네임스페이스 패턴으로 IIFE 분리
  - dead code ~180줄 삭제, 커뮤니티 4개 + 타임라인 HTML 업데이트
  - 커밋: `b951637`
- **SC-002 Phase 1 완료**: Astro 프로젝트 초기화 + UI 레이아웃 확정
  - Astro 6.1, Node 22, GitHub Actions 배포 워크플로우
  - BaseLayout, SidebarLayout, Nav, Sidebar(재귀 3단계), Footer 컴포넌트
  - 디자인: 본문 17px(가독성↑), 독립 스크롤, 사이드바 밀도 조정
  - Noto Serif SC 웹폰트 (CJK 확장 한자 지원)
  - 커밋: `749266a`
- **SC-002 Phase 2 완료**: 콘텐츠 DB 스키마 설계
  - `site_menu` 테이블: 재귀 parent_id, 3단계 메뉴, RLS
  - `articles` 테이블: slug 기반, Quill HTML body, cover_image, status
  - 마이그레이션 SQL: `supabase/migrations/001_site_menu_and_articles.sql`
  - 커밋: `b573bdb`
- **의사결정 기록**:
  - 저장 방식: 전면 Supabase DB (구조적 통일성 우선)
  - 프레임워크: Astro SSG (정적 사이트 + GitHub Pages 최적)
  - 폰트: Noto Serif SC (CJK Extension A~E, 고문서/고시 대응)
  - body 방식: Quill HTML (이미지/YouTube 에디터 내 직접 삽입)

### 2026-03-27
- 프로젝트 재개 준비 — CLAUDE.md 전면 개편 (민철 페르소나 재설정)
- 연쇄 기억법 기반 기록 시스템 구축 (activity-log, architecture.md)
- 프로젝트 현황 분석 완료
- **리팩토링 계획서 작성 완료** → `docs/refactoring-plan.md`
  - Git 59커밋 분석, 코드 구조 분석, 성능 분석
  - 4단계 실행 계획 (즉시정리 → 코드품질 → 성능 → 아키텍처)
  - 긴급 이슈: Supabase 크리덴셜 4곳 하드코딩, 31MB PSD in git, API키 노출 가능성

### 2026-02-28 (마지막 활성 작업)
- 뉴스 시스템 2건 수정
- 한시 소식 자동 업데이트

---

## 참조 문서
- 전체 요구사항: `docs/Requirement_Summary_20260228.md`
- 형의 지시서 원본: `docs/FromJin/` (21개 파일)
- 핸드오프 문서: `docs/handoff/` (8개 파일, 역사적 참고)
- 작업 변경 로그: `docs/work_change_log.md`
- 기술 결정 기록: `docs/architecture.md`
