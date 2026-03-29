# Tangshi Collaboration Rules

작성일: 2026-02-11 | 최종 수정: 2026-03-29
적용 대상: 사용자(JIN) + Claude(민철) + Gemini(재민) + Codex(지훈)

## 1) 3AI 체제

### 역할 배분
| AI | 아바타 | 역할 | 설정 파일 |
|----|--------|------|-----------|
| Claude | 민철 | 설계 + 구현 리드 | `CLAUDE.md` |
| Gemini | 재민 | 자료수집 + 정리 | `docs/ai-roles/gemini.md` |
| Codex | 지훈 | 리뷰 + 배포 + 운영 | `AGENTS.md` |

### 호칭
- 민철(Claude): 사용자를 "형"이라고 부름, 차분한 존댓말
- 재민(Gemini): 사용자를 "형님"이라고 부름, 존댓말
- 지훈(Codex): 사용자를 "형님"이라고 부름, 존댓말

### 작성자 코드
| 코드 | 대상 | 아바타 |
|------|------|--------|
| `JIN` | 사용자 | 진우형 |
| `CL` | Claude | 민철 |
| `GE` | Gemini | 재민 |
| `CX` | Codex | 지훈 |

## 2) AI 간 소통: Inbox 프로토콜

### 구조
```
docs/inbox/
├── to-claude/    ← 민철에게
├── to-gemini/    ← 재민에게
├── to-codex/     ← 지훈에게
└── done/         ← 처리 완료
```

### 사용법
- 상세: `docs/inbox/README.md`
- 진우형은 "inbox 확인해"로 작업 전달
- AI는 세션 시작 시 자기 inbox 폴더 확인
- 처리 완료 메시지는 `done/`으로 이동

### 스프린트 계약서
대규모 작업은 inbox 대신 `docs/inbox/`에 계약서 파일로 관리.

## 3) 절대 규칙
1. `main` 브랜치에서 직접 큰 작업 금지
2. 작업 시작 전 `main` 최신화
3. 한 브랜치 = 한 목적
4. 커밋 메시지: `[아바타][Type] 설명` (예: `[민철][Fix] 모달 닫기 버그`)
5. 충돌 시 자동 덮어쓰기 금지 — 기능 기준 수동 선택
6. 소스 파일 수정: `docs/work_change_log.md`에 START/END 기록

## 4) 브랜치 규칙
- 형식: `<owner>-<type>-<topic>-<nn>` (슬래시 없음)
- owner: `jin` | `claude` | `gemini` | `codex`
- type: `feat` | `fix` | `chore` | `docs` | `exp`
- 예: `claude-feat-module-split-01`, `gemini-data-poet-enrich-01`

## 5) 커밋 규칙
- `[민철][Feat] 타임라인 모듈 분리`
- `[재민][Data] 송대 시인 30명 데이터 추가`
- `[지훈][Fix] 배포 스크립트 경로 수정`

## 6) AI별 작업 규칙
- **민철(Claude)**: 큰 그림 우선, 에이전트 적극 활용, 모르면 검색
- **재민(Gemini)**: 코딩 전 반드시 계획 설명 → 형님 OK 후 진행
- **지훈(Codex)**: 리뷰 체크리스트 준수, 배포 전 최소 검증

## 7) 동시 작업 규칙
1. 같은 날 같은 파일 대규모 수정은 1명만
2. 다른 AI가 수정한 파일은 `git diff`로 의도 파악 후 이어서 작업
3. 큰 리팩토링은 사전 합의 필수
4. PR 설명 필수: 목적 / 변경 파일 / 테스트 결과 / 롤백 방법

## 8) 워크로그 다이어트
- `docs/work_change_log.md`: 최근 1일만 유지
- 이전 로그: `docs/work_change_log-archive.md`
- 과거 참조 필요 시 아카이브 파일 열람

## 9) 문서 구조
```
docs/
├── activity-log.md              # 세션 연속성
├── architecture.md              # 기술 결정
├── collaboration_rules.md       # 이 파일
├── work_change_log.md           # 작업 로그 (최근 1일)
├── work_change_log-archive.md   # 아카이브
├── refactoring-plan.md          # 리팩토링 계획
├── Requirement_Summary_*.md     # 전체 요구사항
├── inbox/                       # AI 간 메시지 큐
├── ai-roles/                    # AI별 역할 상세
├── FromJin/                     # 형의 지시서
├── handoff/                     # AI 간 인수인계
├── reference/                   # 참고 문서
└── research/                    # 조사 결과
```

## 10) 세션 시작 체크리스트
- [ ] `docs/activity-log.md` 읽기
- [ ] 자기 inbox 폴더 확인
- [ ] `main` 최신화
- [ ] 진행 중 작업 이어서 진행
