---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: source-audit
status: active
title: 당 이전 중국 한시 고확보성 소스 감사
date: 2026-04-30
author: 지훈
---

# 목적

한시나루의 실제 목표는 `135권 중 몇 권 완료`가 아니라, 사이트에 실을 수 있는 시·문집·시인 정보를 신뢰 가능한 출처와 함께 확보하는 것이다.

따라서 이번 감사는 `先秦漢魏晉南北朝詩` 권차 추출 가능성보다, 확보 가능성이 높은 핵심 소스와 anchor author를 먼저 본다.

# 우선 tranche

| family | 우선 대상 | 왜 먼저 하는가 | 수집 단위 |
|---|---|---|---|
| 詩經 | 關雎, 蒹葭, 桃夭, 采薇 등 | 너무 유명하고 305편 구조가 분명함 | classic family + poem |
| 楚辭 | 離騷, 九歌, 天問, 九章 등 | 屈原 중심의 필수 고전 family | classic family + work/section |
| 陶淵明 | 陶淵明集, 飲酒二十首, 歸園田居 | 晉 시의 anchor author | author + collection + poem |

# 확인한 외부 후보

| 소스 | 확인 내용 | 용도 |
|---|---|---|
| zh Wikisource `詩經` | `詩經/關雎` 같은 개별 작품 페이지가 존재 | 원문 witness / 링크 구조 |
| zh Wikisource `楚辭` | 17권 목차가 존재 | 원문 witness / 권차 구조 |
| zh Wikisource `陶淵明集 (四庫全書本)` | 8권 권차 페이지와 개별 유명작 페이지가 존재 | author collection witness |
| Chinese Text Project `陶淵明集` | OCR 기반 collection text와 author data가 존재 | 대조/보조 witness |
| Google Books / WorldCat / CiNii | `先秦漢魏晉南北朝詩` 서지와 135권 구조 확인 | 기준 총목록 / 서지 |

# 이번 배치 산출물

- target manifest: `docs/spec/cn-pre-tang-high-yield-source-targets.v1.json`
- raw dump pages:
  - `docs/spec/cn-pre-tang-high-yield-source-pages.classic-index.dump.raw.v1.json`
  - `docs/spec/cn-pre-tang-high-yield-source-pages.classic-famous.dump.raw.v1.json`
  - `docs/spec/cn-pre-tang-high-yield-source-pages.author-index.dump.raw.v1.json`
  - `docs/spec/cn-pre-tang-high-yield-source-pages.author-collection-index.dump.raw.v1.json`
  - `docs/spec/cn-pre-tang-high-yield-source-pages.author-collection-volume.dump.raw.v1.json`
  - `docs/spec/cn-pre-tang-high-yield-source-pages.author-famous.dump.raw.v1.json`

# dump 확보 결과

| 그룹 | 후보 | fetched | missing | 판단 |
|---|---:|---:|---:|---|
| 詩經/楚辭 index | 2 | 2 | 0 | 둘 다 바로 사용 가능 |
| 詩經/楚辭 유명작 | 17 | 15 | 2 | 詩經 유명작은 안정적, 楚辭 일부는 title variant 필요 |
| 陶淵明 author index | 1 | 0 | 1 | `作者:` title namespace 표기 보정 필요 |
| 陶淵明集 index | 1 | 1 | 0 | 사용 가능 |
| 陶淵明集 8권 | 8 | 8 | 0 | 다음 record화 1순위 |
| 陶淵明 유명작 | 6 | 6 | 0 | 바로 record화 가능 |

missing:

- `楚辭/天問`
- `楚辭/離騷`
- `作者:陶淵明`

available:

- `詩經`
- `楚辭`
- `詩經/關雎`, `詩經/桃夭`, `詩經/氓`, `詩經/黍離`, `詩經/碩鼠`, `詩經/無衣`, `詩經/蒹葭`, `詩經/七月`, `詩經/采薇`, `詩經/蓼莪`
- `楚辭/九章`, `楚辭/遠遊`, `楚辭/漁父`, `楚辭/卜居`, `楚辭/九歌`
- `陶淵明集 (四庫全書本)`
- `陶淵明集 (四庫全書本)/卷1` ... `卷8`
- `飲酒二十首`, `歸園田居`, `歸園田居五首`, `桃花源記`, `歸去來辭並序`, `五柳先生傳`

# 판단

- `詩經`, `楚辭`는 `先秦漢魏晉南北朝詩` 본체에서 제외했던 것이 맞지만, 한시나루 수집 대상에서는 제외하면 안 된다.
- 이 둘은 `classic-family`로 따로 관리하고, 시인 없는 anonymous 고전으로 처리한다.
- 陶淵明은 권차 단위와 개별 작품 단위가 모두 확보 가능하므로, 다음 실제 record화 1순위로 둔다.

# 다음 작업

1. 이번 raw dump 결과에서 fetched/missing을 확인한다.
2. `陶淵明集 (四庫全書本)` 8권은 권차 구조가 안정적이므로 먼저 record화한다.
3. `詩經`은 전체 305편 자동 목록을 root page에서 생성하는 별도 스크립트를 만든다.
4. `楚辭`는 root page의 17권 목차에서 정확한 title variant를 생성한다.
