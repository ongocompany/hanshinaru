---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 고전 동경잡기(東京雜記) 시인별 보기
date: 2026-04-24
author: 태훈
---

# 목적

- `동경잡기(東京雜記)` 전권 수집 결과를 시인 중심으로 재배열한다.
- 정리된 저자 기준으로 작품 수, 권차 분포, 원표기 분포를 한눈에 확인할 수 있게 한다.

# 표기 원칙

- 문헌명은 `동경잡기(東京雜記)`로 쓴다.
- 영문 로마자 표기는 `Donggyeong Japgi`다.
- `donggyeong-japgi`는 내부 파일명/스크립트용 canonical slug이며, 화면 표기와 문서 설명에서는 `Donggyeong Japgi`를 쓴다.
- 여기서 `東京`은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.

# 기준 산출물

- 전권 문헌/작품 묶음: [korean-classics-donggyeong-japgi-collection-bundle.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json:1)
- 시인별 보기: [korean-classics-donggyeong-japgi-author-view.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-donggyeong-japgi-author-view.v1.json:1)

# 이번 정리의 역할

- `원표기 저자`
  - 예: `梅溪曹偉`, `佔畢齋金宗直`, `府尹全湜`
- `정리 저자`
  - 예: `曹偉`, `金宗直`, `全湜`

이 두 층을 함께 유지한 채, 실제 수집 후보를 `정리 저자` 기준으로 다시 묶는다.

# 현재 요약

- 전체 작품 후보: `94`
- 정리 저자 수: `48명`
- 상위 시인:
  - `魚世謙` `12`
  - `金克己` `10`
  - `徐居正` `10`
  - `金宗直` `8`
  - `崔致遠` `4`

# 기대 효과

- 어떤 시인이 많이 모였는지 바로 파악할 수 있다.
- 같은 시인이 호·관직·부제로 갈라져 보이는 문제를 줄일 수 있다.
- `七詠`의 하위 곡명 7편을 `金宗直` 아래로 묶어, 연작형 작품이 저자 미상이나 산문으로 흩어지는 문제를 줄인다.
- 다음 단계의 `정식 작품 승격`, `번역 우선순위`, `시인별 소개 페이지` 준비가 쉬워진다.

# 다음 단계

1. 상위 시인부터 중복/이칭 정리를 더 강화한다.
2. 시인별 보기에서 각 시인의 작품 후보를 `정식 작품 후보`와 `추가 검수 필요 후보`로 나눈다.
3. `동경잡기(東京雜記)` 외 다른 문헌에도 같은 시인별 보기 계층을 확장한다.
