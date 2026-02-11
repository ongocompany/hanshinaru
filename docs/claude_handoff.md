# Claude Handoff (민철 전달용)

작성일: 2026-02-12

## 1) 먼저 읽을 문서
1. `docs/project_context.md`
2. `docs/collaboration_rules.md`
3. `docs/github_multi_environment_guide.md`
4. `docs/work_change_log.md`
5. `docs/gemini_onboarding.md`
6. `README.md`

## 2) 작업 원칙 (요약)
1. 사용자 호칭은 `형님`, 존댓말 사용.
2. 코드 전체 스캔 금지, 형님이 지정한 파일만 최소 범위로 읽기.
3. 소스 수정 전/후 `docs/work_change_log.md`에 START/END 기록.
4. 브랜치/커밋/다중기기 규칙은 협업 문서 기준 준수.
5. 큰 리팩토링/구조 변경은 사전 합의 후 진행.

## 3) 최근 변경 핵심
1. 협업 문서 체계 정비 완료:
- `docs/project_context.md`
- `docs/collaboration_rules.md`
- `docs/github_multi_environment_guide.md`
- `docs/work_change_log.md`
- `docs/gemini_onboarding.md`
- `README.md` 링크 체계

2. 컨텍스트 문서 파일명 정리:
- 기존 한글 파일명 -> `docs/project_context.md`로 통일

3. 앱 로직 관련 최근 수정(중요):
- 생몰년도 미상 작가가 타임라인에 누락되던 문제 대응
- `app.js`에서 `연도 미상` 행 렌더링 로직 추가
- 작가명 매칭 안정화를 위해 `normalizePoetName()` 도입

## 4) 민철 시작 프롬프트 (복붙용)
`이 프로젝트는 docs/project_context.md, docs/collaboration_rules.md, docs/github_multi_environment_guide.md, docs/work_change_log.md, docs/gemini_onboarding.md, docs/claude_handoff.md 기준으로 작업해줘. 코드 전체 스캔은 하지 말고 내가 지정한 파일만 최소 범위로 읽고 수정해줘. 소스 수정 작업이면 work_change_log에 START/END를 남겨줘.`
