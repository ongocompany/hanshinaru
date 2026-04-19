# 참조 문서

## 3AI 체제
| AI | 아바타 | 역할 | 설정 |
|----|--------|------|------|
| Claude | 민철 | 설계+구현 | CLAUDE.md |
| Gemini | 재민 | 자료수집+정리 | docs/archive/ai-roles/gemini.md |
| Codex | 지훈 | 리뷰+배포+운영 | AGENTS.md |

## 주요 경로
- **docs/tech-overview.md** — 기술 개요 (기술스택·구조·인프라 원스톱 레퍼런스)
- docs/handoff/ — 핸드오프 (세션 시작 시 최신 파일 읽기)
- docs/spec/ — 현재 스펙 문서
- docs/plan/ — 현재 구현 계획

## 세션 시작 필수
1. `docs/handoff/` 최신 파일 읽기
2. `docs/tech-overview.md` 확인 (처음 접하는 경우)
3. `git log --oneline -20` 확인
4. 진행 중이던 작업 이어서 진행

## 자매 프로젝트
- JDS: 전당시 47,198수 API 서버 (`/development/jds`, jinas:8080)
- 한자한자 (hanjahanja): 한글→한자 변환앱, 한자 사전 데이터 공유 가능
- hime: 한자 입력기
