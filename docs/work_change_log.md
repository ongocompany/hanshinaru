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

## [Task ID] 2026-02-12-0900-gemini-unknown-author-research

### START
- Time: 2026-02-12 09:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 생몰년 미상 작가들의 활동 시기 추가 조사 및 문서화.
- Why: 데이터 정비를 위해 작가들의 활동 시기(초/성/중/만당) 분류가 필요함.
- Planned Scope:
  - 파일: `docs/unknown_author.md`
  - 예상 변경: 추가 조사 필요 대상 13명의 활동 시기 추적 및 결과 정리
- Status: In Progress

### END
- Time: 2026-02-12 09:10
- Status: Done
- Changed Files:
  - `docs/unknown_author.md:112` (추가 조사 결과 섹션 및 종합 분류 표 추가)
- Validation:
  - 각 작가별 연호, 급제 년도, 교유 관계 등을 근거로 시대 분류 완료.
- Notes:
  - 朱慶餘는 중당 말기~만당 초기에 걸치나 급제 년도(826) 기준으로 중당으로 분류함.

### END
- Time: 2026-02-12 09:10
- Status: Done
- Changed Files:
  - `docs/unknown_author.md:112` (추가 조사 결과 섹션 및 종합 분류 표 추가)
- Validation:
  - 각 작가별 연호, 급제 년도, 교유 관계 등을 근거로 시대 분류 완료.
- Notes:
  - 朱慶餘는 중당 말기~만당 초기에 걸치나 급제 년도(826) 기준으로 중당으로 분류함.
  - 중복 기록된 로그를 정리하고 최종 결과를 반영함.

## [Task ID] 2026-02-12-1530-claude-era-field-add

### START
- Time: 2026-02-12 15:30
- Owner: Claude(민철)
- Requester: JIN
- Request Summary: 전체 작가 76명에게 시대(era) 필드를 추가. 생몰년 있는 작가는 birth 기준 자동 계산, 생몰년 미상 28명은 태훈(Gemini) 조사 결과 반영.
- Why: 작가 데이터 정합성 확보 및 향후 시대별 필터링/정렬 기능 구현 기반 마련.
- Planned Scope:
  - 파일: `public/index/db_author.with_ko.json`
  - 예상 변경: 전체 작가 객체에 `era` 필드 추가 (period, confidence, source)
  - 파일: `scripts/add_era_field.js` (신규)
  - 예상 변경: 시대 필드 추가 자동화 스크립트 작성
- Status: In Progress

### END
- Time: 2026-02-12 15:45
- Status: Done
- Changed Files:
  - `public/index/db_author.with_ko.json:전체` (전체 76명 작가에게 era 필드 추가)
  - `scripts/add_era_field.js:1` (시대 필드 추가 자동화 스크립트 신규 작성)
  - `public/index/db_author.with_ko.backup.json:1` (백업 파일 자동 생성)
- Validation:
  - JSON 문법 검증: ✅ 정상
  - 총 작가 수: 76명
  - era 필드 보유: 76명 (100%)
  - 시대별 분포: 초당 25명, 성당 18명, 중당 20명, 만당 13명
  - 샘플 검증: 이백(701년생→초당), 온정균(생몰년 미상→만당) 정상
- Notes:
  - 생년 기준 자동 계산: 48명
  - 태훈(Gemini) 조사 결과 반영: 28명
  - 백업 파일 위치: `public/index/db_author.with_ko.backup.json`
  - era 필드 구조: `{period, confidence, source}`

## [Task ID] 2026-02-12-1600-claude-era-refinement

### START
- Time: 2026-02-12 16:00
- Owner: Claude(민철)
- Requester: JIN
- Request Summary: 태훈(Gemini)의 조사 결과를 기반으로 생몰년 있는 작가 48명의 era 필드를 실제 활동 시기 기준으로 재정제.
- Why: 생년만으로는 활동 시기가 부정확. bioKo 텍스트 분석 및 웹 서칭 결과를 반영하여 정확도 향상.
- Planned Scope:
  - 파일: `public/index/db_author.with_ko.json`
  - 예상 변경: 48명 중 26명 era 필드 수정 (태훈 조사 결과 반영)
  - 파일: `scripts/update_era_from_taehun.js` (신규)
  - 예상 변경: 태훈 결과 기반 era 업데이트 스크립트 작성
- Status: In Progress

### END
- Time: 2026-02-12 16:15
- Status: Done
- Changed Files:
  - `public/index/db_author.with_ko.json:전체` (25명 era 필드 수정)
  - `scripts/update_era_from_taehun.js:1` (태훈 결과 기반 업데이트 스크립트 신규 작성)
  - `public/index/db_author.with_ko.backup2.json:1` (백업 파일 자동 생성)
  - `docs/era_refinement_results.md:1` (태훈 조사 결과 문서, 태훈 작성)
  - `docs/claude_to_gemini_handoff.md:1` (AI 간 핸드오프 문서 작성)
- Validation:
  - JSON 문법 검증: ✅ 정상
  - 샘플 검증: 이백(초당→성당), 두보(초당→성당), 이상은(중당→만당) 정상
  - 시대별 분포 (변경 후): 초당 8명, 성당 27명, 중당 27명, 만당 14명
  - 시대별 분포 (변경 전): 초당 25명, 성당 18명, 중당 20명, 만당 13명
- Notes:
  - 태훈(Gemini)의 bioKo 분석 및 웹 서칭 결과 반영
  - 생년 기준 → 실제 활동 시기 기준으로 재정제
  - 25명 era 변경, 25명 유지
  - bioKo 기반 47명, birth+20 보정 1명
  - 백업 파일: db_author.with_ko.backup2.json

## [Task ID] 2026-02-12-1700-gemini-historical-portraits-setup

### START
- Time: 2026-02-12 17:00
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 역사 카드 인물들의 초상화 수집 및 자동 다운로드 환경 구축.
- Why: 시각적 완성도를 높이고 중국 사료 기반의 정확한 이미지를 제공하기 위함.
- Planned Scope:
  - 파일: `docs/historical_portraits_map.md` (신규)
  - 파일: `scripts/download_portraits.py` (신규)
- Status: In Progress

### END
- Time: 2026-02-12 17:15
- Status: Done
- Changed Files:
  - `docs/historical_portraits_map.md` (인물별 초상화 URL 매핑)
  - `scripts/download_portraits.py` (자동 다운로드 스크립트)
- Validation: 중국 간체자 검색을 통한 교차 검증 완료.

## [Task ID] 2026-02-12-1720-gemini-historical-portraits-fix

### START
- Time: 2026-02-12 17:20
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 초상화 다운로드 스크립트 경로 및 권한 이슈 수정.
- Why: 위키미디어의 User-Agent 차단 정책 및 로컬 실행 경로 문제 해결.
- Planned Scope:
  - 파일: `scripts/download_portraits.py`
  - 예상 변경: 절대 경로 로직 적용 및 User-Agent 헤더 추가
- Status: In Progress

### END
- Time: 2026-02-12 17:40
- Status: Done
- Changed Files:
  - `scripts/download_portraits.py` (경로 및 헤더 수정 완료)
- Notes: 사용자의 환경에 따라 `pip3` 및 `python3` 명령어를 사용하도록 가이드함.

## [Task ID] 2026-02-12-1750-gemini-historical-portraits-debug

### START
- Time: 2026-02-12 17:50
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 초상화 다운로드 스크립트 무반응 이슈 해결을 위한 디버깅 로그 강화.
- Why: 사용자가 스크립트 실행 시 아무런 출력이나 변화를 느끼지 못함.
- Planned Scope:
  - 파일: `scripts/download_portraits.py`
  - 예상 변경: 실행 단계별 print문 추가, 라이브러리 설치 체크 로직 추가
- Status: In Progress

### END
- Time: 2026-02-12 18:00
- Status: Done
- Changed Files:
  - `scripts/download_portraits.py` (상세 로그 및 예외 처리 강화)
- Validation:
  - 스크립트 시작부터 종료까지 모든 단계를 터미널에 출력하도록 개선.

## [Task ID] 2026-02-12-1810-gemini-historical-portraits-final-fix

### START
- Time: 2026-02-12 18:10
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 초상화 다운로드 실패 이슈 최종 해결.
- Why: 위키미디어의 엄격한 봇 차단 정책 및 복잡한 해시 URL 구조로 인해 다운로드 실패가 지속됨.
- Planned Scope:
  - 파일: `scripts/download_portraits.py`
  - 예상 변경: `Special:FilePath` 리다이렉트 방식 도입, 브라우저급 User-Agent 적용, 요청 간 딜레이 추가
- Status: In Progress

### END
- Time: 2026-02-12 18:20
- Status: Done
- Changed Files:
  - `scripts/download_portraits.py` (로직 전면 개편)
- Validation:
  - `Special:FilePath`를 통한 유연한 URL 매칭 및 차단 방지 로직 적용.

## [Task ID] 2026-02-12-1830-gemini-historical-portraits-manual-handoff

### START
- Time: 2026-02-12 18:30
- Owner: Gemini(태훈)
- Requester: JIN
- Request Summary: 자동 다운로드 중단 및 사용자 직접 수집으로 전환.
- Why: 위키미디어 URL의 불안정성 및 사용자 취향에 맞는 이미지 선택을 위해 직접 수집 결정.
- Status: Done

### END
- Time: 2026-02-12 18:35
- Status: Done
- Notes: 사용자가 이미지 수집 완료 후 일괄 파일명 정리 및 크롭 작업을 지원하기로 함.

## [Task ID] 2026-02-12-1630-claude-timeline-era-integration

### START
- Time: 2026-02-12 16:30
- Owner: Claude(민철)
- Requester: JIN
- Request Summary: app.js에서 타임라인과 작가 카드 매칭을 생년(birth) 기준에서 활동 시기(era) 기준으로 변경.
- Why: DB에 era 필드가 추가되었으므로, 이를 타임라인 UI에 반영하여 더 정확한 시대별 시인 분류 제공.
- Planned Scope:
  - 파일: `app.js`
  - 예상 변경: buildAuthorEvents 함수의 year 계산 로직 수정 (line 921)
- Status: In Progress

### SUSPEND (작업 중단)
- Time: 2026-02-12 16:35
- Status: Suspended (UI 설계 검토 필요)
- Progress Summary:
  - ✅ 타임라인 매칭 함수 위치 파악 완료
    - 핵심 함수: `buildAuthorEvents` (line 909-946)
    - 문제 라인: line 921 `const year = a?.life?.birth ?? null;`
  - ✅ era 필드 구조 파악
    - period: 'early' | 'high' | 'mid' | 'late'
    - confidence: 'high' | 'medium' | 'low'
    - source: 'birth_year' | 'bio_era' | 'bio_regnal_year' | 'direct_era' | 'related_person' | 'regnal_year' | 'birth_20'
  - ✅ 수정 방향 설계
    - period를 대표 연도로 변환하는 헬퍼 함수 필요
    - 예시: early → 660년, high → 740년, mid → 800년, late → 870년
- Blocking Issues:
  1. **UI/UX 설계 결정 필요**
     - period를 어떤 연도로 매핑할지 (시대 중간? 시작? 끝?)
     - 타임라인에 시대 구분선 표시 여부
     - 작가 카드에 era 정보 표시 방법
  2. **데이터 표현 방식 결정 필요**
     - 생년 정보와 era 정보를 함께 표시할지
     - era가 없는 작가 처리 방법 (fallback: birth)
     - 생몰년 미상 + era 있는 경우 표시 방법
- Next Steps:
  1. UI 디자인 방향 결정 (형님과 논의)
  2. period → year 매핑 테이블 확정
  3. app.js 수정 및 테스트
  4. 타임라인 렌더링 검증
- Files Analyzed:
  - `app.js:909-946` (buildAuthorEvents 함수)
  - `app.js:921` (year 계산 로직)
  - `app.js:1013-1027` (타임라인 렌더링 메인 로직)
  - `public/index/db_author.with_ko.json` (era 필드 구조 확인)
- Notes:
  - 현재 타임라인은 생년 기준으로 정렬/그룹핑
  - era 기준으로 변경 시 시각적 흐름이 더 자연스러울 것으로 예상
  - 하지만 UI 변경이 사용자 경험에 미치는 영향 검토 필요
  - 형님이 UI 고민 후 재개하기로 결정
