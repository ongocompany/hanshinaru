---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 고전 東京雜記 검수 대기열
date: 2026-04-24
author: 태훈
---

# 목적

- `東京雜記` 전권 수집 결과 중 추가 검수가 필요한 항목만 따로 뽑는다.
- 다음 단계의 본문 복원과 저자 정리를 빠르게 진행할 수 있게 한다.

# 기준 산출물

- 전권 문헌/작품 묶음: [korean-classics-tokyo-zakki-collection-bundle.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-tokyo-zakki-collection-bundle.v1.json:1)
- 검수 대기열: [korean-classics-tokyo-zakki-review-queue.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-classics-tokyo-zakki-review-queue.v1.json:1)

# 현재 요약

- 본문 복원 추가 검수: `3건`
- 저자 표기 낮은 신뢰: `0건`
- 비인명 표기 유력 대기열: `0건`

# 이번 대기열의 두 갈래

## 본문 복원 추가 검수

- 행 분할이 불안정하거나
- 다음 항목이 뒤에 붙은 흔적이 있거나
- 원문 손상 때문에 형식 판정이 흐린 작품들
- 현재 남은 항목은 `悅朴嶺` 관련 `金克己詩`, `李石亨詩`, 그리고 `七詠佔畢齋金宗直詩`다.

## 저자 표기 정리

- 사람 이름인지
- 작품군/놀이명/부제인지
- 호·관직·설명문이 섞인 표기인지

를 더 가려야 하는 항목들
- `月顚`, `大面`, `束毒`, `狻猊`는 `崔致遠`의 鄕樂 五技 연작 표제로 정리했다.
- `怛忉`, `陽山`은 `金宗直`의 `七詠` 연작 표제로 정리했다.
- `雜詠兪好仁`은 표제 `雜詠`과 저자 `兪好仁`으로 분리했다.
- `都波歌`는 독립 시문 후보가 아니라 설명문/가요 맥락 자산으로 이동했다.

# 운영 판단

- 지금은 전권 수집량을 더 늘리는 것과 별도로, `검수 대기열`을 작게 유지하는 것이 중요하다.
- 따라서 새 문헌을 수집할 때도 매번 이 대기열을 같이 생성해, 수집과 검수를 분리 운영하는 편이 맞다.
