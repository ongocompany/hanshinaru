---
epic_id: TBD
doc_type: spec
status: draft
title: 시대 페이지 UI 폴리싱 (사이트 톤 정합성·반응형·동양적 미감)
date: 2026-04-29
author: 민철
---

# 목적

D 라운드 cycle 3b에서 시대 페이지 4섹션 + Supabase fetch가 운영 반영됐으나, **디자인 폴리싱 미완**. 임시 인라인 CSS로 기능만 동작 — 한시나루 홈 톤(서화 콜렉션·동양적 미감)과 정합되지 않음.

# 현재 상태

- `src/components/EraContent.astro` 안 CSS:
  - border-radius 4px, gap 12px, 회색 박스 — placeholder 수준
  - serif/sans-serif 혼재, 한자 폰트 강조 미흡
  - 모바일 grid 검증 없음
- 빈 시대(`data_pending`) 안내 박스 디자인 미흡
- 운영 hanshinaru.kr 홈·`/hansi/general/`·`/hansi/chinese/` 등의 디자인과 톤 단절

# 작업 영역

## 1. 디자인 토큰 추출
- 홈·hansi general 페이지에서 색·폰트·간격·border 토큰 수집
- `src/styles/tokens.css` 또는 SidebarLayout의 globals 활용 검증
- EraContent.astro에 동일 토큰 적용

## 2. 한자 본문 표시 ★
- 시 본문 `body_zh` Noto Serif SC 강조 + 라인 높이·간격 정합
- 한자 글자 크기 옵션 (사용자 설정?)
- 세로쓰기 검토 (writing-mode: vertical-rl) — 옵션 또는 미적용?
- 번역문(`translation_ko`) 본문과의 시각 위계 (구분선·들여쓰기·색)

## 3. 시인 카드 / 시 카드 디자인
- 동양적 여백 미감 (현재 box-with-border 너무 서양 UI)
- hover/focus 상태
- 클릭 → 시 본문(`/poems/[id]`) 또는 시인 상세(`/hansi/{c,k}/poets/[slug]`) 라우팅 (SSR 결정 후)

## 4. 모바일 반응형
- 360px·768px·1024px 브레이크포인트 검증
- 시인 grid: 360px 이하에서 스택
- 시 카드: 좁은 화면에서 한자·번역 위계 유지

## 5. 빈 시대 placeholder
- 현재 회색 박스 + "자료 수집 중" — 너무 사무적
- 동양화 일러스트 또는 시대 한자 워터마크?
- 별 세션 spec과 연결 (CN 데이터 수집 / KR 근대 적재)

## 6. 시대 페이지 간 톤 일관성
- CN 10 + KR 6 = 16페이지가 모두 동일 컴포넌트라 일관성은 자동
- 단 description/characteristics 텍스트 분량 편차 큼 (현재 시범 2시대만 있음). 빈 텍스트 시 placeholder 대비 대각선 hatch 등 시각적 빈자리 처리

# 작업 외 위험

- **UI 폴리싱은 AI 단독 진행 위험**. 형의 디자인 감각·운영 톤 의도 input 필수.
- 본 spec은 형이 페이지 보면서 "여기 이렇게" 식 인터랙션 큐로 진행하는 게 정합적.

# 개시 trigger

다음 세션 옵션 중 하나로 선택. 우선순위는 형이 결정:
- A. **본 spec (UI 폴리싱)** — 디자인 통일성 우선
- B. 큐레이션 텍스트 작성 cycle — 남은 14시대 description/characteristics
- C. "오늘의 한시" 페이지 (poets.astro) — 일일 회전 풀 활용
- D. reading 검색 페이지

# 영향 받는 파일

- `src/components/EraContent.astro` (전면 CSS 재작성)
- `src/styles/tokens.css` (신규? 또는 globals 통합)
- 시 본문 표시는 향후 `/poems/[id]` SSR 페이지에도 재사용
