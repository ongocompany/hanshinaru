---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 한국 한시 코퍼스 설계와 우선 수집 보드 정리
date: 2026-04-20
author: 태훈
---

# 이번 세션에서 완료한 작업

- 한국 한시 공개 자료원 소스맵 작성
- 원문/번역문 권리 분리 원칙 수립
- `source_policy` + 작품 자산별 `rights` + `commercialTransition` 구조 설계
- 샘플 입력/출력 JSON, JSON Schema, 권리표 생성 스크립트 작성
- 위키문헌 안전 케이스, ITKC 허가형, 비상업 번역, 상업 허가형을 섞은 혼합 배치로 권리 판정 로직 검증
- 파일럿 50명 URL 시트 생성
- 한국 한시 문집 수집 기준의 `priority-11` 배치 생성
- `priority-11` 실행 보드 생성
- 최치원 / 정지상 / 허난설헌 3명에 대해 후보 5수씩 실제 채움
- KORCIS 직접 확인:
  - 최치원 `계원필경` 계열 확인 완료
  - 허난설헌 `난설헌집/난설헌시` 계열 확인 완료
  - 정지상은 직접 author/title 매칭 미해결
- 현재 보드 상태를 기준으로 파이프라인 실행 게이트 문서와 readiness 리포트 생성
- `research manifest dry-run` 산출물 생성

# 어디서 멈췄는지

- `priority-11` 상위 3명 중:
  - 최치원: KORCIS 1차 확인 완료, `rights-review` 단계 진입 가능
  - 허난설헌: KORCIS 1차 확인 완료, `rights-review` 단계 진입 가능
  - 정지상: KORCIS 직접 수록본 매칭 미완, 아직 `collection-check` 단계
- 현재 readiness 기준:
  - `seed-ready authors = 3`
  - `seed-ready poem candidates = 15`
  - `collection-ready authors = 2`
  - `ingest-ready authors = 0`
- 따라서 지금 당장 가능한 것은 `research manifest dry-run`까지이며, `15수 ingest pilot run`은 아직 이르다.

# 핵심 판단과 이유

- `local fullPoems 11명`을 시작 배치로 삼는 것은 한국 시문 전체 기준이라 부정확했다.
  - 향가/가사/시조 계열이 섞여 있기 때문.
  - 한국 한시 프로젝트의 실제 시작점은 문집 기반 한문 시문 수집에 바로 들어갈 `priority-11`이 맞다고 판단.
- 파이프라인 실행 시점은 감으로 정하지 않고 보드 상태 게이트로 고정했다.
  - Gate A `research manifest dry-run`은 지금 가능
  - Gate B `collection metadata dry-run`은 정지상 KORCIS 확인이 끝나야 가능
  - Gate C `ingest pilot run`은 상위 3명 모두 `korcisChecked + sourcePolicyAssigned + rightsRiskReviewed`가 돼야 가능
- 권리 판단은 작품 단위가 아니라 자산 단위로 관리해야 한다고 확정했다.
  - 원문, 기존 번역, 기존 주석, 자체 번역, 자체 주석을 분리
  - 상업 전환 시 교체 대상은 `mustReplaceBeforeCommercial`로 기계적으로 추출 가능하게 설계

# 생성/수정/참조한 문서

## 생성

- `docs/research/2026-04-20-korean-hansi-source-map.md`
- `docs/research/2026-04-20-korean-hansi-principles-schema-pilot.md`
- `docs/research/2026-04-20-korean-hansi-pilot-authors.md`
- `docs/spec/2026-04-20-korean-hansi-data-model.md`
- `docs/spec/2026-04-20-korean-hansi-pipeline-gates.md`
- `docs/spec/korean-hansi-source-policies.v1.json`
- `docs/spec/korean-hansi.schema.v1.json`
- `docs/spec/korean-hansi.sample-input.v1.json`
- `docs/spec/korean-hansi.sample-records.v1.json`
- `docs/spec/korean-hansi-mini-pilot.input.v1.json`
- `docs/spec/korean-hansi-mini-pilot.records.v1.json`
- `docs/spec/korean-hansi-mini-pilot.source-urls.tsv`
- `docs/spec/korean-hansi-mini-pilot.rights-sheet.tsv`
- `docs/spec/korean-hansi-mixed-batch.input.v1.json`
- `docs/spec/korean-hansi-mixed-batch.records.v1.json`
- `docs/spec/korean-hansi-mixed-batch.source-urls.tsv`
- `docs/spec/korean-hansi-mixed-batch.rights-sheet.tsv`
- `docs/spec/korean-hansi-pilot-50-url-sheet.v1.json`
- `docs/spec/korean-hansi-pilot-50-url-sheet.v1.tsv`
- `docs/spec/korean-hansi-priority-11-batch.v1.json`
- `docs/spec/korean-hansi-priority-11-batch.v1.tsv`
- `docs/spec/korean-hansi-priority-11-board.v1.json`
- `docs/spec/korean-hansi-priority-11-board.v1.tsv`
- `docs/spec/korean-hansi-pipeline-readiness.v1.json`
- `docs/spec/korean-hansi-research-manifest.v1.json`
- `docs/spec/korean-hansi-research-manifest.v1.tsv`

## 수정

- `package.json`

## 참조

- `public/index/korean_timeline.json`
- `docs/research/11_AI_번역집필_파이프라인_설계_260216_CH.md`
- 한국민족문화대백과 `최치원`, `추야우중`, `제가야산`, `등윤주자화사`, `강남녀`, `향악잡영`, `정지상`, `송인`, `허난설헌`, `난설헌집`
- KORCIS 웹/OpenAPI 결과

# 원래 계획과 달라진 점

- 처음에는 `local fullPoems`가 있는 11명부터 시작하려 했으나, 한국 한시 기준으로는 부정확하다고 판단해 폐기했다.
- 대신 문집 기반 한문 시문 수집이 바로 가능한 `priority-11` 별도 배치를 새로 만들었다.
- KORCIS는 웹 검색보다 OpenAPI가 더 안정적이어서, 중간부터 OpenAPI 중심 확인 방식으로 전환했다.

# 다음 세션의 첫 행동

1. 정지상 KORCIS 직접 수록본 매칭 끝내기
2. 최치원 `sourcePolicyAssigned` + `rightsRiskReviewed` 완료
3. 허난설헌 `sourcePolicyAssigned` + `rightsRiskReviewed` 완료
4. 그 뒤 readiness 재계산

# 다음 세션이 피해야 할 함정

- `local fullPoems` 보유 여부를 한국 한시 수집 우선순위와 동일시하지 말 것
- 정지상은 `author=정지상` 검색만으로는 족보류가 많이 섞여 오염된다
- KORCIS 작품명 검색은 표제 불일치가 많아서 `문집 단위 접근`이 더 낫다
- KORCIS 확인이 끝나기 전에는 `15수 ingest pilot run`으로 넘어가지 말 것
- 기존 번역문은 비상업 허용이더라도 기본적으로 상업 전환 위험 표시를 남길 것
