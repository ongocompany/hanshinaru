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
