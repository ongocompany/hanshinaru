---
epic_id: korean-hansi-corpus
doc_type: spec
status: draft
title: 한국 한시 데이터 모델 v1
date: 2026-04-20
---

# 한국 한시 데이터 모델 v1

## 1. 목적

한국 한시 프로젝트에서 사용할 기본 데이터 구조와 권리 관리 방식을 고정한다.

> ⚠️ DIVERGED: 2026-04-23부터 수집 목표가 `개별 한시 작품 확보`를 넘어 `한국 고전 문헌/시집 자체의 디지털 보존 + 작품 분리 서비스`로 확장됐다. 따라서 이 문서의 `작품 중심 단층 모델`만으로는 부족하며, 이후 문헌 층과 작품 층을 함께 다루는 이중 모델을 병행한다. 기준 문서는 [2026-04-23-korean-classical-document-work-model.md](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/2026-04-23-korean-classical-document-work-model.md:1) 를 따른다.

핵심 목표:

- 원문과 번역문을 분리 저장
- 소스 사이트 정책과 작품 자산 권리를 분리 저장
- 상업 전환 시 교체가 필요한 번역/주석 자산을 기계적으로 판별

## 2. 산출물

- 소스 정책 초안: [korean-hansi-source-policies.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-source-policies.v1.json:1)
- 작품 스키마 초안: [korean-hansi.schema.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi.schema.v1.json:1)
- 샘플 레코드 출력: [korean-hansi.sample-records.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi.sample-records.v1.json:1)
- 미니 파일럿 입력: [korean-hansi-mini-pilot.input.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mini-pilot.input.v1.json:1)
- 미니 파일럿 출력: [korean-hansi-mini-pilot.records.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mini-pilot.records.v1.json:1)
- 미니 파일럿 URL 목록: [korean-hansi-mini-pilot.source-urls.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mini-pilot.source-urls.tsv:1)
- 미니 파일럿 권리표: [korean-hansi-mini-pilot.rights-sheet.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mini-pilot.rights-sheet.tsv:1)
- 혼합 배치 입력: [korean-hansi-mixed-batch.input.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mixed-batch.input.v1.json:1)
- 혼합 배치 출력: [korean-hansi-mixed-batch.records.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mixed-batch.records.v1.json:1)
- 혼합 배치 URL 목록: [korean-hansi-mixed-batch.source-urls.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mixed-batch.source-urls.tsv:1)
- 혼합 배치 권리표: [korean-hansi-mixed-batch.rights-sheet.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-mixed-batch.rights-sheet.tsv:1)
- 파일럿 50명 URL 시트 JSON: [korean-hansi-pilot-50-url-sheet.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-pilot-50-url-sheet.v1.json:1)
- 파일럿 50명 URL 시트 TSV: [korean-hansi-pilot-50-url-sheet.v1.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-pilot-50-url-sheet.v1.tsv:1)
- 우선 수집 11명 배치 JSON: [korean-hansi-priority-11-batch.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-priority-11-batch.v1.json:1)
- 우선 수집 11명 배치 TSV: [korean-hansi-priority-11-batch.v1.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-priority-11-batch.v1.tsv:1)
- 우선 수집 11명 실행 보드 JSON: [korean-hansi-priority-11-board.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-priority-11-board.v1.json:1)
- 우선 수집 11명 실행 보드 TSV: [korean-hansi-priority-11-board.v1.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-priority-11-board.v1.tsv:1)
- 파이프라인 게이트 문서: [2026-04-20-korean-hansi-pipeline-gates.md](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/2026-04-20-korean-hansi-pipeline-gates.md:1)
- 파이프라인 readiness JSON: [korean-hansi-pipeline-readiness.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-pipeline-readiness.v1.json:1)
- 조사 manifest JSON: [korean-hansi-research-manifest.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-research-manifest.v1.json:1)
- 조사 manifest TSV: [korean-hansi-research-manifest.v1.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-research-manifest.v1.tsv:1)
- 원칙/설계 문서: [2026-04-20-korean-hansi-principles-schema-pilot.md](/Users/jinwoo/Documents/development/hanshinaru/docs/research/2026-04-20-korean-hansi-principles-schema-pilot.md:1)
- 파일럿 작가 후보: [2026-04-20-korean-hansi-pilot-authors.md](/Users/jinwoo/Documents/development/hanshinaru/docs/research/2026-04-20-korean-hansi-pilot-authors.md:1)

## 3. 모델 원칙

1. 소스 사이트 정책은 `source policy`로 관리한다.
2. 작품 내부 자산 권리는 `rights`로 관리한다.
3. 기존 번역/주석은 `legacyAssets`, 자체 번역/주석은 `ownedAssets`로 분리한다.
4. `commercialTransition` 블록에서 상업 전환 가능 여부를 즉시 판별한다.

## 4. 필수 블록

- `poemId`, `canonicalId`
- `title`, `author`, `era`, `genre`
- `sourceWork`
- `text`
- `legacyAssets`
- `ownedAssets`
- `rights`
- `commercialTransition`

## 5. 권리 판단 기본값

- 원문: 공공영역으로 보되, 디지털 텍스트/이미지의 재배포는 소스 정책을 따른다.
- 기존 번역: 기본적으로 `commercial not safe` 취급.
- 자체 번역: `owned` 자산으로 관리.
- 권리 미확인 자산: `unknown`으로 기록하고 공개 기본값은 보수적으로 잡는다.

## 6. 현재 결정

- Hanshinaru는 당분간 비상업 서비스 기준으로 운영한다.
- 단, **상업 전환을 전제로 한 권리 마킹을 지금부터 강제**한다.
- 따라서 `legacyTranslation.exists = true`면 기본적으로 `mustReplaceBeforeCommercial = true`를 권장 기본값으로 둔다.

## 7. 검증 결과

### 미니 파일럿 5건

- 결과: 5건 모두 구조 검증 통과
- 상업 판정: 5건 모두 `commercial ready`
- 용도: 공개 권리 상태가 비교적 단순한 위키문헌 기반 안전 케이스 검증

### 혼합 배치 10건

- 결과: 10건 모두 구조 검증 통과
- 상업 판정:
  - `commercial ready`: 4건
  - `blocked`: 6건
- 차단 사유 분포:
  - `commercial_permission_required`: 4건
  - `must_replace_before_commercial`: 2건

즉, 현재 파이프라인은 최소한 아래 4가지 상태를 구분할 수 있다.

1. 바로 상업 사용 가능한 안전 케이스
2. 원문 소스 허가가 필요한 케이스
3. 기존 번역을 자체 번역으로 교체해야 하는 케이스
4. 기존 번역에 대해 상업 허가를 별도로 받아야 하는 케이스

### 파일럿 50명 1차 URL 시트

- 결과: 파일럿 50명 전원에 대해 1차 수집 URL 시트 생성
- 시트 내용:
  - KORCIS 검색 URL
  - 한국민족문화대백과 키워드 URL
  - 로컬 타임라인 기준 대표작 힌트
  - 우선 착수 방식 메모
- 집계:
  - `local fullPoems` 보유 작가: 11명
  - `otherWorks` 힌트만 있는 작가: 39명

다만 이 11명은 한국 시문 전체 기준의 `local fullPoems` 보유 작가군이므로,  
한국 **한시** 프로젝트의 실제 우선 착수 배치와는 일치하지 않는다.

### 한국 한시 우선 수집 11명 배치

- 결과: 한국 한시 문집 수집에 바로 들어갈 수 있는 11명 우선 배치 생성
- 선정 원칙:
  - 향가/가사/시조 중심 항목은 제외
  - 문집/전집/시고가 명시된 작가 우선
  - 고려-조선전기-조선후기의 핵심 작가를 고르게 배치

우선 배치 11명:

1. 최치원
2. 정지상
3. 이규보
4. 이색
5. 이제현
6. 정도전
7. 김종직
8. 이숭인
9. 허난설헌
10. 김정희
11. 황현

따라서 한국 한시 수집의 실제 시작점은 `local fullPoems` 11명이 아니라,  
위 `priority-11` 배치를 기준으로 KORCIS/EncyKorea/문집 단위 수집을 진행하는 것이 맞다.

### 우선 수집 11명 실행 보드

- 결과: 우선 배치 11명을 실제 작업 보드 형태로 변환
- 보드 필드:
  - `status`
  - `stage`
  - `progressChecklist`
  - `collectionWork`
  - `poemCandidateWork`
  - `rightsWork`
  - `nextAction`
  - `blockers`
- 운영 흐름:
  - `priority-11 batch`는 시작 대상 선정용
  - `priority-11 board`는 실제 진행 상태 관리용
