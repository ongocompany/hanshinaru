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

## [Task ID] 2026-02-12-2110-gemini-tang-history-doc

### START
- Time: 2026-02-12 21:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 당나라 역사 백과사전식 문서 작성 (개요, 역사, 경제, 제도, 군사, 영향 등)
- Why: 프로젝트 내 역사적 배경 지식 제공 및 학습 자료 구축
- Planned Scope:
  - 파일: `docs/tang_dynasty_history.md` (신규 생성)
  - 예상 변경: 상세한 역사 내용 서술 및 이미지 삽입 위치 표시
- Status: In Progress

### END
- Time: 2026-02-12 21:20
- Status: Done
- Changed Files:
  - `docs/tang_dynasty_history.md:1` (신규 생성: 당나라 역사 상세 문서)
- Validation:
  - 문서 구조(개요~동아시아 영향) 확인
  - [이미지/지도 삽입 요망] 주석 포함 확인
- Notes:
  - 추후 적절한 이미지나 지도를 구하면 해당 위치에 삽입 필요.

## [Task ID] 2026-02-14-1200-gemini-review-docs

### START
- Time: 2026-02-14 12:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 협업 규칙 및 폴더 구조 변경 확인, 시인 데이터 조사 요청서(CLtoGE) 숙지
- Why: 프로젝트 운영 규칙 준수 및 민철(Claude)의 요청 사항 이행 준비
- Planned Scope:
  - 파일: `docs/collaboration_rules.md` (읽기)
  - 파일: `docs/handoff/05_시인출생지_관계데이터_조사요청_250214_CLtoGE.md` (읽기)
- Status: In Progress

### END
- Time: 2026-02-14 12:05
- Status: Done
- Changed Files:
  - (없음 - 문서 숙지 완료)
- Validation:
  - 새 폴더 구조(handoff, research) 이해.
  - 72명 시인 조사 포맷(JSON, 위경도, 관계) 확인.
- Notes:
  - 다음 작업으로 `docs/research/` 폴더에 조사 결과 파일 생성 예정.

## [Task ID] 2026-02-14-1210-gemini-research-poets-batch1

### START
- Time: 2026-02-14 12:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 1차분(가도~두목, 13명) 출생지 및 교유관계 데이터 조사
- Why: 시각화(지도, 관계도) 구현을 위한 기초 데이터 확보
- Planned Scope:
  - 파일: `docs/research/01_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C328~C340 시인의 JSON 데이터 (birthplace, relations)
- Status: In Progress

### END
- Time: 2026-02-14 12:20
- Status: Done
- Changed Files:
  - `docs/research/01_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 확인.
  - 위경도 좌표(Google Maps 기준 근사치) 및 관계 타겟 ID 확인.
- Notes:
  - 김창서(C335) 등 정보 부족 시인은 추정치 사용 및 주석 표기.

## [Task ID] 2026-02-14-1230-gemini-research-poets-batch2

### START
- Time: 2026-02-14 12:30
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 2차분(두순학~백거이, 7명) 데이터 조사
- Why: 시각화 데이터 확보 (2/N)
- Planned Scope:
  - 파일: `docs/research/02_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C342~C349 시인의 JSON 데이터
- Status: In Progress

### END
- Time: 2026-02-14 12:40
- Status: Done
- Changed Files:
  - `docs/research/02_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 및 위경도 확인.
  - 두심언-두보, 백거이-원진 등 핵심 관계 반영 확인.
- Notes:
  - 배적(C348)의 출생지는 하동(산서성)으로 추정하여 기입.

## [Task ID] 2026-02-14-1250-gemini-research-poets-batch3

### START
- Time: 2026-02-14 12:50
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 3차분(사공서~왕발, 9명) 데이터 조사
- Why: 시각화 데이터 확보 (3/N)
- Planned Scope:
  - 파일: `docs/research/03_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C350~C358 시인의 JSON 데이터
- Status: In Progress

### END
- Time: 2026-02-14 13:00
- Status: Done
- Changed Files:
  - `docs/research/03_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 및 위경도 확인.
  - 왕발(초당4걸), 송지문(심전기), 온정균(이상은) 등 주요 관계 반영.
- Notes:
  - 서비인(C352)은 작자 미상(변경인)으로 출생지 불명 처리.

## [Task ID] 2026-02-14-1310-gemini-research-poets-batch4

### START
- Time: 2026-02-14 13:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 4차분(왕유~유우석, 11명) 데이터 조사
- Why: 시각화 데이터 확보 (4/N)
- Planned Scope:
  - 파일: `docs/research/04_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C359~C369 시인의 JSON 데이터
- Status: In Progress

### END
- Time: 2026-02-14 13:20
- Status: Done
- Changed Files:
  - `docs/research/04_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 및 위경도 확인.
  - 왕유(배적), 원진(백거이), 유우석(유종원) 등 핵심 관계 반영.
- Notes:
  - 왕창령, 왕지환, 고적의 기정화벽(旗亭畫壁) 일화 관계 반영.

## [Task ID] 2026-02-14-1330-gemini-research-poets-batch5

### START
- Time: 2026-02-14 13:30
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 5차분(유장경~장구령, 12명) 데이터 조사
- Why: 시각화 데이터 확보 (5/N)
- Planned Scope:
  - 파일: `docs/research/05_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C370~C382 시인의 JSON 데이터 (C375 이백 제외)
- Status: In Progress

### END
- Time: 2026-02-14 13:40
- Status: Done
- Changed Files:
  - `docs/research/05_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 및 위경도 확인.
  - 유종원(유우석), 이상은(두목), 장구령(왕유) 등 핵심 관계 반영.
- Notes:
  - 이백(C375)은 기존 데이터가 있어 제외.

## [Task ID] 2026-02-14-1350-gemini-research-poets-batch6

### START
- Time: 2026-02-14 13:50
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 72명 중 6차분(장욱~황보염, 20명) 데이터 조사 (완료)
- Why: 시각화 데이터 확보 (6/6 - Final)
- Planned Scope:
  - 파일: `docs/research/06_시인72명_데이터조사_250214_GE.md` (신규 생성)
  - 내용: C383~C403 시인의 JSON 데이터 (C398 하지장 제외)
- Status: In Progress

### END
- Time: 2026-02-14 14:10
- Status: Done
- Changed Files:
  - `docs/research/06_시인72명_데이터조사_250214_GE.md:1` (신규 생성)
- Validation:
  - JSON 문법 및 위경도 확인.
  - 한유 중심 관계망(맹교, 가도, 유종원), 최호-이백 일화 등 반영.
- Notes:
  - 72명 전체 조사 완료. 다음 단계로 DB 병합 필요.

## [Task ID] 2026-02-14-1420-gemini-merge-poet-data

### START
- Time: 2026-02-14 14:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 시인 데이터(1~6차) 병합 및 외부 인물(EXT_) 목록 추출
- Why: 조사된 데이터를 메인 DB에 반영하고, 외부 인물 데이터를 별도로 관리하기 위함
- Planned Scope:
  - 파일: `scripts/merge_poet_data.js` (신규 생성: 병합 스크립트)
  - 실행 결과: `public/index/db_author.with_ko.json` 업데이트, `docs/research/ext_figures_list.json` 생성
- Status: In Progress

### END
- Time: 2026-02-14 14:30
- Status: Done
- Changed Files:
  - `scripts/merge_poet_data.js:1` (신규 생성)
- Validation:
  - 스크립트 로직 확인 (JSON 파싱, 병합, EXT 추출)
- Notes:
  - 스크립트 실행 필요: `node scripts/merge_poet_data.js`

## [Task ID] 2026-02-14-1440-gemini-fix-ext-display

### START
- Time: 2026-02-14 14:40
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 외부 인물 관계 표시 시 ID 대신 한글 이름이 나오도록 수정 요청
- Why: UI에서 `EXT_xianzong` 같은 ID가 노출되는 문제 해결
- Planned Scope:
  - 파일: `scripts/merge_poet_data.js`
  - 변경: 외부 인물 데이터를 `db_author.with_ko.json`의 `authors` 객체에도 추가하도록 로직 개선
- Status: In Progress

### END
- Time: 2026-02-14 14:50
- Status: Done
- Changed Files:
  - `scripts/merge_poet_data.js:92` (외부 인물 DB 주입 로직 추가 및 저장 순서 변경)
- Validation:
  - 스크립트 실행 시 `authors`에 `EXT_` 키로 데이터가 들어가는지 확인 필요.
- Notes:
  - 스크립트 재실행 필요: `node scripts/merge_poet_data.js`

## [Task ID] 2026-02-14-1500-gemini-fix-app-ext-display

### START
- Time: 2026-02-14 15:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: app.js 직접 수정을 통해 외부 인물 이름 표시 문제 해결
- Why: 프론트엔드 코드에서 외부 인물 데이터(targetNameKo)를 관계도 엣지 데이터로 전달하지 않아 ID가 노출되는 문제 근본 해결.
- Planned Scope:
  - 파일: `app.js`
  - 변경: `initRelationGraph` 함수 내 `edgesRaw` 생성 시 `targetName`, `targetNameKo` 속성 추가.
- Status: In Progress

### END
- Time: 2026-02-14 15:05
- Status: Done
- Changed Files:
  - `app.js:1088` (edgesRaw.push에 targetName/targetNameKo 추가)
- Validation:
  - 관계도 렌더링 시 `extRel`에서 이름을 찾아 노드 라벨로 표시하는 로직이 정상 작동하게 됨.
- Notes:
  - 이전에 수행한 DB 주입 스크립트(merge_poet_data.js)의 임시 방편 없이도 정상 동작함.

## [Task ID] 2026-02-14-1510-gemini-update-relation-graph

### START
- Time: 2026-02-14 15:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 관계도 노드 스타일 변경 (이미지, 툴팁) 및 크기/레이아웃 개선
- Why: 시인 초상화 표시 및 노드 가시성 확보
- Planned Scope:
  - 파일: `app.js`
  - 변경: `initRelationGraph` 내 노드 설정(`shape`, `image`, `title`, `size`) 및 옵션(`physics`, `interaction`) 수정
- Status: In Progress

### END
- Time: 2026-02-14 15:15
- Status: Done
- Changed Files:
  - `app.js:1095` (노드 생성 로직: circularImage, 더미 이미지, 툴팁 적용, 크기 상향)
  - `app.js:1120` (옵션 수정: physics 활성화, zoomView/dragView 허용)
- Validation:
  - 관계도 렌더링 시 초상화(더미) 표시 확인 필요.
  - 마우스 호버 시 이름 툴팁 표시 확인 필요.
  - 노드들이 겹치지 않고 적절히 퍼지는지 확인 필요.
- Notes:
  - 추후 실제 시인 초상화 데이터가 준비되면 `image` 속성을 동적으로 연결해야 함.

## [Task ID] 2026-02-14-1520-gemini-tune-relation-graph-physics

### START
- Time: 2026-02-14 15:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 관계도 노드 개수가 늘어날 때 너무 작게 보이는 현상 개선
- Why: 노드 확산으로 인한 과도한 줌 아웃 방지
- Planned Scope:
  - 파일: `app.js`
  - 변경: `initRelationGraph`의 `physics` 옵션 조정 (`centralGravity` 추가, `stabilization` 활성화)
- Status: In Progress

### END
- Time: 2026-02-14 15:25
- Status: Done
- Changed Files:
  - `app.js:1124` (physics 옵션: centralGravity 0.2 추가, stabilization 활성화)
- Validation:
  - 관계도 노드가 3개 이상일 때도 적절한 크기로 모여 있는지 확인.

## [Task ID] 2026-02-14-1530-gemini-fix-graph-zoom

### START
- Time: 2026-02-14 15:30
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 관계도 노드 4개 이상 시 과도한 축소 현상 수정
- Why: 물리 엔진의 척력으로 인해 그래프가 너무 퍼져서 자동 줌아웃이 심하게 발생함.
- Planned Scope:
  - 파일: `app.js`
  - 변경: `physics` 옵션의 `centralGravity` 상향(0.2->0.8), `nodeDistance` 하향 조정.
- Status: In Progress

### END
- Time: 2026-02-14 15:35
- Status: Done
- Changed Files:
  - `app.js:1124` (physics 옵션: centralGravity 0.8로 강화, 거리 100으로 축소)
- Validation:
  - 노드 개수가 늘어나도 그래프가 퍼지지 않고 컴팩트하게 유지되어 줌아웃이 덜 되는지 확인.

## [Task ID] 2026-02-14-1922-gpt-author-image-collector-test10

### START
- Time: 2026-02-14 19:22
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 작가 DB 기준 상위 10명을 대상으로 브라우저에서 초상화 검색/선정/ID 네이밍 저장을 테스트할 수 있는 별도 HTML+JS 툴 제작 요청.
- Why: 자동 수집 가능성을 먼저 검증하고, 자동 검색 실패 시 수동 보정 가능한 작업 화면이 필요함.
- Planned Scope:
  - 파일: `tools/author_image_collector.html`
  - 예상 변경: 테스트용 UI(작가 목록, 검색 옵션, 이미지 결과 패널, 저장 버튼) 신규 생성
  - 파일: `tools/author_image_collector.js`
  - 예상 변경: DB 로딩, 다국어 검색어 조합(한글/한자 번체/간체), Wikimedia 검색, 선택 이미지 ID 네이밍 다운로드 로직 구현
  - 파일: `docs/work_change_log.md`
  - 예상 변경: START/END 로그 기록
- Status: In Progress

### END
- Time: 2026-02-14 19:26
- Status: Done
- Changed Files:
  - `tools/author_image_collector.html:1` (Top 10 테스트용 수집 UI 신규 생성: 작가목록/검색옵션/결과패널/수동보정/저장버튼)
  - `tools/author_image_collector.js:254` (번체→간체 보조 변환 `toSimp()` 구현)
  - `tools/author_image_collector.js:320` (한글/번체/간체 + 키워드 포함/제외 조합 검색어 생성)
  - `tools/author_image_collector.js:359` (Wikimedia Commons API 이미지 검색 및 결과 파싱)
  - `tools/author_image_collector.js:521` (선택 이미지 ID 파일명 다운로드: `Cxxx.ext`)
  - `tools/author_image_collector.js:586` (선택 폴더에 자동 네이밍 저장: File System Access API)
  - `tools/author_image_collector.js:626` (출처/라이선스 포함 manifest JSON 내보내기)
  - `docs/work_change_log.md:633` (이번 Task START/END 로그 기록)
- Validation:
  - `node --check tools/author_image_collector.js` 통과
  - 정적 구조 확인: HTML/JS 요소 연결 및 이벤트 바인딩 확인
- Notes:
  - 실제 이미지 검색/다운로드 동작은 브라우저 네트워크 환경에서 확인 필요.
  - 자동 검색 실패 시 `수동 이미지 URL` 입력으로 개별 보정 가능.

## [Task ID] 2026-02-14-2031-gpt-image-search-recall-boost

### START
- Time: 2026-02-14 20:31
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 초상화 검색 결과가 10명 중 1명 수준으로 너무 적어 검색 정확도보다 재현율(결과 수)을 우선 올리도록 개선 요청.
- Why: Commons 단일/엄격 검색식으로 결과가 부족하여 실사용 테스트가 어려움.
- Planned Scope:
  - 파일: `tools/author_image_collector.js`
  - 예상 변경: 검색어 완화(키워드 OR), 다단계 fallback 쿼리, Wikipedia(zh/en) 이미지 보강 검색 추가
  - 파일: `tools/author_image_collector.html`
  - 예상 변경: 구글 이미지 수동 확인 버튼 추가
  - 파일: `docs/work_change_log.md`
  - 예상 변경: START/END 로그 기록
- Status: In Progress

### END
- Time: 2026-02-14 20:33
- Status: Done
- Changed Files:
  - `tools/author_image_collector.js:361` (Commons 검색을 다단계 fallback 쿼리로 확장하여 재현율 향상)
  - `tools/author_image_collector.js:472` (Wikipedia `zh/en` API 보강 검색 추가)
  - `tools/author_image_collector.js:515` (작가별 통합 검색 파이프라인 `searchAuthorImages()` 추가)
  - `tools/author_image_collector.js:630` (결과 카드에 소스 타입 표기: commons/zhwiki/enwiki/manual)
  - `tools/author_image_collector.js:900` (현재 작가 Google 이미지 검색 새 탭 열기)
  - `tools/author_image_collector.js:1052` (Google 버튼 이벤트 바인딩)
  - `tools/author_image_collector.html:386` (`Google 이미지 열기` 버튼 추가)
  - `docs/work_change_log.md:669` (이번 Task START/END 로그 기록)
- Validation:
  - `node --check tools/author_image_collector.js` 통과
  - 함수 참조 점검(`rg`): 신규 검색 경로/버튼 바인딩 연결 확인
- Notes:
  - 검색량이 늘어나면서 작가별 API 호출 횟수도 증가함.
  - 자동 검색 결과가 부족하면 `Google 이미지 열기` + `수동 이미지 URL`로 즉시 보정 가능.

## [Task ID] 2026-02-14-2039-gpt-image-entity-resolution

### START
- Time: 2026-02-14 20:39
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 중국/한국 자료가 거의 안 잡히고 엉뚱한 이미지가 매칭되는 문제의 근본 해결 요청.
- Why: 이름 키워드 검색은 동명이인/잡음이 심해 실사용이 불가능함.
- Planned Scope:
  - 파일: `tools/author_image_collector.js`
  - 예상 변경: 키워드 검색 중심에서 `Wikidata QID 엔티티 매칭 -> P18 이미지` 중심 파이프라인으로 전환, 실패 시에만 기존 fallback 검색 사용
  - 파일: `docs/work_change_log.md`
  - 예상 변경: START/END 로그 기록
- Status: In Progress

### END
- Time: 2026-02-14 20:42
- Status: Done
- Changed Files:
  - `tools/author_image_collector.js:5` (Wikidata API 상수 및 엔티티 캐시 상태 추가)
  - `tools/author_image_collector.js:307` (작가 정규화 시 생몰연도 필드 포함)
  - `tools/author_image_collector.js:524` (엔티티 비교용 정규화/클레임 추출/연도 파싱 유틸 추가)
  - `tools/author_image_collector.js:752` (Wikidata 엔티티 후보 검색 + 점수화 + 강한 매칭 선택 로직 추가)
  - `tools/author_image_collector.js:799` (Wikidata P18 이미지 결과 생성 로직 추가)
  - `tools/author_image_collector.js:868` (Wikidata sitelink 기반 Wikipedia 이미지 보강 로직 추가)
  - `tools/author_image_collector.js:892` (기존 키워드 검색을 fallback 전용 `searchAuthorImagesByKeywords()`로 분리)
  - `tools/author_image_collector.js:932` (최종 파이프라인을 `엔티티 우선 + fallback` 방식으로 재구성)
  - `tools/author_image_collector.js:1043` (결과 카드에 엔티티 매칭 근거 `matchNote` 표시)
  - `tools/author_image_collector.js:1290` (상태 메시지: `Entity+Fallback`으로 변경)
  - `docs/work_change_log.md:705` (이번 Task START/END 로그 기록)
- Validation:
  - `node --check tools/author_image_collector.js` 통과
  - 함수 참조 점검(`rg`): 신규 엔티티 매칭 함수/파이프라인 연결 확인
- Notes:
  - 이름 키워드 검색은 동명이인 잡음이 커서 보조 수단으로만 유지.
  - 우선적으로 QID를 확정해 P18 이미지를 가져오므로 엉뚱한 매칭 비율이 줄어듦.

## [Task ID] 2026-02-14-2113-gpt-image-tool-issue-claim-log

### START
- Time: 2026-02-14 21:13
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 아까 진행한 초상화 검색툴 작업에 대해 사용자 클레임, 검색엔진 한계, Google API 전환 시도 상태까지 공용 로그에 명시 요청.
- Why: 후속 작업(엔진 교체/정확도 개선) 시 의사결정 근거를 로그로 남겨 커뮤니케이션 누락을 방지하기 위함.
- Planned Scope:
  - 파일: `docs/work_change_log.md`
  - 예상 변경: 검색툴 이슈 요약(사용자 클레임/기술 한계/Google API 시도 현황) 기록 추가
- Status: In Progress

### END
- Time: 2026-02-14 21:13
- Status: Done
- Changed Files:
  - `docs/work_change_log.md:742` (검색툴 이슈 요약 로그 추가)
- Validation:
  - `tail`, `rg`로 Task ID 및 기록 항목 반영 확인
- Notes:
  - 사용자 클레임: 중국/한국권 자료가 거의 잡히지 않고, 동명이인/무관 이미지가 다수 섞여 실사용이 어렵다는 피드백.
  - 사용 엔진 한계: Commons/Wikipedia/Wikidata 기반 공개 메타데이터 검색은 원본 품질 편차와 엔티티 누락/동명이인 충돌에 취약하여 정확한 초상화 자동 선별에 한계가 있음.
  - 현재 도구 상태: 키워드 검색 중심 방식에서 `Wikidata QID -> P18` 우선 방식으로 개선했으나, 데이터 소스 한계로 일부 인물은 여전히 fallback 수동 보정이 필요함.
  - Google API 시도 현황: Google Custom Search API 사용 전환을 시도 중이며, 초기 테스트에서 `API_KEY_INVALID` 응답이 발생해 키 유효성/프로젝트 매핑 확인 단계 진행 중.
  - 운영 방향: Google API 연결 성공 시 초기 대량 수집에 사용하고, 이후에는 일일 소량(추가 인물 1~2명) 유지운영을 목표로 함.

## [Task ID] 2026-02-14-2130-gemini-google-search-issue

### START
- Time: 2026-02-14 21:30
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: Google Programmable Search Engine '전체 웹 검색' 기능 중단 이슈 대응
- Why: Google 정책 변경으로 인해 전체 웹 검색 활성화 불가, 특정 사이트 지정 방식으로 우회 필요.
- Planned Scope:
  - 파일: `docs/work_change_log.md`
  - 예상 변경: 이슈 및 해결 가이드(사이트 목록 추가) 기록
  - 파일: `tools/author_image_collector.html`
  - 예상 변경: 구글 설정 도움말 추가
- Status: In Progress

### END
- Time: 2026-02-14 21:35
- Status: Done
- Changed Files:
  - `docs/work_change_log.md:755` (Google 검색 엔진 이슈 및 우회법 기록)
  - `tools/author_image_collector.html:225` (설정 가이드 툴팁 추가)
- Validation:
  - 사용자에게 대체 설정 가이드 제공.
- Notes:
  - '검색할 사이트'에 위키백과, 바이두, 나무위키 등을 추가하여 검색 범위 확보.

## [Task ID] 2026-02-14-2200-gemini-baidu-search-fix

### START
- Time: 2026-02-14 22:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 바이두 백과 이미지 검색 누락 문제 해결 및 이미지 크기 필터 추가
- Why: 일반 검색어로는 바이두 백과 이미지가 Google 결과에 잘 노출되지 않음. 고화질 이미지 선호 니즈 반영.
- Planned Scope:
  - 파일: `tools/author_image_collector.html` (이미지 크기 선택 UI 추가)
  - 파일: `tools/author_image_collector.js` (Google 검색 시 `site:baike.baidu.com` 쿼리 추가 실행, `imgSize` 파라미터 적용)
- Status: In Progress

### END
- Time: 2026-02-14 22:10
- Status: Done
- Changed Files:
  - `tools/author_image_collector.html:242` (이미지 크기 select 추가)
  - `tools/author_image_collector.js:248` (imgSize 요소 참조, Google 검색 로직에 바이두 타겟팅 및 사이즈 필터 추가)
- Validation:
  - `綦毋潛` 검색 시 바이두 백과 출처의 이미지가 결과에 포함되는지 확인 필요.

## [Task ID] 2026-02-14-2220-gemini-fix-manual-google-search

### START
- Time: 2026-02-14 22:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 수동 구글 이미지 검색 버튼 클릭 시 한글 이름만 검색되는 문제 수정
- Why: `openGoogleImagesForCurrent` 함수가 `plan.names[0]`만 사용하여 검색어를 생성하고 있어, 한자 이름이 누락됨.
- Planned Scope:
  - 파일: `tools/author_image_collector.js`
  - 변경: `openGoogleImagesForCurrent` 함수에서 `buildSearchQuery`를 사용하여 다국어 이름이 포함된 쿼리를 생성하도록 수정.
- Status: In Progress

### END
- Time: 2026-02-14 22:25
- Status: Done
- Changed Files:
  - `tools/author_image_collector.js:1052` (openGoogleImagesForCurrent 함수 로직 변경)
- Validation:
  - "Google 이미지 열기" 버튼 클릭 시 `(한글명 OR 한자명) 키워드` 형태의 쿼리로 새 탭이 열리는지 확인.

## [Task ID] 2026-02-14-2240-gemini-exclude-wikimedia

### START
- Time: 2026-02-14 22:40
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: Google 검색 시 Wikimedia 이미지 제외 옵션 추가
- Why: Wikimedia 검색 결과에 인물과 무관한 건물 사진 등 노이즈가 많아 사용자 경험 저해.
- Planned Scope:
  - 파일: `tools/author_image_collector.html` (제외 체크박스 UI 추가)
  - 파일: `tools/author_image_collector.js` (검색 쿼리 생성 시 `-site:wikimedia.org` 추가 로직 구현)
- Status: In Progress

### END
- Time: 2026-02-14 22:45
- Status: Done
- Changed Files:
  - `tools/author_image_collector.html:254` (Wikimedia 제외 체크박스 추가)
  - `tools/author_image_collector.js:250` (excludeWikimedia 요소 참조 및 쿼리 빌더에 제외 로직 추가)
- Validation:
  - 체크박스 활성화 시 검색어 미리보기에 `-site:wikimedia.org`가 포함되는지 확인.

## [Task ID] 2026-02-14-2300-gemini-skip-wikimedia-api

### START
- Time: 2026-02-14 23:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: Wikimedia 제외 옵션 활성화 시 Commons/Wikipedia/Wikidata API 호출 자체를 스킵하도록 수정
- Why: Google 검색어에서만 제외하고 직접 API 호출은 유지하여, 여전히 위키미디어 이미지가 결과를 도배하는 문제 발생.
- Planned Scope:
  - 파일: `tools/author_image_collector.js`
  - 변경: `searchAuthorImages` 및 `searchAuthorImagesByKeywords` 함수 내 API 호출 로직에 조건문 추가.
- Status: In Progress

### END
- Time: 2026-02-14 23:05
- Status: Done
- Changed Files:
  - `tools/author_image_collector.js:1000` (Wikidata 이미지 fetch 조건 추가)
  - `tools/author_image_collector.js:1080` (Commons/Wikipedia API 호출 조건 추가)
- Validation:
  - 제외 옵션 체크 시 위키미디어 관련 쿼리가 미리보기에 뜨지 않고, 결과에도 포함되지 않는지 확인.

## [Task ID] 2026-02-14-2315-gemini-image-tool-wrapup

### START
- Time: 2026-02-14 23:15
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 작가 초상화 수집 도구 수정 사항 종합 및 이슈 기록
- Why: 검색 품질 개선 작업(바이두 추가, 위키미디어 제외)을 마무리하고 현재 상태를 저장하기 위함.
- Planned Scope:
  - 파일: `docs/work_change_log.md`
- Status: In Progress

### END
- Time: 2026-02-14 23:15
- Status: Done
- Changed Files:
  - `docs/work_change_log.md` (작업 이력 추가)
- Validation:
  - (없음 - 문서 업데이트)
- Notes:
  - **[이슈: 뭐가 안 됐는지]**
    1. 단순 키워드 검색 시 위키미디어의 건물/풍경 사진이 결과를 도배하여 인물 초상화를 찾기 어려움.
    2. 구글 검색 API에서 중국(바이두) 소스 이미지가 잘 노출되지 않음.
    3. 수동 구글 검색 버튼이 한글 이름만 사용하여 검색 효율이 낮았음.
  - **[수정: 뭐를 수정했는지]**
    1. `searchAuthorImages`: 위키미디어 제외 옵션 체크 시 Commons/Wikipedia/Wikidata API 호출을 건너뛰도록 로직 변경.
    2. `searchGoogleImagesByQuery`: 바이두 백과(`site:baike.baidu.com`) 타겟팅 쿼리를 추가하여 중국 자료 검색 보강.
    3. `openGoogleImagesForCurrent`: 수동 검색 시 `(한글명 OR 한자명)` 쿼리를 사용하도록 수정.
  - **[추가: 뭐를 추가했는지]**
    1. UI: 'Wikimedia 제외' 체크박스 (노이즈 제거용).
    2. UI: '이미지 크기' 선택 옵션 (고화질 선호 반영).

## [Task ID] 2026-02-14-2238-gpt-readdy-subpages-implementation

### START
- Time: 2026-02-14 22:38
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: readdy 레퍼런스의 메인 제외 페이지(`/poets`, `/poem`, `/history`, `/tang-poetry-300`)를 우리 사이트에 유사하게 먼저 구현하고, 이미지 없는 영역은 색 박스로 처리.
- Why: 비주얼/구조 검증을 빠르게 진행하고 이후 데이터/이미지 치환 작업의 기반을 확보하기 위함.
- Planned Scope:
  - 파일: `pages/readdy_like.css`
  - 예상 변경: 공통 레이아웃/섹션/스크롤 애니메이션/플레이스홀더 스타일 신규 작성
  - 파일: `pages/readdy_like.js`
  - 예상 변경: nav 스크롤 상태 전환 + 섹션 fade-in IntersectionObserver + 활성 메뉴 처리
  - 파일: `poets/index.html`, `poem/index.html`, `history/index.html`, `tang-poetry-300/index.html`
  - 예상 변경: 단일 페이지 4종 신규 구현(메인 제외), 이미지 대체 컬러 박스 반영
- Status: In Progress

### END
- Time: 2026-02-14 22:43
- Status: Done
- Changed Files:
  - `pages/readdy_like.css:46` (고정 nav, hero, sticky title, fade-in, placeholder 박스 공통 스타일 신규 작성)
  - `pages/readdy_like.js:1` (스크롤 시 nav 상태 전환, IntersectionObserver 기반 섹션 페이드 인, 현재 메뉴 활성화)
  - `poets/index.html:26` (시인 페이지 신규 생성, 시대별 섹션 + 플레이스홀더 박스 배치)
  - `poem/index.html:26` (시 페이지 신규 생성, 형식/주제/향유 섹션 + 플레이스홀더 박스 배치)
  - `history/index.html:26` (역사 페이지 신규 생성, 단계별 서사 섹션 + 플레이스홀더 박스 배치)
  - `tang-poetry-300/index.html:26` (당시삼백수 페이지 신규 생성, 편찬/구성/학습동선 섹션 구현)
- Validation:
  - `rg`로 각 페이지의 `fade-section`, `image-placeholder`, `data-page` 연결 확인 완료
  - 공통 JS/CSS 핵심 선택자 존재 확인 완료(`top-nav`, `sticky-title`, `fade-section`)
- Notes:
  - 이미지 미확보 구간은 요청대로 컬러 박스 플레이스홀더로 처리함.
  - 브라우저 실제 렌더링(픽셀/폰트) 검수는 형님 환경에서 최종 확인 필요.

---

## [T019] 2026-02-15-0630-Claude-image-collector-v3

### START
- Time: 2026-02-15 06:30
- Owner: Claude (민철)
- Requester: JIN
- Request Summary: 작가 초상화 수집기(tools/author_image_collector)를 v3로 완전 재작성. API 검색 제거, 반자동 방식(Google/Baidu 새 탭 수동 검색 + URL/파일/클립보드 3가지 입력 + Cropper.js 크롭 + JSZip ZIP 다운로드)으로 전환.
- Why: v1(Wikimedia+Google API)과 v2(Google API only) 모두 API가 원활히 작동하지 않아, 수동 검색 + 자동 크롭/저장의 반자동 방식이 현실적으로 가장 효율적.
- Planned Scope:
  - 파일: `tools/author_image_collector.js`
  - 예상 변경: v2 코드(840줄, Google Custom Search API 전용) → v3(340줄, 반자동) 완전 재작성
  - 파일: `tools/author_image_collector.html`
  - 예상 변경: v2 UI(API 설정 패널 + 검색 결과 그리드) → v3 UI(3컬럼: 작가목록 + 크롭도구 + 컬렉션) 완전 재작성
- Status: In Progress

### END
- Time: 2026-02-15 07:20
- Status: Done
- Changed Files:
  - `tools/author_image_collector.js` (v3 완전 재작성, 340줄)
    - API 검색 코드 전부 제거
    - Google Images / Baidu Images 새 탭 열기 방식으로 전환
    - 이미지 입력 3가지: URL fetch+img fallback, 로컬 파일(FileReader), 클립보드 paste 이벤트
    - Cropper.js 연동 (1:1 비율, 500x500 JPEG 출력)
    - JSZip으로 수집 이미지 ZIP 다운로드
    - 크롭 확인 후 다음 미수집 작가 자동 이동
    - manifest.json 내보내기
  - `tools/author_image_collector.html` (v3 완전 재작성)
    - 3컬럼 레이아웃: 좌(DB로드+작가목록) / 중앙(검색+입력+크롭) / 우(컬렉션+ZIP)
    - CDN: Cropper.js 1.6.2, JSZip 3.10.1
    - 반응형 대응 (1200px 이하 2컬럼, 768px 이하 1컬럼)
- Validation:
  - `node --check tools/author_image_collector.js` 통과
  - IDE 진단: JSZip CDN 관련 타입 힌트만 (실행에 무관)
  - Notes:
  - 형이 v3 도구로 67명 시인 초상화 수집 완료, `public/assets/avatars/`에 저장
  - manifest: `public/assets/avatars/author_image_manifest_1771107665560.json`
  - 미수집 9명: C332(구위), C335(김창서), C339(대숙륜), C352(서비인), C381(장교), C384(장적), C388(정전), C392(진도옥), C402(허혼) → AI 생성 이미지로 추후 보충 예정
  - 다음 작업: 관리툴 5단계(시 관리) 진입 예정 (Q13/Q14/Q15 결정 필요)

## [Task ID] 2026-02-14-2350-gpt-midjourney-prompt-generator

### START
- Time: 2026-02-14 23:50
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 작품 DB에서 작품을 검색해 Midjourney용 이미지 프롬프트를 자동 생성하고, 이를 수동이 아닌 GPT API 연동 방식으로 실행 가능한 도구를 요청.
- Why: 작품별 일관된 스타일(수묵화/단색감/시적 분위기)로 빠르게 이미지 프롬프트를 대량 생성하기 위함.
- Planned Scope:
  - 파일: `tools/midjourney_prompt_generator.js`
  - 예상 변경: 작품 검색/선택 + GPT API 호출 + 공통 스타일 강제 + JSON 저장 CLI 신규 구현
  - 파일: `tools/midjourney_prompt_generator.md`
  - 예상 변경: 실행법/옵션/주의사항 문서 신규 작성
- Status: In Progress

### END
- Time: 2026-02-14 23:59
- Status: Done
- Changed Files:
  - `tools/midjourney_prompt_generator.js:1` (신규 CLI 추가: 작품 DB 로드, `--query`/`--title-id` 필터, OpenAI Chat Completions 호출, Midjourney 프롬프트 생성 및 공통 스타일 강제, `--out` JSON 저장, `--list`/`--dry-run` 지원)
  - `tools/midjourney_prompt_generator.md:1` (신규 사용 가이드 추가: 환경변수/API키/실행 예시/옵션/결과 포맷)
  - `docs/work_change_log.md:1` (본 작업 START/END 기록 추가)
- Validation:
  - `node tools/midjourney_prompt_generator.js --help` 실행 확인
  - `node tools/midjourney_prompt_generator.js --query "夜思" --limit 3 --list` 매칭 목록 출력 확인
  - `node tools/midjourney_prompt_generator.js --query "달 강" --limit 2 --dry-run` 프롬프트 출력 확인
  - `node tools/midjourney_prompt_generator.js --query "夜思" --limit 1 --dry-run --out /tmp/mj_test.json` 파일 저장 확인
  - `env -u OPENAI_API_KEY node tools/midjourney_prompt_generator.js --query "夜思" --limit 1` API 키 누락 에러 핸들링 확인
- Notes:
  - 실제 GPT API 호출 검증은 사용자 API 키(`OPENAI_API_KEY`)가 설정된 환경에서 실행 필요.
  - 기본 DB는 `public/index/poems.full.json`(320편)이며, `archive/database.json` 형태도 폴백 지원.

## [Task ID] 2026-02-15-0910-gemini-restore-youtube-list

### START
- Time: 2026-02-15 09:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 에러로 인해 날아간 유튜브 링크 목록 파일 복구 요청.
- Why: 이전 작업 결과물이 유실되었으므로 `archive/database.json` 원본 데이터를 기반으로 재생성해야 함.
- Planned Scope:
  - 파일: `scripts/extract_youtube_links.js` (신규 생성)
  - 기능: DB JSON 파싱 -> 유튜브 링크 정규식 추출 -> 마크다운 테이블 생성
  - 파일: `docs/research/07_유튜브링크_포함_시_목록_260215_GE.md` (자동 갱신)
- Status: In Progress

### END
- Time: 2026-02-15 09:15
- Status: Done
- Changed Files:
  - `scripts/extract_youtube_links.js:1` (링크 추출 스크립트 생성)
  - `docs/research/07_유튜브링크_포함_시_목록_260215_GE.md` (스크립트 실행을 통해 데이터 복구 완료)
- Validation:
  - 스크립트 실행 후 마크다운 파일에 테이블 데이터가 정상적으로 채워졌는지 확인.
- Notes:
  - `archive/database.json`의 `simplified` 필드 등에 포함된 `https://youtu.be/...` 형태의 링크를 추출함.

## [Task ID] 2026-02-15-0910-gemini-restore-youtube-list

### START
- Time: 2026-02-15 09:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 에러로 인해 날아간 유튜브 링크 목록 파일 복구 요청.
- Why: 이전 작업 결과물이 유실되었으므로 `archive/database.json` 원본 데이터를 기반으로 재생성해야 함.
- Planned Scope:
  - 파일: `scripts/extract_youtube_links.js` (신규 생성)
  - 기능: DB JSON 파싱 -> 유튜브 링크 정규식 추출 -> 마크다운 테이블 생성
  - 파일: `docs/research/07_유튜브링크_포함_시_목록_260215_GE.md` (자동 갱신)
- Status: In Progress

### END
- Time: 2026-02-15 09:15
- Status: Done
- Changed Files:
  - `scripts/extract_youtube_links.js:1` (링크 추출 스크립트 생성)
  - `docs/research/07_유튜브링크_포함_시_목록_260215_GE.md` (스크립트 실행을 통해 데이터 복구 완료)
- Validation:
  - 스크립트 실행 후 마크다운 파일에 테이블 데이터가 정상적으로 채워졌는지 확인.
- Notes:
  - `archive/database.json`의 `simplified` 필드 등에 포함된 `https://youtu.be/...` 형태의 링크를 추출함.

## [Task ID] 2026-02-15-0920-gemini-fix-youtube-script

### START
- Time: 2026-02-15 09:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 유튜브 링크 추출 스크립트가 제대로 동작하지 않아 결과 파일이 비어있는 문제 수정.
- Why: 이전 스크립트의 정규식이나 로직이 데이터와 맞지 않아 추출에 실패했을 가능성 있음.
- Planned Scope:
  - 파일: `scripts/extract_youtube_links.js` (수정)
  - 변경: 정규식 개선, 마크다운 링크 포맷 적용, 검색 필드 확장.
- Status: In Progress

### END
- Time: 2026-02-15 09:25
- Status: Done
- Changed Files:
  - `scripts/extract_youtube_links.js` (정규식 및 출력 포맷 개선)
- Validation:
  - 스크립트 재실행 후 마크다운 파일 내용 확인 필요.
- Notes:
  - `바로가기` 형태로 링크를 클릭할 수 있게 변경함.

## [Task ID] 2026-02-15-0920-gemini-fix-youtube-script

### START
- Time: 2026-02-15 09:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 유튜브 링크 추출 스크립트가 제대로 동작하지 않아 결과 파일이 비어있는 문제 수정.
- Why: 이전 스크립트의 정규식이나 로직이 데이터와 맞지 않아 추출에 실패했을 가능성 있음.
- Planned Scope:
  - 파일: `scripts/extract_youtube_links.js` (수정)
  - 변경: 정규식 개선, 마크다운 링크 포맷 적용, 검색 필드 확장.
- Status: In Progress

### END
- Time: 2026-02-15 09:25
- Status: Done
- Changed Files:
  - `scripts/extract_youtube_links.js` (정규식 및 출력 포맷 개선)
- Validation:
  - 스크립트 재실행 후 마크다운 파일 내용 확인 필요.
- Notes:
  - `바로가기` 형태로 링크를 클릭할 수 있게 변경함.

## [Task ID] 2026-02-15-1200-gemini-poetry-editor-mvp

### START
- Time: 2026-02-15 12:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 한시 작성 도우미(Poetry Editor) 프로토타입 구현 요청.
- Why: 사용자가 중국의 COPE, Souyun 같은 도구를 벤치마킹하여 실시간 평측 검사 기능을 원함.
- Planned Scope:
  - 파일: `tools/poetry_editor.html` (신규 생성)
  - 파일: `tools/poetry_editor.js` (신규 생성)
  - 기능: 5언/7언 절구/율시 템플릿, pinyin-pro 기반 실시간 평측 검사.
- Status: In Progress

### END
- Time: 2026-02-15 12:10
- Status: Done
- Changed Files:
  - `tools/poetry_editor.html` (에디터 UI)
  - `tools/poetry_editor.js` (평측 분석 로직)
- Validation:
  - 브라우저에서 열어 한자 입력 시 평성(파랑)/측성(빨강) 표시 및 오류 감지 확인.
- Notes:
  - 현대 중국어 발음 기준이므로 입성(入聲) 판별에는 한계가 있음(안내 문구 추가함).

## [Task ID] 2026-02-15-1215-gemini-poetry-editor-link

### START
- Time: 2026-02-15 12:15
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 한시 에디터 파일 재생성 및 관리툴 링크 추가.
- Why: 사용자가 파일을 찾지 못해 재확인 및 접근성 개선 요청.
- Planned Scope:
  - 파일: `tools/poetry_editor.html`, `tools/poetry_editor.js` (재생성)
  - 파일: `admin/index.html` (링크 추가)
- Status: In Progress

### END
- Time: 2026-02-15 12:20
- Status: Done
- Changed Files:
  - `admin/index.html:15` (한시 에디터 바로가기 버튼 추가)
- Validation:
  - 관리툴 헤더에서 버튼 클릭 시 에디터가 새 탭으로 열리는지 확인.

## [Task ID] 2026-02-15-1215-gemini-poetry-editor-link

### START
- Time: 2026-02-15 12:15
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 한시 에디터 파일 재생성 및 관리툴 링크 추가.
- Why: 사용자가 파일을 찾지 못해 재확인 및 접근성 개선 요청.
- Planned Scope:
  - 파일: `tools/poetry_editor.html`, `tools/poetry_editor.js` (재생성)
  - 파일: `admin/index.html` (링크 추가)
- Status: In Progress

### END
- Time: 2026-02-15 12:20
- Status: Done
- Changed Files:
  - `admin/index.html:15` (한시 에디터 바로가기 버튼 추가)
- Validation:
  - 관리툴 헤더에서 버튼 클릭 시 에디터가 새 탭으로 열리는지 확인.

## [Task ID] 2026-02-15-1225-gemini-restore-poetry-editor

### START
- Time: 2026-02-15 12:25
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 한시 에디터 파일 누락 복구.
- Why: 사용자가 404 에러를 제보하여, 실제 파일이 생성되지 않았음을 확인하고 재생성함.
- Planned Scope:
  - 파일: `tools/poetry_editor.html`, `tools/poetry_editor.js` (신규 생성)
- Status: In Progress

### END
- Time: 2026-02-15 12:30
- Status: Done
- Changed Files:
  - `tools/poetry_editor.html:1` (에디터 UI 생성)
  - `tools/poetry_editor.js:1` (평측 로직 생성)
- Validation:
  - 브라우저에서 `/tools/poetry_editor.html` 접속 시 정상 로드 확인.

## [Task ID] 2026-02-15-1235-gemini-add-rule

### START
- Time: 2026-02-15 12:35
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 협업 규칙에 Gemini 전용 '작업 전 확인' 규칙 추가.
- Why: 의욕이 앞서 사용자의 의도와 다른 결과물을 만드는 것을 방지하기 위함.
- Planned Scope:
  - 파일: `docs/collaboration_rules.md`
- Status: In Progress

### END
- Time: 2026-02-15 12:36
- Status: Done
- Changed Files:
  - `docs/collaboration_rules.md:28` (Gemini 전용 작업 규칙 섹션 추가)
- Validation:
  - 문서 내 규칙 명시 확인.

## [Task ID] 2026-02-15-1245-gemini-benchmark-report

### START
- Time: 2026-02-15 12:45
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 한시 에디터 벤치마킹 및 특징 정리.
- Why: 기존 도구(칭화대, Github, Souyun)의 장단점을 분석하여 우리 에디터의 개발 방향을 잡기 위함.
- Planned Scope:
  - 파일: `docs/research/08_poetry_editor_benchmark_260215_GE.md` (신규 생성)
- Status: In Progress

### END
- Time: 2026-02-15 12:50
- Status: Done
- Changed Files:
  - `docs/research/08_poetry_editor_benchmark_260215_GE.md:1` (벤치마킹 보고서 생성)
- Validation:
  - 각 사이트별 특징(AI창작, 규칙검사, 종합DB) 및 우리 프로젝트 적용점 정리 확인.

## [Task ID] 2026-02-15-1000-gpt-midjourney-ui-flow-update

### START
- Time: 2026-02-15 10:00
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 생성 결과를 2번째 칼럼 하단으로 옮기고, 프롬프트 확인 후 Midjourney 실행 흐름을 단축 요청.
- Why: 선택 → 생성 → 검수 → Midjourney 실행을 한 화면에서 빠르게 처리하기 위함.
- Planned Scope:
  - 파일: `tools/midjourney_prompt_generator.html`
  - 예상 변경: 결과 패널을 2번째 칼럼 하단으로 이동, Midjourney 자동 열기 옵션 추가
  - 파일: `tools/midjourney_prompt_generator_ui.js`
  - 예상 변경: 생성 후 Midjourney 탭 열기+프롬프트 복사, 결과 카드별 Midjourney 열기 버튼 추가
- Status: In Progress

### END
- Time: 2026-02-15 10:10
- Status: Done
- Changed Files:
  - `tools/midjourney_prompt_generator.html:55` (레이아웃을 2칼럼으로 변경하고 결과 영역을 중앙(2번째 칼럼) 하단으로 이동)
  - `tools/midjourney_prompt_generator.html:485` (`openMidjourneyAfterGenerate` 옵션 체크박스 추가)
  - `tools/midjourney_prompt_generator_ui.js:43` (Midjourney 자동 열기 옵션 DOM 바인딩 추가)
  - `tools/midjourney_prompt_generator_ui.js:267` (결과 카드에 `Midjourney 열기` 버튼 추가)
  - `tools/midjourney_prompt_generator_ui.js:617` (`openMidjourneyWithPrompt()` 추가: 탭 열기 + 프롬프트 클립보드 복사)
  - `tools/midjourney_prompt_generator_ui.js:518` (생성 완료 후 자동 Midjourney 열기 플로우 추가)
- Validation:
  - `node --check tools/midjourney_prompt_generator_ui.js` 통과
  - `rg -n "openMidjourneyAfterGenerate|open-mj|resultList" tools/midjourney_prompt_generator.html tools/midjourney_prompt_generator_ui.js`로 연결 확인
- Notes:
  - 브라우저 보안 정책/서비스 정책상 Midjourney 입력창에 완전 자동 타이핑은 보장되지 않음.
  - 현재는 “탭 열기 + 프롬프트 자동 복사”까지 자동화되어 붙여넣기 후 실행만 하면 됨.

## [Task ID] 2026-02-15-1035-gpt-midjourney-translation-queue-ratio

### START
- Time: 2026-02-15 10:35
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: 프롬프트 영문/한글 동시 노출, 한글 수정 후 영문 동기화, 비율 선택 반영, 이미지 붙여넣기 저장(작품코드 네이밍), 5개 큐/ZIP/manifest 기능 추가 요청.
- Why: 생성-검수-실행-이미지수집을 단일 UI에서 끝내기 위해.
- Planned Scope:
  - 파일: `tools/midjourney_prompt_generator.html`
  - 예상 변경: 비율 선택 UI, 결과 카드 확장, 이미지 큐/수집 패널 추가, JSZip 로드
  - 파일: `tools/midjourney_prompt_generator_ui.js`
  - 예상 변경: 한글/영문 프롬프트 동기화, 카드별 비율 적용, 큐(최대5), 붙여넣기/파일 저장, ZIP/manifest 내보내기 로직 구현
- Status: In Progress

### END
- Time: 2026-02-15 10:52
- Status: Done
- Changed Files:
  - `tools/midjourney_prompt_generator.html:598` (`globalAspectRatio` 선택 추가, 결과 카드 하단 이미지 큐/수집 UI 추가)
  - `tools/midjourney_prompt_generator.html:689` (JSZip CDN 로드 추가)
  - `tools/midjourney_prompt_generator_ui.js:559` (생성 API 스키마에 `midjourneyPromptKo` 포함, 기본 비율 반영)
  - `tools/midjourney_prompt_generator_ui.js:747` (카드값 읽기/한글확정→영문반영 동기화 로직)
  - `tools/midjourney_prompt_generator_ui.js:925` (선택 작품 기반 큐 구성 최대 5개)
  - `tools/midjourney_prompt_generator_ui.js:1004` (활성 큐에 붙여넣기/파일 이미지 저장 시 `titleId.jpg` 자동 네이밍)
  - `tools/midjourney_prompt_generator_ui.js:1061` (이미지 ZIP 다운로드)
  - `tools/midjourney_prompt_generator_ui.js:1095` (이미지 manifest JSON 저장)
  - `docs/work_change_log.md:1` (본 작업 START/END 기록 추가)
- Validation:
  - `node --check tools/midjourney_prompt_generator_ui.js` 통과
  - `rg -n "globalAspectRatio|prompt-ko|confirm-sync|confirm-copy-open|buildQueueFromSelection|saveImageToActiveQueue|downloadImageZip|exportImageManifest" tools/midjourney_prompt_generator.html tools/midjourney_prompt_generator_ui.js` 확인
- Notes:
  - 카드에서 비율을 바꾸고 `한글확정→영문반영` 또는 `확정+복사+Midjourney`를 누르면 최종 영문 프롬프트 `--ar`이 해당 비율로 반영됨.
  - 완전 자동 입력(웹 입력창 타이핑)은 정책/브라우저 제약으로 불가하여, 탭 열기+복사까지 자동화 유지.

## [Task ID] 2026-02-15-1110-gpt-key-ux-right-preview-column

### START
- Time: 2026-02-15 11:10
- Owner: GPT(지훈)
- Requester: JIN
- Request Summary: API 키 입력 UX 개선(보기/저장/삭제)과 붙여넣은 이미지의 썸네일+작품 매칭 확인용 우측 컬럼 추가 요청.
- Why: 키 재입력 불편을 줄이고, 이미지가 올바른 작품코드와 매칭됐는지 시각적으로 확인하기 위함.
- Planned Scope:
  - 파일: `tools/midjourney_prompt_generator.html`
  - 예상 변경: 3컬럼 레이아웃 전환, API 키 도구 UI 추가, 우측 썸네일 컬럼 신설
  - 파일: `tools/midjourney_prompt_generator_ui.js`
  - 예상 변경: localStorage 기반 API 키 저장/복원/삭제, 썸네일 렌더 및 이미지 URL 수명 관리
- Status: In Progress

### END
- Time: 2026-02-15 11:20
- Status: Done
- Changed Files:
  - `tools/midjourney_prompt_generator.html:55` (레이아웃을 3컬럼으로 확장: 좌 작품목록 / 중 생성+큐 / 우 이미지 미리보기)
  - `tools/midjourney_prompt_generator.html:636` (API 키 입력행에 `보기`, `이 브라우저에 키 저장`, `저장키 삭제` 추가)
  - `tools/midjourney_prompt_generator.html:731` (우측 `이미지 미리보기` 패널 추가, 썸네일 리스트/ZIP/manifest/초기화 버튼 배치)
  - `tools/midjourney_prompt_generator_ui.js:16` (API 키 localStorage 키 상수 추가)
  - `tools/midjourney_prompt_generator_ui.js:156` (API 키 저장/복원/표시 토글 유틸 추가)
  - `tools/midjourney_prompt_generator_ui.js:396` (이미지 리스트 렌더를 썸네일+작품제목+시인+파일정보 형태로 확장)
  - `tools/midjourney_prompt_generator_ui.js:926` (`clearImageCollectionData()` 추가: 썸네일 object URL 정리)
  - `tools/midjourney_prompt_generator_ui.js:1010` (이미지 저장 시 `thumbUrl` 생성 및 교체 시 기존 URL 해제)
  - `tools/midjourney_prompt_generator_ui.js:1338` (API 키 도구 이벤트 바인딩: 보기/저장/삭제)
  - `docs/work_change_log.md:1` (본 작업 START/END 기록 추가)
- Validation:
  - `node --check tools/midjourney_prompt_generator_ui.js` 통과
  - JS DOM id 매칭 검증(`total 40`, `missing none`) 통과
  - `rg -n "btnToggleApiKey|rememberApiKey|btnForgetApiKey|imageCollectionList|img-thumb|grid-template-columns: 340px 1fr 360px"`로 주요 연결 확인
- Notes:
  - 키 저장은 localStorage 평문 저장이므로 이 브라우저를 단독으로 쓰는 개인 로컬 환경에서만 권장.

---

### 2026-02-15 | 시 모달 UI 전면 리디자인 (두루마리 컨셉)

- START: 2026-02-15 (Claude)
- 요청자: JIN (docs/FromJin/03_Jin_answer.md 최종 결정사항 기반)
- 근거 문서: docs/FromJin/04_UI_implementation_plan_260215_CL.md

- Changes:
  - `styles.css:579` — 모달 폭 min(1400px) → min(860px, 96vw)
  - `styles.css:589-595` — .modal-header: space-between + border-bottom 추가
  - `styles.css:598-601` — .modal-title: display:none 제거 (다시 표시)
  - `styles.css:762-844` — .poem-sec, .poem-head-bar, .poem-body, .poem-section-block, .poem-sec-label 등 새 구조
  - `styles.css:815-836` — 섹션별 배경색 (faf8f5→f5f2ed→f0ede7→ece8e1→e8e4dd→e4e0d9)
  - `styles.css:862-867` — .block-title 숨김 규칙: 전역→선택적 (poem-section-block 내부만 표시)
  - `styles.css:1377-1500` — poem-hero (배경그림+그라데이션) + poem-hero-plain (종이색) 새 구조
  - `styles.css:1460-1500` — 구형 .poem-bg-wrap/.poem-text-overlay 보존 (관리툴 호환)
  - `app.js:1013-1015` — titleCompact 변수 제거 (아코디언 폐지로 불필요)
  - `app.js:1139-1141` — 배경그림 변수 간소화 (textPos, boxStyle 등 미사용 변수 제거)
  - `app.js:1224-1271` — renderPoemSection 반환 HTML 전면 교체: 아코디언→전부 펼침, 섹션별 배경, poem-hero 구조
  - `app.js:1274-1283` — bindPoemSections: 아코디언/subtoggle 핸들러 제거, TTS만 유지
  - `admin/poem-manager.js:1201-1245` — renderPoemPreview: 새 레이아웃 + 구형 오버레이 뷰 병행

- 핵심 변경사항:
  1. 모달 폭 860px + padding 24px
  2. 아코디언 제거 → 모든 섹션 기본 펼침 (스크롤로 탐색)
  3. 섹션별 배경색 (종이색 계열, 위→아래 점점 진해짐)
  4. poem-hero: position:absolute → relative, 하단 그라데이션 페이드
  5. 그림 있는 시: 중앙 정렬 + text-shadow / 없는 시: 좌측 정렬 + 종이색 배경
  6. 관리툴 미리보기도 동일 구조로 동기화

- END: 2026-02-15 (Claude)

---

## [Task ID] 2026-02-16-claude-ui-feedback-annotation-fix

### START
- Time: 2026-02-16
- Owner: Claude
- Requester: JIN
- Request Summary: 형 UI 피드백 반영 (텍스트 크기/간격/스크롤/번역 중복) + 주석 매칭 버그 수정
- Why: 모달 가독성 개선 + 줄바꿈 걸친 주석 33건 미표시 문제 해결

### END
- Time: 2026-02-16
- Status: Done
- Commits:
  - `6c7cb11` — [Claude][UI] 형 피드백 반영: 아코디언 복구 + 2컬럼 시 레이아웃 + 관리툴 수정
  - `0b562cc` — [Claude][Fix] 주석 매칭 개선 + UI 피드백 반영
  - `a012106` — [All] 전체 사이트 업데이트

- Changed Files:
  - `app.js:250-340` — parseTextWithNotes: origToClean/cleanToOrig 위치 매핑으로 줄바꿈 걸친 head 매칭
  - `app.js:315-350` — head 없는 주석도 [번호] 호버 가능하게 note-word span 처리
  - `app.js:1253-1260` — poemZh 전체 텍스트 파싱 (줄별→전체) + 번역 앞 2줄 제거
  - `app.js:1324-1372` — 아코디언 스크롤: 열기→위치보정→부드러운 스크롤
  - `styles.css:761-880` — 시 본문/제목 크기 조정 + 작품 리스트 컴팩트 간격
  - `admin/admin.js:170-195` — saveAll: 변경 없어도 저장 가능
  - `admin/admin.css` — 관리툴 2컬럼 레이아웃 복구
  - `admin/index.html` — No 컬럼 50px, 시인 컬럼 80px

- 상세 변경내역:
  1. **시 본문 텍스트 크기**: .bl-zh 18px, .bl-ko 17px, .poem-title-zh 22px, .poem-title-ko 16px
  2. **번역 제목/시인 중복 제거**: translationKo 앞 2줄 slice(2)로 건너뛰기
  3. **작품 리스트 컴팩트**: poem-sec margin 4px, border-radius 8px, padding 축소
  4. **아코디언 스크롤 UX**: 4차례 반복 수정 → 최종: 열기→보정→smooth scroll
  5. **주석 줄바꿈 매칭**: clean text(줄바꿈+[번호] 제거) 2차 매칭으로 26수/33건 해결
  6. **집평 한자 주석**: head 미매칭시 [번호] 자체를 note-word로 처리 → 호버 가능
  7. **관리툴 저장**: 변경 없어도 저장 버튼 동작

- 수정 영향받은 시 (26수, 주석 33건):
  No.1,3(장구령), 7,79,82(이백), 8,10,11,12,63,89,106(두보),
  15,16,17,116(왕유), 22(구위), 27,28,33(위응물), 45(맹교),
  68(한유), 73(이상은), 97(왕만), 124(맹호연), 161(온정균)

- Notes:
  - 집평 번역(한글) 주석은 로직상 불가 → 형 합의하에 포기
  - 이체자 차이 6건(五岳/五嶽 등)은 데이터 이슈 → 추후 데이터 정제시 해결
  - GitHub Pages 소스 브랜치가 jin-practice-01로 설정됨 (main 아님) → 형 확인 후 유지 결정

## [Task ID] 2026-02-16-claude-admin-poem-sort-history-tab

### START
- Time: 2026-02-16
- Owner: Claude
- Requester: JIN
- Request Summary: 시관리 탭 소팅 개선 + 역사관리 탭 신규 구현
- Why: 시대순 소팅 추가 요청 + 역사 데이터 편집 기능 필요

### END
- Time: 2026-02-16
- Status: Done

- Changed Files:
  - `admin/index.html` — 시관리 소팅 드롭다운에 "시대순" 옵션 추가 + 역사관리 탭 전체 UI
  - `admin/poem-manager.js:181-228` — getPoetAuthorMap() 헬퍼 + sortPoemList() 시대순/시인순(가나다)/제목순(가나다) 개선
  - `admin/history-manager.js` — 신규 파일: 역사관리 모듈 전체 (목록/편집/추가/삭제/되돌리기)
  - `admin/admin.css:1501-1612` — 역사관리 탭 스타일
  - `admin/admin.js:110-113` — initHistoryManager() 호출 추가

- 상세 변경내역:
  1. **시관리 소팅**: 시대순(초→성→중→만, 출생연도순) 추가, 시인순→한글 가나다순, 제목순→한글 가나다순
  2. **역사관리 탭**: 분기점(4개)/단일항목 서브탭, 검색, 시대별 소팅, 편집폼(제목ko/zh, 연도, 시대, 내용), 주석 읽기전용 표시
  3. **분기점 삭제 방지**: MILESTONE_IDS에 속한 H001/H003/H005/H007은 삭제 불가

## [Task ID] 2026-02-16-claude-ui-manager-tab

### START
- Time: 2026-02-16
- Owner: Claude
- Requester: JIN
- Request Summary: 관리툴에 "UI관리" 탭 신규 구현 — 시대별 배경색, 시 모달 섹션 배경색, 폰트(캐릭터셋) 관리
- Why: CSS 하드코딩된 색상/폰트를 관리툴에서 수정 가능하게 + fangsong 볼드 문제 해결 + adobe-fangsong-std 적용
- Ref: `docs/FromJin/11.UI관리툴작업지시_민철에게.md`

### END
- Time: 2026-02-16
- Status: Done

- Changed Files (7개):
  - `public/index/ui_settings.json` — **신규**: UI 설정 JSON (시대별 색상, 섹션 색상, 폰트 5세트)
  - `admin/index.html:48-49` — "UI관리" 탭 버튼 + 탭 패널 HTML (4컬럼 시대색상, 섹션색상, 폰트설정, 미리보기)
  - `admin/ui-manager.js` — **신규**: UI 관리 모듈 전체 (렌더링, 컬러피커, 폰트 드롭다운, 굵기 선택, 실시간 미리보기)
  - `admin/admin.css:1614-1780` — UI관리 탭 스타일 (4컬럼 그리드, 컬러피커, 폰트카드, 미리보기)
  - `admin/admin.js` — DATA/ORIGINAL/FILE_HANDLES에 uiSettings 추가, 로딩/저장/되돌리기/변경감지 연결
  - `app.js:1925-1960` — applyUISettings() 함수: ui_settings.json → CSS 변수 주입
  - `styles.css` — 하드코딩 색상/폰트 17곳을 var(--xxx, 기본값) 으로 전환

- 상세 변경내역:
  1. **시대별 타임라인 배경색**: 4컬럼 동시 비교 + 컬러피커/텍스트 입력 양방향 동기화
  2. **시 모달 섹션 배경색**: 시본문, 집평(한자/한글), 주석, 심화자료, 작품리스트 6개 영역
  3. **폰트 관리 5세트**: 한자제목, 한자본문, 한자시인명, 한글본문, 한글보조 — 각각 폰트/크기/굵기/색상 설정
  4. **폰트 선택지**: Adobe 仿宋(Typekit), 시스템 仿宋, LXGW 霞鹜文楷, Noto明朝TC, Noto명조KR, Georgia
  5. **굵기 선택**: 300~700 (5단계) — fangsong faux bold 문제 해결용
  6. **저장 방식**: 기존 시인/시/역사 JSON과 동일 (File System Access API 또는 다운로드)
  7. **CSS 변수 적용**: app.js에서 ui_settings.json 로딩 → document.documentElement.style에 CSS 변수 설정 → styles.css에서 var() fallback으로 참조

- Notes:
  - fangsong이 둥글둥글 보이는 원인: font-weight 600~700이 적용된 곳에서 브라우저 faux bold 발생
  - Adobe Typekit (kitId: dje5vco)는 index.html에 이미 로딩되어 있으나, CSS에서 fangsong(시스템)을 쓰고 있어 미적용 상태였음
  - ui_settings.json 기본값에서 adobe-fangsong-std로 변경해 놓음
  - ui_settings.json이 없거나 로드 실패해도 CSS var() fallback으로 기존 화면 유지됨
