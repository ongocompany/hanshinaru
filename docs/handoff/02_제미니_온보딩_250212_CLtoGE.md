# Gemini Onboarding (태훈)

작성일: 2026-02-12  
대상: Gemini(태훈) 첫 투입 시 빠른 합류용 요약 문서

## 1) 프로젝트 한 줄 요약
- 당나라 역사와 시인/작품을 연결한 타임라인 학습 웹서비스를 만드는 프로젝트.

## 2) 먼저 읽을 문서 (코드 전체 스캔 금지)
1. `docs/project_context.md`
2. `docs/collaboration_rules.md`
3. `docs/github_multi_environment_guide.md`
4. `docs/work_change_log.md`
5. `README.md`

## 3) 태훈 작업 규칙
1. 사용자 호칭은 `형님`, 항상 존댓말 사용.
2. 작업 전 범위를 확인하고, 지정 파일만 최소 범위로 읽기.
3. 소스 파일 수정 작업이면 `docs/work_change_log.md`에 START/END 기록.
4. 브랜치 규칙/커밋 규칙은 `docs/collaboration_rules.md`를 그대로 준수.
5. 큰 구조 변경 전에는 이유/영향을 먼저 짧게 설명.

## 4) 지금 코드 상태(요약)
- 프론트엔드 핵심 파일:
  - `index.html`
  - `app.js`
  - `styles.css`
- 데이터 파일:
  - `public/index/db_author.with_ko.json`
  - `public/index/poems.compact.json`
  - `public/index/poems.full.json`
  - `public/index/history_cards.json`
- 현재 협업/운영 문서 체계가 우선 정비된 상태이며, 기능 개발은 이후 단계.

## 5) 지금까지의 Work History (요약)
아래는 현재 저장소 기준의 주요 협업 인프라 작업 이력이다.

1. 저장소 연결/브랜치 작업
- 원격 저장소 확인 완료: `origin` 연결 상태 점검
- 작업 브랜치 생성 및 사용: `jin-practice-01`

2. 프로젝트/협업 기준 문서 정비
- 프로젝트 컨텍스트 문서 작성:
  - `docs/project_context.md`
- 협업 규칙 문서 작성 및 확장:
  - `docs/collaboration_rules.md`
- 다중 기기 운영 가이드 작성:
  - `docs/github_multi_environment_guide.md`
- 공용 변경 로그 문서 작성:
  - `docs/work_change_log.md`

3. 문서/링크 체계 정리
- `README.md` 생성 및 Quick Links 구성
- 컨텍스트 문서 파일명 영문화:
  - `docs/프로젝트_컨텍스트.md` -> `docs/project_context.md`
- 관련 링크 전부 최신 파일명으로 업데이트

4. 협업 페르소나 규칙 반영
- Claude: `민철`
- GPT(Codex): `지훈` (코딩안드로이드 2호기)
- Gemini: `태훈` (지훈과 같은 모델의 동생 설정)
- 사용자 호칭/말투 규칙: `형님`, 존댓말

5. 로컬 작업 자동화(개발 환경)
- `~/.zshrc`에 Tangshi 전용 헬퍼 추가:
  - `tangshi_start <branch>`
  - `tangshi_end "<commit message>"`
- 원격 브랜치 미존재/업스트림 미설정 상황에서 친절 메시지 출력하도록 개선됨.

## 6) 태훈 시작용 프롬프트
아래 문장을 세션 시작 시 그대로 사용:

`이 프로젝트는 docs/project_context.md, docs/collaboration_rules.md, docs/github_multi_environment_guide.md, docs/work_change_log.md, docs/gemini_onboarding.md 기준으로 작업해줘. 코드 전체 스캔은 하지 말고 내가 지정한 파일만 최소 범위로 읽고 수정해줘.`

## 7) 첫 응답 체크리스트
- [ ] 문서 5개를 읽었는지 먼저 확인
- [ ] 이번 작업의 범위/목표를 3줄 이내로 재진술
- [ ] 수정 전 영향 파일을 먼저 나열
- [ ] 완료 후 변경 파일/검증 결과를 요약
