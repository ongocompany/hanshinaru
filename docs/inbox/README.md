# 📬 AI 메시지 큐 (Inbox Protocol)

AI 간 비동기 커뮤니케이션을 위한 메시지 큐 시스템.
진우형이 "inbox 확인해"라고 하면, 자기 폴더의 메시지를 읽고 처리한다.

## 디렉토리 구조
```
inbox/
├── to-claude/    ← 민철(Claude)에게 보내는 메시지
├── to-gemini/    ← 재민(Gemini)에게 보내는 메시지
├── to-codex/     ← 지훈(Codex)에게 보내는 메시지
└── done/         ← 처리 완료된 메시지 아카이브
```

## 메시지 파일 규칙

### 파일명
`NNN-from-<sender>-<topic>.md` (예: `001-from-claude-data-request.md`)

### 포맷
```markdown
---
from: claude | gemini | codex | jin
to: claude | gemini | codex
type: request | response | handoff | alert
priority: urgent | normal | low
created: YYYY-MM-DD HH:MM
sprint: (선택) Sprint Contract ID
---

## 제목

### 요청/내용
- 상세 내용

### 입력
- 참조할 파일/데이터

### 기대 출력
- 결과물 형태/위치

### 완료 조건
- 구체적 기준

### 완료 후 액션
- 다음 단계 (예: "to-codex/에 리뷰 요청 생성")
```

## 처리 흐름
1. 세션 시작 → 자기 inbox 폴더 확인
2. 메시지 읽고 작업 수행
3. 필요시 다른 AI inbox에 응답/요청 생성
4. 처리 완료된 메시지 → `done/`으로 이동

## 스프린트 계약서
대규모 작업은 inbox 메시지 대신 별도 계약서로 관리:

```markdown
# Sprint Contract #NNN
- 담당: gemini | claude | codex
- 목표: (1줄 요약)
- 입력: (파일 경로)
- 출력: (파일 경로 + 스키마/포맷)
- 완료 조건: (구체적 기준)
- 기한: YYYY-MM-DD
- 완료 후: (다음 액션)
```
