---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 한시 유명 시인 대량 수집 wave 1
date: 2026-04-21
author: 태훈
---

# 왜 이 배치를 따로 만들었나

- 기존 `text-collection pilot`은 파이프라인 검증 목적에서는 이미 충분하다.
- 이제는 `정확한 대표작 1수씩 맞추기`보다 `유명 시인부터 실제 수집량을 늘리는 것`이 우선이다.
- 따라서 wave 1은 **유명 시인 문집/공개 원문 기준 대량 수집 실전 배치**로 운영한다.

# 운영 원칙

1. exact-title 100% 일치를 시작 조건으로 두지 않는다.
2. 작가 단위로 들어가서 문집 슬라이스를 먼저 넓게 확보한다.
3. 직접 텍스트가 열리면 먼저 수집하고, 거기서 막히면 OCR을 바로 붙인다.
4. 권리 검토는 작품 1건마다 멈추지 않고 author batch 단위로 후처리한다.
5. 이번 wave 1의 목표는 “잘 설계된 테스트”가 아니라 “실제로 많이 모으는 것”이다.

# wave 1 범위

- 최치원
- 정지상
- 이규보
- 이색
- 이제현
- 정도전
- 김종직
- 허난설헌

초기 목표량 합계: `170건`

# 실행 방식

## 직접 텍스트 우선

- Wikisource 개별 작품/문집 페이지
- 공개 고전 원문 페이지
- 공개 문집 TOC/원문 페이지
- ITKC 원문 페이지

## 메타데이터 추적

- KORCIS
- EncyKorea
- 문집 판본/권차 메타데이터

## OCR 전환

- direct-text 수집량이 author batch 기준 임계치 아래로 막히면 즉시 OCR lane 병행
- OCR은 보조 트랙이며, 원문 이미지/PDF 기반 복원용으로만 쓴다
- bootstrap 데이터는 AI Hub 603을 기본 후보로 둔다

# 생성 산출물

- [korean-hansi-famous-authors-wave1-batch.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json:1)
- [korean-hansi-famous-authors-wave1-batch.v1.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-famous-authors-wave1-batch.v1.tsv:1)

# 이번 결정으로 동결하는 것

- `text-collection pilot`은 더 이상 exact-title 맞춤 실험의 주력 트랙으로 확장하지 않는다.
- 그 파일럿은 현재 공개 원문 접근성 확인용 기준점으로만 유지한다.
- 이후 주력은 `유명 시인 wave 1 대량 수집`이다.
