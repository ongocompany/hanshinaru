# Work Change Log

작성일: 2026-02-12  
목적: 소스 파일 수정 작업의 시작/종료 맥락을 공용으로 기록해 사용자(JIN) + GPT + Claude + Gemini 협업 커뮤니케이션을 안정화한다.

## 1) 기록 원칙
1. 소스 파일(`index.html`, `app.js`, `styles.css`, `public/index/*.json` 등) 수정 작업은 시작 전에 `START` 로그를 남긴다.
2. 작업이 끝나면 같은 `Task ID`에 `END` 로그를 남긴다.
3. `파일 경로 + 라인 번호`를 가능한 범위에서 기록한다.
4. 요청자와 변경 이유를 반드시 적는다.

## 2) 로그 템플릿
아래 블록을 복사해 사용한다.

```md
## [Task ID] YYYY-MM-DD-HHMM-<owner>-<topic>

### START
- Time: YYYY-MM-DD HH:MM
- Owner: JIN | GPT | Claude | Gemini
- Requester: JIN | GPT | Claude | Gemini
- Request Summary: (무엇을 요청했는지 1~2문장)
- Why: (변경 이유/목적)
- Planned Scope:
  - 파일: `path/to/file`
  - 예상 변경: (예: 버튼 스타일 정리, 모달 이벤트 버그 수정)
- Status: In Progress

### END
- Time: YYYY-MM-DD HH:MM
- Status: Done | Partial | Blocked
- Changed Files:
  - `path/to/file:123` (핵심 변경 요약)
  - `path/to/file:45` (핵심 변경 요약)
- Validation:
  - (예: 페이지 로드 확인, 콘솔 에러 없음, 클릭 동작 확인)
- Notes:
  - (주의사항/다음 작업/미해결 이슈)
```

## 3) 예시

## [Task ID] 2026-02-12-0610-gpt-collab-log-setup

### START
- Time: 2026-02-12 06:10
- Owner: GPT
- Requester: JIN
- Request Summary: 소스 수정 시작/종료 이력을 남기는 공용 로그 파일이 필요함.
- Why: 다중 AI+사용자 환경에서 작업 맥락 유실 방지.
- Planned Scope:
  - 파일: `docs/work_change_log.md`
  - 예상 변경: 로그 문서 템플릿 추가
  - 파일: `docs/collaboration_rules.md`
  - 예상 변경: 로그 작성 규칙 연결
- Status: In Progress

### END
- Time: 2026-02-12 06:20
- Status: Done
- Changed Files:
  - `docs/work_change_log.md:1` (공용 로그 문서 신규 생성)
  - `docs/collaboration_rules.md:1` (공용 작업 로그 규칙 섹션 추가)
  - `README.md:1` (Work Change Log 링크 추가)
- Validation:
  - 문서 파일 생성/링크 확인 완료
- Notes:
  - 이후 소스 파일 수정 시, 이 문서에 START/END를 남기고 작업 진행.

## 4) 실제 작업 기록 (요약)

## [Task ID] 2026-02-12-0640-gpt-collab-docs-setup

### START
- Time: 2026-02-12 06:40
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 협업 규칙, 다중 환경 가이드, README 링크 체계를 정비.
- Why: 다중 AI + 다중 기기 협업 시 혼선/충돌 최소화.
- Planned Scope:
  - 파일: `docs/collaboration_rules.md`
  - 예상 변경: Gemini 포함 규칙 업데이트
  - 파일: `docs/github_multi_environment_guide.md`
  - 예상 변경: 시작/종료 루틴 및 용어/자동화 가이드 추가
  - 파일: `README.md`
  - 예상 변경: 협업 문서 링크 추가
- Status: In Progress

### END
- Time: 2026-02-12 07:10
- Status: Done
- Changed Files:
  - `docs/collaboration_rules.md:1` (Gemini 포함, 공용 로그 규칙/아바타 규칙 반영)
  - `docs/github_multi_environment_guide.md:1` (다중 기기 루틴 + Git 용어 + 자동화 함수 예시 추가)
  - `README.md:1` (Quick Links 및 AI 시작 프롬프트 확장)
- Validation:
  - 링크/섹션 검색(`rg`)으로 반영 확인
- Notes:
  - 코드 로직 파일(`app.js`, `styles.css`, `index.html`)은 이 작업에서 직접 수정하지 않음.

## [Task ID] 2026-02-12-0715-gpt-context-rename

### START
- Time: 2026-02-12 07:15
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 한글 파일명 깨짐 이슈로 컨텍스트 문서명을 영문으로 변경.
- Why: OS/터미널 환경에서 파일명 인코딩 혼선 방지.
- Planned Scope:
  - 파일: `docs/project_context.md` (신규 경로)
  - 예상 변경: 파일명 이전
  - 파일: `README.md`, `docs/collaboration_rules.md`, `docs/github_multi_environment_guide.md`
  - 예상 변경: 참조 경로 업데이트
- Status: In Progress

### END
- Time: 2026-02-12 07:25
- Status: Done
- Changed Files:
  - `docs/project_context.md:1` (기존 한글 파일명에서 영문 파일명으로 전환)
  - `README.md:6` (프로젝트 컨텍스트 링크 경로 수정)
  - `docs/collaboration_rules.md:128` (컨텍스트 링크 경로 수정)
  - `docs/github_multi_environment_guide.md:100` (시작 프롬프트 경로 수정)
- Validation:
  - 옛 파일 미존재/신규 파일 존재 확인, 참조 문자열 검색 확인
- Notes:
  - 기존 `docs/프로젝트_컨텍스트.md`는 현재 기준 파일로 사용하지 않음.

## [Task ID] 2026-02-12-0730-gpt-persona-onboarding

### START
- Time: 2026-02-12 07:30
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: AI 아바타 규칙(민철/지훈/태훈) 반영 및 Gemini 온보딩 문서 작성.
- Why: AI별 역할/호칭 통일 및 신규 AI 빠른 합류 지원.
- Planned Scope:
  - 파일: `docs/project_context.md`
  - 예상 변경: 아바타/호칭 규칙 추가
  - 파일: `docs/collaboration_rules.md`
  - 예상 변경: 아바타/호칭 규칙 섹션 추가 및 태훈명 반영
  - 파일: `docs/gemini_onboarding.md`
  - 예상 변경: 프로젝트 설명 + 작업 이력 요약 + 시작 프롬프트 작성
- Status: In Progress

### END
- Time: 2026-02-12 07:45
- Status: Done
- Changed Files:
  - `docs/project_context.md:33` (아바타/호칭 설정 반영, Gemini 이름 태훈으로 정리)
  - `docs/collaboration_rules.md:16` (아바타/호칭 규칙 반영, Gemini 이름 태훈으로 정리)
  - `docs/gemini_onboarding.md:1` (신규 온보딩 문서 생성)
  - `README.md:10` (Gemini 온보딩 링크 추가)
- Validation:
  - 키워드 검색으로 규칙 반영 확인 (`민철`, `지훈`, `태훈`, `형님`)
- Notes:
  - 로컬 셸 자동화 함수(`tangshi_start`, `tangshi_end`)는 `~/.zshrc`에 반영됨(저장소 외부 변경).

## [Task ID] 2026-02-12-0745-jin-gpt-appjs-unknown-year-fix

### START
- Time: 2026-02-12 07:45
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 생몰년도 미상 작가가 타임라인에 표시되지 않는 문제를 수정 요청.
- Why: 생년이 없는 작가 데이터가 UI에서 누락되어 학습 흐름이 끊김.
- Planned Scope:
  - 파일: `app.js`
  - 예상 변경: 미상 연도 그룹 렌더링 + 작가명 매칭 정규화 보정
- Status: In Progress

### END
- Time: 2026-02-12 08:00
- Status: Done
- Changed Files:
  - `app.js:35` (`normalizePoetName()` 추가: 주석번호/직함 접두/공백 정규화)
  - `app.js:863` (작품 클릭 시 poet->author 매칭에 `normalizePoetName()` 적용)
  - `app.js:911` (시 데이터 그룹핑 키를 `normalizePoetName()`으로 통일)
  - `app.js:958` (author 인덱스 매핑 키 정규화 통일)
  - `app.js:1029` (`year == null` 작가를 모아 `연도 미상` 행으로 렌더링)
- Validation:
  - 코드 diff 기준으로 누락 원인 경로(연도 null 필터링) 보완 확인
  - `연도 미상` 라벨 row 추가 로직 존재 확인
- Notes:
  - 이 이력은 형님 확인 요청으로 로그에 후반영함.

## [Task ID] 2026-02-12-0900-gemini-unknown-author-plan

### START
- Time: 2026-02-12 09:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 생몰년 미상 작가 13인에 대한 후속 조사 준비 및 서칭 파라미터 구체화.
- Why: `unknown_author.md` 가이드에 따라 미상 작가의 활동 시기를 추정하기 위함.
- Planned Scope:
  - 파일: `docs/unknown_author.md`
  - 예상 변경: 조사 대상 13인의 정밀 검색 쿼리 리스트 추가 (Section 9).
- Status: In Progress

### END
- Time: 2026-02-12 09:15
- Status: Done
- Changed Files:
  - `docs/unknown_author.md:178` (2차 상세 조사 계획 및 쿼리 추가)
  - `docs/unknown_author.md:210` (2차 조사 결과 및 시대 판정 추가)
- Validation:
  - 13명 전원에 대한 활동 시기(Era) 판정 완료.
  - 문헌(당재자전, 전당시 등) 및 과거 급제 년도 교차 검증.
- Notes:
  - 서비인(西鄙人)은 성당 시기 작자 미상(또는 서씨)으로 분류.
  - 장필(張泌)은 당말~오대십국 인물이지만 만당으로 분류.

## [Task ID] 2026-02-12-1800-claude-v2-ui-renewal

### START
- Time: 2026-02-12 18:00
- Owner: Claude(민철)
- Requester: JIN
- Request Summary: UI 전면 리뉴얼 — 연도별 가로 타임라인 → 시대별(초/성/중/만당) 세로 타임라인 + 시인 이름 워드클라우드 + 호버 팝업 구조로 개편.
- Why: 76명 시인 카드가 전부 펼쳐져 있어 정보 과부하. 시대별 그룹핑 + 이름만 표시하고 호버/클릭으로 상세 접근하는 구조로 변경.
- Planned Scope:
  - 파일: `app.js`
  - 예상 변경: ERA_CONFIG, 시대별 그룹핑 함수, 팝업 시스템, 새 렌더러, main() 루프 재작성
  - 파일: `styles.css`
  - 예상 변경: 기존 카드/타임라인 CSS 주석처리 + 시대섹션/워드클라우드/팝업 CSS 추가
- Status: In Progress

### END
- Time: 2026-02-12 20:00
- Status: Done
- Changed Files:
  - `app.js:10` (ERA_CONFIG, MAIN_HISTORY_IDS 상수 추가)
  - `app.js:17` (getHistoryEra, groupByEra, groupHistoryByEra, calcPoetFontSize 유틸 함수 추가)
  - `app.js:378` (팝업 시스템: getOrCreatePopup, showPopup, hidePopup, buildPoetPopupHTML, buildHistoryPopupHTML, bindHoverPopups)
  - `app.js:574` (새 렌더러: renderPoetNames, renderMainHistoryCard, renderMinorHistoryDot, renderEraSection, renderBookend)
  - `app.js:700` (기존 renderAuthorCard, renderHistoryCard, renderPrimaryItem 블록 주석처리)
  - `app.js:847` (bindModalOpeners: .author-card → .poet-name 셀렉터 변경, 역사 모달 바인딩 제거)
  - `app.js:900` (bindAccordions: .history-detail-toggle 핸들러 추가)
  - `app.js:1009` (openHistoryModal 함수 전체 블록 주석처리)
  - `app.js:1176` (buildAuthorEvents에 era, poemCount 필드 추가)
  - `app.js:1258` (main() 렌더링 루프: 연도별 → 시대별 루프로 재작성)
  - `styles.css:36` (기존 .timeline::before, .timeline-item 등 주석처리)
  - `styles.css:82` (새 .era-section, .era-header, .era-body 등 시대 레이아웃 추가)
  - `styles.css:155` (새 .poet-names, .poet-name, .poet-sep 워드클라우드 스타일)
  - `styles.css:183` (새 .history-main-card 메인 역사카드 스타일)
  - `styles.css:272` (새 .history-minor 소규모 이벤트 점 스타일)
  - `styles.css:299` (새 .hover-popup 호버 팝업 스타일)
  - `styles.css:364` (기존 .card, .author-top, .history-top 등 블록 주석처리)
- Validation:
  - JS 문법 에러 없음 (node -c app.js 통과)
  - 로컬 서버 200 OK, 4개 시대 섹션 렌더링 확인
  - 핵심 함수 단위 테스트 통과 (getHistoryEra, ERA_CONFIG, MAIN_HISTORY_IDS)
- Notes:
  - 모든 변경점에 `[v2 리뉴얼]` 접두 주석 표기 (grep 검색 가능)
  - 기존 코드는 삭제하지 않고 블록 주석처리 (롤백 가능)
  - UI/UX 세부 디자인은 Gemini(태훈)와 후속 조율 예정
  - 구현 계획서: `~/.claude/plans/generic-frolicking-brooks.md`

## [Task ID] 2026-02-12-2030-claude-modal-map-graph

### START
- Time: 2026-02-12 20:30
- Owner: Claude(민철)
- Requester: JIN
- Request Summary: 시인 모달 내 출생지 지도(Leaflet) + 관계도(vis-network) 구현. 더미 데이터 4명(두보, 이백, 맹호연, 하지장).
- Why: 모달의 출생지/관계도 플레이스홀더를 실제 기능으로 교체. 추후 태훈이 전체 데이터 채울 예정.
- Planned Scope:
  - 파일: `index.html`
  - 예상 변경: Leaflet CSS/JS + vis-network JS CDN 추가
  - 파일: `public/index/db_author.with_ko.json`
  - 예상 변경: 4명에 birthplace(name, nameZh, lat, lng), relations(targetId, type, label, desc) 필드 추가
  - 파일: `app.js`
  - 예상 변경: initBirthplaceMap, initRelationGraph 함수 추가 + openAuthorModal 연동
  - 파일: `styles.css`
  - 예상 변경: .map-container, .graph-container CSS 추가
- Status: In Progress

### END
- Time: 2026-02-12 21:00
- Status: Done
- Changed Files:
  - `index.html:8` (Leaflet CSS/JS CDN 추가)
  - `index.html:12` (vis-network JS CDN 추가)
  - `public/index/db_author.with_ko.json:298` (C341 두보: birthplace 하남성 공현 + relations 이백=친구)
  - `public/index/db_author.with_ko.json:430` (C347 맹호연: birthplace 호북성 양양 + relations 이백=존경받음)
  - `public/index/db_author.with_ko.json:1025` (C375 이백: birthplace 사천성 면양 + relations 두보=친구, 맹호연=존경, 하지장=추천받음)
  - `public/index/db_author.with_ko.json:1519` (C398 하지장: birthplace 절강성 소흥 + relations 이백=추천)
  - `app.js:915` (initBirthplaceMap 함수: Leaflet 지도 초기화 + 마커 + 팝업)
  - `app.js:950` (initRelationGraph 함수: vis-network 관계도 + 양방향 관계 수집 + 노드 클릭 → 모달 이동)
  - `app.js:1073` (openAuthorModal: 플레이스홀더 → map-container/graph-container 교체)
  - `app.js:1108` (openAuthorModal: 모달 열린 후 initBirthplaceMap/initRelationGraph 호출)
  - `styles.css:499` (.map-container, .graph-container CSS 추가)
- Validation:
  - JSON 유효성 검증 통과 (node -e JSON.parse)
  - JS 문법 에러 없음 (node -c app.js)
  - CDN 접근 확인 (Leaflet, vis-network 모두 200 OK)
- Notes:
  - 더미 데이터 4명만 적용. 나머지 72명은 "출생지 정보 없음" / "관계 정보 없음" 표시.
  - 태훈이 위도/경도 + 관계 데이터 채워 넣으면 자동 반영되는 구조.
  - birthplace 필드 구조: { name, nameZh, lat, lng }
  - relations 필드 구조: [{ targetId, type, label, desc }]
  - 관계도에서 다른 시인 노드 클릭 시 해당 시인 모달로 이동 가능.
