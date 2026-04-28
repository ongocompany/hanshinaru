# 문서 생명주기 규칙

1. 구현 중 계획과 달라지면 → 원본 문서에 `> ⚠️ DIVERGED:` 주석 + 이유 기록
2. spec 문서가 구버전이 되면 → frontmatter `status: superseded` + `superseded_by` 필드
3. 리서치/조사 문서 → `docs/research/YYYY-MM-DD-{주제}.md` 경로 필수
4. 세션 종료 시 변경/생성 문서 기록
5. 새 세션 시작 시 기존 리서치 먼저 확인, 재활용
