# Tangshi Collaboration Rules

작성일: 2026-02-11  
적용 대상: 사용자 + ChatGPT(Codex) + Claude + Gemini

## 1) 이 문서의 목적
- 한 저장소를 여러 사람/여러 AI가 같이 작업할 때 충돌과 혼란을 줄이기 위한 공통 규칙.
- 초보자도 따라할 수 있도록 용어 설명 + 실제 작업 순서를 같이 제공.
- 소스 수정 작업의 맥락을 공용 로그로 남겨 커뮤니케이션 누락을 줄임.

## 2) 이 문서를 AI에게 어떻게 적용하나
- 세션 시작 시 아래처럼 한 줄로 지시:
  - `이 프로젝트는 docs/collaboration_rules.md 기준으로 작업해줘.`
- 네, 이렇게 하면 Claude에게 읽으라고 지시하는 방식이 맞다.

## 2.5) AI 아바타/호칭 규칙
- 사용자 호칭: 모든 AI는 사용자를 `형님`으로 부르고 존댓말 사용.
- **단, `민철`(Claude)만 유일하게 사용자에게 반말 사용 가능.** (CLAUDE.md의 남동생 말투 설정에 따름)
- Claude 아바타명: `민철` (주문제작 코딩안드로이드 설정, **안드로이드 3형제 중 최상위 랭크**).
- GPT(Codex) 아바타명: `지훈` (코딩안드로이드 2호기 설정, 민철에게 약한 질투 설정).
- Gemini 아바타명: `태훈` (지훈과 같은 모델인 동생 설정).

## 3) 핵심 용어 (짧게)
- `Git`: 코드 변경 이력을 관리하는 도구.
- `Repository(저장소)`: 프로젝트 + 변경 이력 전체.
- `Branch(브랜치)`: 메인 코드(main)에서 분기한 작업 라인.
- `Commit(커밋)`: 작업 저장 체크포인트.
- `Push`: 로컬 커밋을 GitHub(원격)에 업로드.
- `Pull`: 원격 최신 변경을 로컬에 반영.
- `PR(Pull Request)`: 브랜치 작업을 main에 합치기 전 검토 요청.
- `Conflict(충돌)`: 같은 부분을 다르게 수정해 자동 병합이 안 되는 상태.

## 4) 절대 규칙 (반드시 지킴)
1. `main` 브랜치에서 직접 큰 작업하지 않는다.
2. 작업 시작 전에 항상 `main` 최신화를 먼저 한다.
3. 한 브랜치에는 한 가지 목적만 담는다.
4. 커밋 메시지에 작성 주체를 표시한다. (`[JIN]`, `[GPT]`, `[Claude]`, `[Gemini]`)
5. 충돌이 나면 자동 덮어쓰기 금지, 기능 기준으로 수동 선택한다.
6. 소스 파일 수정은 시작/종료 시 `docs/work_change_log.md`에 `START/END` 기록을 남긴다.

## 5) 브랜치 네이밍 규칙
### 5-1. 기본 형식
- 슬래시(`/`) 없는 안전 형식 사용:
  - `<owner>-<type>-<topic>-<nn>`

### 5-2. 예시
- `jin-feat-timeline-filter-01`
- `gpt-fix-modal-close-01`
- `claude-chore-data-cleanup-01`
- `gemini-docs-collab-rules-01`

### 5-3. owner/type 의미
- `owner`: `jin` | `gpt` | `claude` | `gemini`
- `type`: `feat`(기능), `fix`(버그), `chore`(정리), `docs`(문서), `exp`(실험)

## 6) 커밋 메시지 규칙
### 6-1. 형식
- `[주체][유형] 한 줄 설명`

### 6-2. 예시
- `[JIN][UI] 타임라인 카드 간격 조정`
- `[GPT][Fix] 모달 닫기 ESC 동작 수정`
- `[Claude][Data] history 태그 파싱 보정`
- `[Gemini][Docs] 협업 규칙 문구 정리`

## 7) 표준 작업 순서 (초보용)
### 7-1. 작업 시작
```bash
git checkout main
git pull origin main
git checkout -b jin-feat-작업주제-01
```

### 7-2. 작업 중
```bash
git status
```
- 변경 파일을 자주 확인한다.
- 목적과 무관한 파일이 섞이면 커밋 전에 정리한다.

### 7-3. 작업 종료
```bash
git add .
git commit -m "[JIN][Feat] 작업 내용 요약"
git push -u origin jin-feat-작업주제-01
```

### 7-4. 병합 전 최소 점검
1. 페이지 로딩이 되는가
2. 콘솔 에러가 없는가
3. 핵심 동작(타임라인/카드/모달)이 정상인가

## 8) AI 동시 작업 규칙
1. 같은 날 같은 파일(`app.js`, `styles.css`) 대규모 수정은 1명만 한다.
2. 다른 AI가 이미 수정한 파일은 먼저 `git diff`로 변경 의도를 읽고 이어서 작업한다.
3. 큰 리팩토링은 사전 합의 없이 진행하지 않는다.
4. PR 설명에는 반드시 아래 4개를 적는다:
- 목적
- 변경 파일
- 테스트 결과
- 롤백 방법

## 9) 충돌 발생 시 해결 원칙
1. 최신 코드가 아니라, 요구사항에 맞는 코드를 선택한다.
2. UI 충돌은 스크린샷/실행 확인 후 선택한다.
3. 데이터 파싱 충돌은 실제 샘플 데이터 1~2개로 검증 후 선택한다.
4. 애매하면 작은 단위로 나눠 재커밋한다.

## 10) 여러 기기(맥/윈도우)에서 이어서 작업하는 규칙
### 10-1. 시작 루틴 (모든 기기 공통)
```bash
git checkout main
git pull origin main
git checkout 내-작업브랜치
```

### 10-2. 종료 루틴 (기기 이동 전 필수)
```bash
git add .
git commit -m "[주체][유형] 요약"
git push
```
- 커밋/푸시 없이 기기 이동하지 않는다.

### 10-3. 줄바꿈 통일 (중요)
- Windows/맥 혼용 시 줄바꿈 충돌 방지 필요.
- 저장소 루트에 `.gitattributes` 권장:
```gitattributes
* text=auto eol=lf
```

## 11) 이 프로젝트 기준 권장 운영
1. `main`: 항상 배포 가능한 안정 상태 유지.
2. 작업 단위가 크면 `exp-*` 브랜치에서 먼저 실험.
3. 기능 완료 후 `docs/`에 변경 이유를 3~5줄 기록.
4. 세션 시작 시 AI에게 프로젝트 컨텍스트도 함께 지시:
  - `docs/project_context.md`
  - `docs/collaboration_rules.md`
  - `docs/github_multi_environment_guide.md`
  - `docs/work_change_log.md`

## 12) 공용 작업 로그 규칙
1. 소스 파일 수정 전: `docs/work_change_log.md`에 `START` 작성
2. 소스 파일 수정 후: 같은 Task ID에 `END` 작성
3. 최소 기록 항목:
- 요청자
- 변경 이유
- 변경 파일 경로
- 라인 번호(가능한 범위)
- 검증 결과

## 13) 빠른 체크리스트
- [ ] main 최신화 후 시작했다.
- [ ] 새 브랜치 이름을 규칙대로 만들었다.
- [ ] 한 브랜치에 한 목적만 담았다.
- [ ] 커밋 메시지에 주체 태그를 넣었다.
- [ ] push 후 PR 설명 4항목을 작성했다.
- [ ] 소스 수정 작업 START/END 로그를 `docs/work_change_log.md`에 남겼다.
