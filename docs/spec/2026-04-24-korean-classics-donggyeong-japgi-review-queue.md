---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 고전 동경잡기(東京雜記) 검수 대기열
date: 2026-04-24
author: 태훈
---

# 목적

- `동경잡기(東京雜記)` 전권 수집 결과 중 추가 검수가 필요한 항목만 따로 뽑는다.
- 다음 단계의 본문 복원과 저자 정리를 빠르게 진행할 수 있게 한다.

# 표기 원칙

- 문헌명은 `동경잡기(東京雜記)`로 쓴다.
- 영문 로마자 표기는 `Donggyeong Japgi`다.
- `donggyeong-japgi`는 내부 파일명/스크립트용 canonical slug이며, 화면 표기와 문서 설명에서는 `Donggyeong Japgi`를 쓴다.
- 여기서 `東京`은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.

# 기준 산출물

- 전권 문헌/작품 묶음: [korean-classics-donggyeong-japgi-collection-bundle.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json:1)
- 검수 대기열: [korean-classics-donggyeong-japgi-review-queue.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-donggyeong-japgi-review-queue.v1.json:1)

# 현재 요약

- 본문 복원 추가 검수: `0건`
- 저자 표기 낮은 신뢰: `0건`
- 비인명 표기 유력 대기열: `0건`

# 이번 대기열의 두 갈래

## 본문 복원 추가 검수

- 현재 남은 항목은 없다.
- 직전 대기열에 남아 있던 `七詠佔畢齋金宗直詩`는 7개 하위 곡명으로 분리했다.
- 직전 대기열에 남아 있던 `悅朴嶺` 관련 `金克己詩`, `李石亨詩`는 `新增東國輿地勝覽 卷021` 대조로 행 분할을 확정했다.
- 이후 새 문헌을 수집할 때도 행 분할이 불안정하거나, 다음 항목이 뒤에 붙은 흔적이 있거나, 원문 손상 때문에 형식 판정이 흐린 작품은 이 대기열로 보낸다.

## 저자 표기 정리

- 사람 이름인지
- 작품군/놀이명/부제인지
- 호·관직·설명문이 섞인 표기인지

를 더 가려야 하는 항목들
- `月顚`, `大面`, `束毒`, `狻猊`는 `崔致遠`의 鄕樂 五技 연작 표제로 정리했다.
- `會蘇曲`, `憂息曲`, `鵄述嶺`, `怛忉`, `陽山`, `碓樂`, `黃昌郞`은 `金宗直`의 `七詠` 연작 표제로 정리했다.
- `雜詠兪好仁`은 표제 `雜詠`과 저자 `兪好仁`으로 분리했다.
- `都波歌`는 독립 시문 후보가 아니라 설명문/가요 맥락 자산으로 이동했다.

# 운영 판단

- 지금은 전권 수집량을 더 늘리는 것과 별도로, `검수 대기열`을 작게 유지하는 것이 중요하다.
- 따라서 새 문헌을 수집할 때도 매번 이 대기열을 같이 생성해, 수집과 검수를 분리 운영하는 편이 맞다.
