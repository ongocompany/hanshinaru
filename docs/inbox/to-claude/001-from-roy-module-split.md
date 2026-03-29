---
from: roy
to: claude
type: handoff
priority: normal
created: 2026-03-29 20:40
sprint: SC-001
---

# Sprint Contract SC-001: app.js / board.js 모듈 분리

## 배경
Phase 0-1(인프라 정비 + 정크 정리)은 로이가 완료함. 커밋: `7345a1e`
Phase 2 모듈 분리는 민철 담당.

## 목표
`app.js` (2,222줄)와 `shared/board.js` (3,381줄)를 기능별 모듈로 분리한다.

## app.js 분리 계획

현재 `timeline/index.html`에서 로드. 7개 모듈 후보:

| 모듈 | 줄 범위 | 내용 |
|------|---------|------|
| `timeline/utils.js` | 33~489 | 텍스트 파싱, 주석 시스템, HTML 이스케이프, 이름 정규화 |
| `timeline/tooltip.js` | 491~748 | 호버 팝업, 주석 툴팁, 미니 카드 팝업 |
| `timeline/timeline-render.js` | 825~1104 | v2/v3 시대별 타임라인, 시인 카드, 역사 카드 |
| `timeline/poem.js` | 1195~1583 | 시 상세 렌더링 (원문/번역/병음/평측/TTS/유튜브) |
| `timeline/author-modal.js` | 1585~1829 | 시인 모달 (약력, Leaflet 지도, vis-network 관계도) |
| `timeline/data.js` | 10~31, 1986~2111 | 상수, Supabase 로딩, 인덱스 빌드, STATE, UI 설정 |
| `timeline/app.js` (메인) | 2113~2222 | 초기화 오케스트레이션만 |

**삭제 대상** (~180줄):
- 1106~1136: 주석 처리된 v1 렌더러 (renderAuthorCard, renderHistoryCard 등)
- 1831~1911: deprecated openHistoryModal()
- 1974~1982: 주석 처리된 history card 클릭 핸들러

**주의사항**:
- 빌드 시스템 없는 Vanilla JS → `<script>` 로드 순서 관리 필요
- 전역 변수 의존성 정리 (STATE, 각 함수 간 참조)
- `timeline/index.html`의 스크립트 태그 업데이트

## board.js 분리 계획

현재 `shared/board.js`로 커뮤니티 페이지 6개에서 로드. 8개 모듈 후보:

| 모듈 | 줄 범위 | 내용 |
|------|---------|------|
| `shared/board/core.js` | 11~155, 157~481 | 상태관리, Supabase API (CRUD/댓글/좋아요), 유틸리티 |
| `shared/board/feed.js` | 526~865, 2277~2315 | 피드 렌더링, 카드/리스트 뷰, 무한스크롤 |
| `shared/board/write.js` | 869~1249, 2015~2101 | 글쓰기 폼, Quill 에디터, 파일첨부 |
| `shared/board/comments.js` | 2105~2193, 2846~2931, 3173~3267 | 댓글 렌더링 + 핸들러 |
| `shared/board/showcase.js` | 622~689, 2572~2752 | 갤러리 카드, 시 모달 |
| `shared/board/ai-bg.js` | 1326~2012 | AI 배경 생성 (Gemini API, 프롬프트 빌더, 업로드) |
| `shared/board/handlers.js` | 2318~2970 | 클릭/폼 이벤트 핸들러 |
| `shared/board/init.js` | 3295~3380 | 초기화, window.Board 노출 |

**주의사항**:
- 커뮤니티 페이지 6개(forum/qna/notice/showcase/news/index)의 `<script>` 태그 전부 수정 필요
- IIFE로 감싸져 있음 → 모듈 분리 시 네임스페이스 전략 결정 필요
- Quill, AuthState, Supabase 외부 의존성 로드 순서 유지

## 완료 조건
- [ ] app.js 7개 모듈로 분리, 타임라인 페이지 정상 동작
- [ ] board.js 8개 모듈로 분리, 커뮤니티 6개 페이지 정상 동작
- [ ] dead code 삭제
- [ ] work_change_log.md에 START/END 기록

## 작업 방식
- `claude-chore-module-split-01` 브랜치에서 작업
- 완료 후 `docs/inbox/to-codex/`에 리뷰 요청 생성
