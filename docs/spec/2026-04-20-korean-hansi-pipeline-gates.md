---
epic_id: korean-hansi-corpus
doc_type: spec
status: draft
title: 한국 한시 파이프라인 실행 게이트
date: 2026-04-20
---

# 한국 한시 파이프라인 실행 게이트

> ⚠️ DIVERGED: 2026-04-21 기준 정지상의 KORCIS 판정이 collection-level hit(`동문선`, `동경잡기`)까지 완료되어 `collection-ready authors`가 3명으로 갱신되었다. 최신 상태는 `docs/spec/korean-hansi-pipeline-readiness.v1.json`을 기준으로 본다.

## 1. 목적

한국 한시 수집/정제/번역 파이프라인을 언제 돌릴지 감으로 정하지 않고,  
`priority-11 board`의 상태를 기준으로 단계별 실행 가능 여부를 판정한다.

## 2. 게이트 정의

### Parallel Track. OCR Recovery Queue

목적:
- 직접 텍스트가 없는 후보를 이미지/PDF 기반 복원 트랙으로 분기
- KORCIS/규장각/장서각/ITKC 원문 이미지 또는 PDF에서 OCR로 poemZh를 복원
- 본문 수집 실패가 전체 파이프라인 정지를 일으키지 않게 함

진입 조건:
- 보드 후보이지만 직접 텍스트 수집 실패
- 또는 직접 텍스트는 있으나 보드 후보와 실제 접근 가능한 작품 목록이 크게 어긋남

운영 원칙:
- OCR 트랙은 `poem source`가 아니라 `text recovery` 보조 트랙이다.
- 학습/평가용 bootstrap 데이터는 AI Hub `고서 한자 인식 OCR 데이터(603)`를 우선 검토한다.
- OCR 결과는 바로 ingest하지 않고:
  - 원문 이미지 대조
  - 권차/수록 위치 고정
  - source policy 검토
  를 거친 뒤 poem record로 승격한다.

현재 실행 아티팩트:
- `docs/spec/korean-hansi-ocr-queue.v1.json`
- `docs/spec/korean-hansi-ocr-queue.v1.tsv`

### Gate A. Research Manifest Dry-Run

목적:
- 조사 대상 manifest 생성
- 후보 작품 큐 고정
- 수집 담당 작업 분할

통과 조건:
- `seed-ready authors >= 3`
- `candidate poems >= 15`

`seed-ready` 정의:
- `authorProfileVerified = true`
- `primaryCollectionVerified = true`
- `encyChecked = true`
- `firstFivePoemsListed = true`

### Gate B. Collection Metadata Dry-Run

목적:
- KORCIS 기준 문집/수록 위치 검증
- 판본/소장처 매핑
- 수집 메타데이터 정합성 점검

통과 조건:
- `collection-ready authors >= 3`
- `candidate poems >= 15`

`collection-ready` 정의:
- Gate A 조건 충족
- `korcisChecked = true`

### Gate C. Ingest Pilot Run

목적:
- 15수 기준 수집 파이프라인 시범 실행
- 원문/메타데이터/권리 태그의 실제 레코드 생성

통과 조건:
- `ingest-ready authors >= 3`
- `candidate poems >= 15`

`ingest-ready` 정의:
- Gate B 조건 충족
- `sourcePolicyAssigned = true`
- `rightsRiskReviewed = true`

### Gate D. Owned Translation Pilot Run

목적:
- 자체 번역 파이프라인 시범 실행
- owned 번역/주석 생성 체계 확인

통과 조건:
- Gate C 통과
- ingest pilot으로 생성된 15수 중 표본 5수 이상 수동 검토 완료
- 번역 금지 입력 차단 규칙 검수 완료

## 3. 현재 시점 판정

2026-04-20 작성 당시 보드 기준:

- `seed-ready authors`: 3명
  - 최치원
  - 정지상
  - 허난설헌
- `seed-ready candidate poems`: 15수
- `collection-ready authors`: 2명
  - 최치원
  - 허난설헌
- `ingest-ready authors`: 0명

즉, **지금 당장 돌릴 수 있는 것은 Gate A 수준의 `research manifest dry-run`까지**다.

## 4. 지금 돌리면 안 되는 것

아직 아래는 이르다.

- full ingest pipeline
- owned translation pipeline
- 상업 전환 판단이 들어가는 대규모 rights batch

이유:

- KORCIS 확인이 3명 전원에 대해 끝나지 않음
- `sourcePolicyAssigned`가 아직 없음
- `rightsRiskReviewed`가 아직 없음

## 5. 실제 권장 시점

### 지금

돌릴 것:
- `research manifest dry-run`

목표:
- 최치원, 정지상, 허난설헌의 15수 후보에 대한 조사 번들 생성

### 다음 시점

아래 3조건이 충족되면 `ingest pilot run`으로 넘어간다.

1. 정지상까지 포함해 최치원, 정지상, 허난설헌 각각 `korcisChecked = true`
2. 세 사람 각각 `sourcePolicyAssigned = true`
3. 세 사람 각각 `rightsRiskReviewed = true`

이 조건이 되면 **15수 기준으로 첫 수집 파이프라인을 돌린다.**

### 번역 파이프라인 시점

다음 조건이 충족될 때만 진입한다.

1. 15수 ingest 결과를 눈으로 검토
2. 최소 5수 표본에서 원문/메타데이터/권리 마킹 이상 없음 확인
3. 레거시 번역 금지 입력 차단 규칙 재확인

그 전에는 번역 파이프라인을 돌리지 않는다.

## 6. 권장 다음 액션

1. 정지상 KORCIS 직접 수록본 재확인
2. 최치원 source policy 지정
3. 허난설헌 source policy 지정
4. 최치원 rights review 완료
5. 허난설헌 rights review 완료
6. 정지상까지 KORCIS/source policy/rights review 완료 후 15수 ingest pilot run
