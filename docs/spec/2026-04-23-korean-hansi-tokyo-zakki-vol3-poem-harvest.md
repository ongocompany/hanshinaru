---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 한시 東京雜記 卷三 poem harvest
date: 2026-04-23
author: 태훈
---

# 목적

- `東京雜記 卷三`를 `권차 단위 시문 수확` 대상으로 처리한다.
- 둘째 권에서 확인한 `raw-first harvest` 방식을 셋째 권에도 그대로 적용해 대량 수집 가능성을 검증한다.

# 기준 원문

- 공개 원문: `東京雜記 卷三`
- source policy: `SRC-WIKISOURCE-TEXT`
- raw cache: [tokyo-zakki-3.raw.txt](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-tokyo-zakki-vol3-raw/tokyo-zakki-3.raw.txt:1)
- harvest manifest: [korean-hansi-tokyo-zakki-vol3-poem-harvest.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-tokyo-zakki-vol3-poem-harvest.v1.json:1)

# 이번 harvest 결과

- 총 `43건`의 시문 블록을 구조화했다.
- attached context는 `0건`이다.
- 시문이 확인된 section:
  - `題詠`: 41건
  - `異聞`: 2건

# 운영 판단

- `東京雜記 卷三`은 둘째 권보다도 `시문 중심 권차`에 가깝다.
- 따라서 `東京雜記`는 `권차별 편차가 큰 문헌`으로 보고,
  - 어떤 권은 지리지/사찰 설명 산문이 많고
  - 어떤 권은 시문이 대량으로 실린다
  는 점을 전제로 수집해야 한다.
- 이 결과는 `표제 1건 추적`보다 `권차 전수 수확`이 훨씬 효율적이라는 판단을 강하게 지지한다.

# 바로 활용 가능한 의미

- 둘째 권 `21건`에 이어 셋째 권 `43건`이 추가되면서,
  `東京雜記` 계열만으로도 짧은 시간 안에 상당한 수의 시문 후보를 확보할 수 있다는 것이 확인됐다.
- 특히 셋째 권은 개별 시인들의 `題詠`이 다수 모여 있어,
  이후 정식 작품 승격과 시인별 묶음 정리에 유리하다.

# 다음 단계

1. `東京雜記` 셋째 권 `43건`의 시인별 중복/이칭 정리를 한다.
2. 둘째 권 `21건`과 합쳐 `東京雜記` 전체 수집 후보 묶음을 만든다.
3. 가능하면 첫째 권도 같은 방식으로 확보해 `東京雜記` 전권 수확 여부를 판단한다.
4. 그 뒤 `東文選` 권차 수확으로 같은 방식을 확장한다.
