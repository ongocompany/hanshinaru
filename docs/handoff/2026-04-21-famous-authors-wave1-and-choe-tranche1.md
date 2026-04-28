---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 유명 시인 wave 1 전환과 최치원 tranche 1 생성
date: 2026-04-21
author: 태훈
---

# 이번 세션에서 완료한 작업

- 한국 한시 작업 방향을 `exact-title 파일럿 반복`에서 `유명 시인 대량 수집 실전`으로 전환했다.
- 유명 시인 8명 대상 wave 1 실행 배치를 새로 만들었다.
  - `최치원, 정지상, 이규보, 이색, 이제현, 정도전, 김종직, 허난설헌`
  - 초기 목표량 합계 `170건`
- 아래 스크립트와 산출물을 추가했다.
  - `scripts/build_korean_hansi_famous_authors_wave1_batch.js`
  - `docs/spec/2026-04-21-korean-hansi-famous-authors-wave1.md`
  - `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`
  - `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.tsv`
- 기존 `text-collection pilot`도 그대로 두지 않고, 보드 정합성을 높이기 위해 공개 원문 기준으로 일부 교체했다.
  - 최치원 보드 커버리지 `5/5`
  - 정지상 보드 커버리지 `2/5`
  - 허난설헌 보드 커버리지 `4/5`
  - 현재 pilot 기준 `14 commercial-ready / 1 blocked`
- wave 1 첫 실전 수집으로 최치원 tranche 1을 열었다.
  - 기준본: `孤雲集/卷一`
  - 결과: `32수` direct-text 확보
  - 검증: `apply-policy -> validate -> rights-sheet`까지 모두 통과
  - 결과 파일:
    - `scripts/build_korean_hansi_choe_chiwon_tranche1.js`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1-raw/gounjip-volume-1.raw.txt`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1.input.v1.json`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1.records.v1.json`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1.report.v1.json`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1.source-urls.tsv`
    - `docs/spec/korean-hansi-choe-chiwon-tranche1.rights-sheet.tsv`

# 어디서 멈췄는지

- 대량 수집 방향 전환과 최치원 tranche 1 생성까지는 끝났다.
- 아직 다음 단계는 시작하지 않았다.
  - 최치원 tranche 2 (`孤雲集/卷二·卷三`, `桂苑筆耕集`, `東文選`, `三國史記` 확장)
  - 또는 정지상 tranche 1 시작
- wave 1 자체는 배치만 만들어 둔 상태고, 실제 실전 수집은 현재 최치원만 1 tranche 진행됐다.

# 핵심 판단과 이유

- 지금 병목은 “정확한 대표작 1수씩 맞추기”가 아니라 “실제로 많이 모으는 것”이라고 판단했다.
- 그래서 exact-title 100% 일치를 수집 시작 조건에서 내렸다.
- 작가 단위 -> 문집 슬라이스 -> 작품 묶음 순서로 들어가는 것이 맞다고 봤다.
- OCR은 예상 단계에서 오래 논의하지 않고, direct-text가 막히는 시점에 바로 병행하는 운영 규칙으로 바꿨다.
- 최치원의 경우 `孤雲集/卷一`이 생각보다 강력한 공개 원문 소스라서, wave 1 첫 tranche 대상으로 적합하다고 판단했다.
- 중요한 실전 이슈 하나를 확인했다.
  - 위키문헌 개별 작품 페이지 `寓興`은 현재 저자가 `權德輿`로 연결되어 있다.
  - 따라서 개별 작품 페이지를 canonical source로 삼지 않고, `孤雲集/卷一` 권차본을 기준본으로 쓰는 쪽이 안전하다.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-21-famous-authors-wave1-and-choe-tranche1.md`
- `docs/spec/2026-04-21-korean-hansi-famous-authors-wave1.md`
- `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`
- `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.tsv`
- `docs/spec/korean-hansi-choe-chiwon-tranche1-raw/gounjip-volume-1.raw.txt`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.input.v1.json`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.records.v1.json`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.report.v1.json`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.source-urls.tsv`
- `docs/spec/korean-hansi-choe-chiwon-tranche1.rights-sheet.tsv`
- `scripts/build_korean_hansi_famous_authors_wave1_batch.js`
- `scripts/build_korean_hansi_choe_chiwon_tranche1.js`

## 수정

- `package.json`
- `scripts/build_korean_hansi_text_collection_pilot.js`
- `docs/spec/korean-hansi-text-collection-pilot.input.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.records.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.source-urls.tsv`
- `docs/spec/korean-hansi-text-collection-pilot.rights-sheet.tsv`

## 참조

- `docs/spec/korean-hansi-priority-11-board.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
- `docs/spec/korean-hansi-pipeline-readiness.v1.json`
- `docs/research/2026-04-20-korean-hansi-source-map.md`
- `https://zh.wikisource.org/wiki/Author:%E5%B4%94%E8%87%B4%E9%81%A0`
- `https://zh.wikisource.org/wiki/%E5%AD%A4%E9%9B%B2%E9%9B%86/%E5%8D%B7%E4%B8%80`
- `https://zh.wikisource.org/wiki/%E6%A1%82%E8%8B%91%E7%AD%86%E8%80%95%E9%9B%86`
- `https://zh.wikisource.org/wiki/%E4%B8%89%E5%9C%8B%E5%8F%B2%E8%A8%98/%E5%8D%B732`

# 원래 계획과 달라진 점

- 원래는 최신 파일럿을 조금 더 다듬고 exact-title 미해결 4건을 계속 줄일 수도 있었지만, 그 방향을 끊었다.
- 대신 유명 시인 대량 수집을 먼저 여는 쪽으로 우선순위를 바꿨다.
- 그 결과 테스트 문서를 더 늘리지 않고, 바로 wave 1 배치와 최치원 tranche 1 실수집본을 만들었다.

# 다음 세션의 첫 행동

1. `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`을 열어 wave 1 배치 기준을 그대로 유지한다.
2. 최치원을 계속 밀려면 `孤雲集/卷二`, `孤雲集/卷三` 공개 원문부터 tranche 2를 만든다.
3. 최치원을 잠시 멈추고 병렬화하려면 정지상 tranche 1을 `東文選`/`동경잡기(東京雜記)` 축으로 연다.
4. direct-text 확보가 author batch 임계치 아래로 막히면 그 시점에서 OCR lane을 붙인다.

# 다음 세션이 피해야 할 함정

- 다시 exact-title 100% 일치를 선행 조건으로 되돌리지 말 것
- 위키문헌 개별 작품 페이지를 무조건 신뢰하지 말 것
  - 특히 `寓興`은 현재 author mismatch가 있으므로 사용 금지
- 작품 1건마다 권리 검토 때문에 전체 batch를 멈추지 말 것
- direct-text가 막혔을 때 OCR을 “나중에”로만 미루지 말 것
- `孤雲集/卷一` raw cache가 있으므로 같은 tranche를 다시 웹에서 처음부터 긁지 말 것
