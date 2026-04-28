---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 정지상 tranche 1 생성과 wave1 진행도 반영
date: 2026-04-21
author: 태훈
---

# 이번 세션에서 완료한 작업

- `東文選 卷九`, `卷十二`, `卷十九` 공개 원문을 기준으로 정지상 direct-text tranche 1을 생성했다.
- 새 스크립트 `scripts/build_korean_hansi_jeong_jisang_tranche1.js`를 추가했다.
- 아래 산출물을 생성했다.
  - `docs/spec/2026-04-21-korean-hansi-jeong-jisang-tranche1.md`
  - `docs/spec/korean-hansi-jeong-jisang-tranche1-raw/` raw 캐시 3개
  - `docs/spec/korean-hansi-jeong-jisang-tranche1.input.v1.json`
  - `docs/spec/korean-hansi-jeong-jisang-tranche1.records.v1.json`
  - `docs/spec/korean-hansi-jeong-jisang-tranche1.report.v1.json`
  - `docs/spec/korean-hansi-jeong-jisang-tranche1.source-urls.tsv`
  - `docs/spec/korean-hansi-jeong-jisang-tranche1.rights-sheet.tsv`
- 생성된 정지상 tranche 1은 총 `13편`이다.
- `apply_korean_hansi_source_policy.js`, `validate_korean_hansi_records.js`, `build_korean_hansi_rights_sheet.js`까지 모두 PASS했다.
- `scripts/build_korean_hansi_famous_authors_wave1_batch.js`를 확장해서 tranche report들을 읽어 실제 direct-text 진행도를 집계하도록 바꿨다.
- 그 결과 `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`과 `.tsv`에 현재 wave1 direct-text 누적 `45편`이 반영됐다.
  - 최치원 `32편`
  - 정지상 `13편`

# 어디서 멈췄는지

- 정지상 tranche 1까지는 끝났고, 다음 자연스러운 단계는 미해결 표제 3건을 메우는 것이다.
  - `鄕宴致語`
  - `栢律寺`
  - `西樓`
- 현재 확인상 `卷十九`의 `西樓觀雪`, `西樓晚望`는 저자 블록상 정지상으로 채택하지 않았다.
- 따라서 다음은 `東文選` 추가 권차 탐색 또는 `동경잡기(東京雜記)` 축으로 넘어가야 한다.

# 핵심 판단과 이유

- 이번에도 exact-title 강박보다 실제 direct-text 확보량을 우선했다.
- 정지상은 개별 작품 페이지보다 `東文選` 권차본을 author block 단위로 읽는 쪽이 안정적이었다.
- `西樓`처럼 제목이 비슷하다고 바로 board target으로 넣지 않고, 저자 블록 확인 후 제외했다.
- wave1 운영 문서는 pilot 상태만 보면 실제 진척을 과소평가하므로, tranche report 기반 집계를 자동 반영하도록 바꿨다.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-21-jeong-jisang-tranche1-and-wave1-progress.md`
- `docs/spec/2026-04-21-korean-hansi-jeong-jisang-tranche1.md`
- `docs/spec/korean-hansi-jeong-jisang-tranche1-raw/volume-9.raw.txt`
- `docs/spec/korean-hansi-jeong-jisang-tranche1-raw/volume-12.raw.txt`
- `docs/spec/korean-hansi-jeong-jisang-tranche1-raw/volume-19.raw.txt`
- `docs/spec/korean-hansi-jeong-jisang-tranche1.input.v1.json`
- `docs/spec/korean-hansi-jeong-jisang-tranche1.records.v1.json`
- `docs/spec/korean-hansi-jeong-jisang-tranche1.report.v1.json`
- `docs/spec/korean-hansi-jeong-jisang-tranche1.source-urls.tsv`
- `docs/spec/korean-hansi-jeong-jisang-tranche1.rights-sheet.tsv`
- `scripts/build_korean_hansi_jeong_jisang_tranche1.js`

## 수정

- `package.json`
- `scripts/build_korean_hansi_famous_authors_wave1_batch.js`
- `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`
- `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.tsv`

## 참조

- `docs/handoff/2026-04-21-famous-authors-wave1-and-choe-tranche1.md`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.report.v1.json`
- `docs/spec/korean-hansi-priority-11-board.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
- `https://zh.wikisource.org/wiki/東文選/卷九`
- `https://zh.wikisource.org/wiki/東文選/卷十二`
- `https://zh.wikisource.org/wiki/東文選/卷十九`

# 원래 계획과 달라진 점

- 원래는 최치원 tranche 2를 먼저 보려 했지만, `孤雲集/卷二·卷三`가 곧바로 같은 패턴으로 확장되지 않아 정지상 쪽으로 피벗했다.
- Kiwix로 바로 대체할 수 있을 거라고 잠깐 가정했지만, 현재 운영 문서 기준 Kiwix는 Wikipedia 중심이라 이번에는 raw 캐시를 직접 채워서 진행했다.

# 다음 세션의 첫 행동

1. `東文選` 추가 권차에서 `鄭知常` author block이 더 있는지 먼저 확인한다.
2. `동경잡기(東京雜記)` 공개 원문 또는 이미지/PDF locator가 열리는지 확인한다.
3. `鄕宴致語`, `栢律寺`, `西樓` 중 하나라도 direct-text로 잡히면 정지상 tranche 2로 이어서 묶는다.

# 다음 세션이 피해야 할 함정

- `西樓觀雪`, `西樓晚望`를 board target `西樓`로 성급하게 동일시하지 말 것
- Python 네트워크 호출은 이 환경에서 흔들릴 수 있으니 raw 캐시를 먼저 만드는 현재 방식 유지
- 저장소 전체 dirty tree가 크므로 커밋은 반드시 경로 제한 add로 할 것
- wave1 문서를 pilot 숫자만 보고 해석하지 말 것
  - 현재 실제 direct-text 누적은 이미 `45편`이다
