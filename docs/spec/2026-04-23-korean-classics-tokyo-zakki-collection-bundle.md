---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 고전 東京雜記 전권 묶음
date: 2026-04-23
author: 태훈
---

# 목적

- `東京雜記` 1~3권 수확 결과를 하나의 전권 묶음으로 통합한다.
- 문헌 층과 작품 층을 함께 보존해, 연구용 원문과 서비스용 작품 데이터를 동시에 다룰 수 있게 한다.

# 기준 산출물

- 전권 묶음: [korean-classics-tokyo-zakki-collection-bundle.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-tokyo-zakki-collection-bundle.v1.json:1)
- 권별 문헌/작품 수확:
  - [卷一 poem harvest](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/2026-04-23-korean-hansi-tokyo-zakki-vol1-poem-harvest.md:1)
  - [卷二 poem harvest](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/2026-04-23-korean-hansi-tokyo-zakki-vol2-poem-harvest.md:1)
  - [卷三 poem harvest](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/2026-04-23-korean-hansi-tokyo-zakki-vol3-poem-harvest.md:1)

# 현재 통합 수량

- 권차 수: `3권`
- 문헌 section 수: `50`
- 문헌 항목 수: `913`
- 시문 후보 수: `90`
- 설명문/기문 맥락 수: `8`
- 원표기 기준 저자 라벨 수: `67`
- 보수 정리 기준 저자 수: `48`

# 권차별 요약

- `卷一`
  - 문헌 section `26`
  - 문헌 항목 `323`
  - 시문 후보 `28`
  - 설명문 `5`
- `卷二`
  - 문헌 section `11`
  - 문헌 항목 `379`
  - 시문 후보 `21`
  - 설명문 `1`
- `卷三`
  - 문헌 section `13`
  - 문헌 항목 `211`
  - 시문 후보 `41`
  - 설명문 `2`

# 전권 기준 상위 시인 표기

## 원표기 기준

- `魚世謙` `12`
- `金克己` `7`
- `梅溪曹偉` `3`
- `朴元亨` `2`
- `東岳李安訥` `2`
- `金時習` `2`
- `柳西厓` `2`

## 보수 정리 기준

- `魚世謙` `12`
- `金克己` `10`
- `徐居正` `10`
- `金宗直` `4`
- `崔致遠` `4`
- `李安訥` `3`
- `曹偉` `3`
- `朴元亨` `2`
- `金時習` `2`
- `柳成龍` `2`

# 운영 판단

- `東京雜記`는 전권 기준으로도 `raw-first harvest`가 충분히 통한다.
- 권마다 구조가 다르므로
  - `권차별 문헌 보존`
  - `권차별 작품 분리`
  - `전권 묶음 통합`
  의 3단 구조가 적절하다.
- 저자 표기는 호, 칭호, 부제, 설명이 섞여 있는 경우가 많아 `원표기`와 `보수 정리표기`를 함께 유지해야 한다.

# 다음 단계

1. 남은 본문 복원 대기열 `3건`을 검수한다.
2. `七詠` 안의 하위 곡명/표제를 더 잘 분리할지 결정한다.
3. 그다음 `정식 작품 후보`와 `문헌 맥락 자산`을 분리해 승격한다.
4. 같은 방식으로 `東文選` 등 다른 고전 문헌에도 전권 수확 파이프라인을 확장한다.
