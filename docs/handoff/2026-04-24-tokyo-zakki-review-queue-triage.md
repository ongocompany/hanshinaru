---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 東京雜記 검수 대기열 축소와 저자 표기 정리
date: 2026-04-24
author: 태훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `f53598f [지훈][Feat] Add Tokyo Zakki document-work pipeline`와 직전 핸드오프를 확인했다.
- `korean-classics-tokyo-zakki-review-queue.v1.json` 기준 검수 대기열을 이어받았다.
- harvest 단계에서 두 가지 본문 복원 오류를 줄였다.
  - 본문 속 `...歌...`를 다음 작품 시작으로 오인하던 절단을 완화했다.
  - `[新增]` 뒤 설명문이 시 본문에 붙는 문제를 제거했다.
- `都波歌`는 독립 시문 후보가 아니라 설명문/가요 맥락 자산으로 이동했다.
- 저자 표기 낮은 신뢰 대기열을 `9건 -> 0건`으로 정리했다.
  - `月顚`, `大面`, `束毒`, `狻猊` -> `崔致遠`의 鄕樂 五技 연작 표제
  - `又祓禊` -> `金克己`의 兄山浦 연속 표제
  - `怛忉`, `陽山` -> `金宗直`의 `七詠` 연작 표제
  - `雜詠兪好仁` -> 표제 `雜詠`, 저자 `兪好仁`
- 전권 산출물을 순서대로 재생성했다.
  - `卷一` harvest
  - `卷二` harvest
  - `卷三` harvest
  - 전권 bundle
  - 시인별 보기
  - review queue

# 현재 최신 수량

- 문헌 section: `50`
- 문헌 항목: `913`
- 시문 후보: `90`
- 설명문/기문 맥락: `8`
- 정리 저자: `48명`
- review queue:
  - 본문 복원 추가 검수 `3건`
  - 저자 표기 낮은 신뢰 `0건`

# 어디서 멈췄는지

- 남은 본문 복원 대기열은 3건이다.
  - `KHS-TZ2-H-0014` `悅朴嶺` `金克己詩`
  - `KHS-TZ2-H-0016` `悅朴嶺` `李石亨詩`
  - `KHS-TZ3-H-0038` `七詠佔畢齋金宗直詩`
- 이 3건은 단순 스크립트 규칙만으로 확정하기보다 원문 대조나 `七詠` 하위 표제 분리 방침이 필요하다.

# 핵심 판단과 이유

- `都波歌`는 현재 추출된 본문이 노래 전문이 아니라 `唱歌云...者蓋言...` 형식의 설명문에 가깝다.
  - 그래서 시문 후보에서 제외하고 문맥 자산으로 보존했다.
- `月顚` 등 鄕樂 五技 라벨은 사람 이름이 아니라 작품/놀이 표제다.
  - 직전 문맥에 `崔文昌致遠`이 명시되어 있어 `崔致遠` 연작 표제로 정리했다.
- `怛忉`, `陽山`은 `七詠佔畢齋金宗直詩` 뒤에 이어진 곡명이라 `金宗直` 쪽으로 귀속했다.
- `七詠`은 아직 하위 작품 전체 분리 구조가 충분하지 않다.
  - 현재는 일부 곡명만 별도 poem block으로 잡혀 있으므로 다음 세션에서 모델링 결정을 해야 한다.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-24-tokyo-zakki-review-queue-triage.md`

## 수정

- `scripts/build_korean_hansi_tokyo_zakki_volume2_harvest.js`
- `scripts/build_korean_classics_tokyo_zakki_collection_bundle.js`
- `docs/spec/2026-04-23-korean-classics-tokyo-zakki-collection-bundle.md`
- `docs/spec/2026-04-24-korean-classics-tokyo-zakki-author-view.md`
- `docs/spec/2026-04-24-korean-classics-tokyo-zakki-review-queue.md`
- `docs/spec/korean-hansi-tokyo-zakki-vol1-poem-harvest.v1.json`
- `docs/spec/korean-hansi-tokyo-zakki-vol3-poem-harvest.v1.json`
- `docs/spec/korean-classics-tokyo-zakki-collection-bundle.v1.json`
- `docs/spec/korean-classics-tokyo-zakki-author-view.v1.json`
- `docs/spec/korean-classics-tokyo-zakki-review-queue.v1.json`

# 원래 계획과 달라진 점

- 직전 핸드오프의 최신 기준은 `91 시문 / 7 문맥 / 정리 저자 55명 / 검수 5+9건`이었다.
- 이번 검수 뒤 기준은 `90 시문 / 8 문맥 / 정리 저자 48명 / 검수 3+0건`이다.
- 숫자가 줄어든 주된 이유는 `都波歌`를 문맥 자산으로 옮기고, 비인명 라벨을 저자 표기로 세지 않게 정리했기 때문이다.

# 다음 세션의 첫 행동

1. `KHS-TZ3-H-0038`의 `七詠`을 먼저 검토한다.
2. `七詠` 하위 곡명 전체를 별도 작품으로 분리할지, 하나의 연작 묶음으로 둘지 결정한다.
3. 그다음 `悅朴嶺`의 `金克己詩`, `李石亨詩` 행 분할을 원문 대조로 처리한다.

# 다음 세션이 피해야 할 함정

- 이전 핸드오프의 `91/7/55명/5+9건` 숫자를 최신으로 착각하지 말 것.
- `歌` 표기를 독립 작품으로 바로 확정하지 말 것.
- `七詠` 안의 곡명 표제를 사람 이름으로 세지 말 것.
- 권차 harvest, 전권 bundle, author view, review queue는 순서대로 재생성할 것.
