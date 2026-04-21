---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 정지상 KORCIS collection check 완료와 readiness 갱신
date: 2026-04-21
author: 태훈
---

# 이번 세션에서 완료한 작업

- 지난 커밋 `451f8ac`과 최신 핸드오프 `2026-04-20-korean-hansi-corpus-planning.md`를 기준으로 맥락 복구
- `priority-11` 보드와 readiness 스크립트 구조 재확인
- 정지상 KORCIS 검증 보강:
  - `정지상` author 검색은 진양정씨세보 계열로 오염됨을 재확인
  - `鄭司諫集` direct title 검색은 결과 0건
  - 작품명 direct 검색 `送人`, `栢律寺`도 결과 0건
  - 대신 collection title 검색으로 `東文選`, `東京雜記` KORCIS 수록본 다건 확인
- EncyKorea `정지상` 항목의 “작품으로는 『동문선』, 『동경잡기』, 『정사간집』에 전함” 문장을 근거로 KORCIS 판정을 `collection-level hit` 기준으로 상향
- `scripts/build_korean_hansi_priority_11_board.js` 갱신 후 보드 JSON/TSV 재생성
- `scripts/assess_korean_hansi_pipeline_readiness.js`를 상태 기반 `nextRequirements`/`openBlockers` 생성 방식으로 개선하고 readiness JSON 재생성
- `docs/spec/2026-04-20-korean-hansi-pipeline-gates.md`에 `DIVERGED` 메모 추가
- `research manifest` JSON/TSV 재생성

# 어디서 멈췄는지

- 현재 readiness:
  - `researchManifestDryRun = passed`
  - `collectionMetadataDryRun = passed`
  - `ingestPilotRun = not passed`
- 상위 3명 상태:
  - 최치원: `korcisChecked=true`, `sourcePolicyAssigned=false`, `rightsRiskReviewed=false`
  - 정지상: `korcisChecked=true`, `sourcePolicyAssigned=false`, `rightsRiskReviewed=false`
  - 허난설헌: `korcisChecked=true`, `sourcePolicyAssigned=false`, `rightsRiskReviewed=false`
- 정지상 남은 blocker:
  - `정사간집 direct KORCIS bib unresolved`
  - `5수 poem-level locator not fixed`

# 핵심 판단과 이유

- 정지상은 작품명 direct search로 풀려고 하면 계속 막힌다.
  - KORCIS가 author/title direct match에는 약하고 족보류 오염이 심함.
- 따라서 이번에는 `작품 -> 컬렉션`이 아니라 `EncyKorea 수록 문헌 진술 -> KORCIS collection title hit` 순서로 판정을 바꿨다.
  - 이 수준이면 `collection-check`는 끝났다고 보는 것이 타당하다.
  - 다만 아직 `metadata track`만 확인했을 뿐이므로 ingest-ready로 올리면 안 된다.
- readiness는 `research manifest dry-run`에서 `collection metadata dry-run`으로 올렸지만, `sourcePolicyAssigned/rightsRiskReviewed`가 끝나기 전까지 full ingest는 계속 보류한다.

# 생성/수정/참조한 문서

## 수정

- `scripts/build_korean_hansi_priority_11_board.js`
- `scripts/assess_korean_hansi_pipeline_readiness.js`
- `docs/spec/2026-04-20-korean-hansi-pipeline-gates.md`
- `docs/spec/korean-hansi-priority-11-board.v1.json`
- `docs/spec/korean-hansi-priority-11-board.v1.tsv`
- `docs/spec/korean-hansi-pipeline-readiness.v1.json`
- `docs/spec/korean-hansi-research-manifest.v1.json`
- `docs/spec/korean-hansi-research-manifest.v1.tsv`

## 참조

- `docs/handoff/2026-04-20-korean-hansi-corpus-planning.md`
- `docs/spec/2026-04-20-korean-hansi-pipeline-gates.md`
- `docs/spec/korean-hansi-source-policies.v1.json`
- `https://encykorea.aks.ac.kr/Article/E0050946`
- KORCIS 검색:
  - `정지상`
  - `東文選`
  - `東京雜記`
  - `鄭司諫集`
  - `送人`
  - `栢律寺`

# 원래 계획과 달라진 점

- 원래는 정지상에 대해 `정사간집` 또는 작품명 direct hit를 먼저 잡으려 했지만, 이번 세션에서는 그 접근을 잠시 접었다.
- 대신 `동문선`/`동경잡기` collection-level hit를 먼저 확정해 Gate B를 통과시키는 쪽으로 정리했다.

# 다음 세션의 첫 행동

1. 최치원 `sourcePolicyAssigned` + `rightsRiskReviewed` 완료
2. 허난설헌 `sourcePolicyAssigned` + `rightsRiskReviewed` 완료
3. 정지상도 동일하게 `sourcePolicyAssigned` + `rightsRiskReviewed` 완료
4. 정지상 5수의 `동문선`/`동경잡기` 내 실제 권차·수록 위치를 고정
5. readiness 재계산 후 `15수 ingest pilot run` 진입 여부 판단

# 다음 세션이 피해야 할 함정

- 정지상을 다시 author direct 검색부터 시작하지 말 것
- `korcisChecked=true`를 ingest-ready와 혼동하지 말 것
- `SRC-KORCIS-METADATA`는 metadata track이지 원문 ingest source 확정이 아님
- 정지상 `정사간집` direct bib 미확인을 이유로 `collection-check` 전체를 다시 원점으로 돌리지 말 것
