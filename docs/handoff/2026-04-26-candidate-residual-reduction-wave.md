---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Candidate residual reduction and native-form direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 후보-only를 줄이고 작품 수를 늘리는 방향으로 worker 파일 2개를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-20-dongmunseon-yaeun-residual-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-21-native-forms-wikisource-residual-wave.v1.json`
- `東文選` 공개 raw와 `冶隱先生言行拾遺` 공개 raw에서 19건을 direct-text로 추가했다.
  - 을지문덕 1, 김부식 3, 정서 1, 이인로 2, 임춘 2, 김극기 2, 길재 8
- ko Wikisource 공개 raw에서 고유시가/시조/초기 한시 5건을 direct-text로 추가했다.
  - 유리왕 `黃鳥歌`
  - 서동 `薯童謠`
  - 정서 `鄭瓜亭`
  - 정몽주 `丹心歌`
  - 박인량 `舟中夜吟`
- `scripts/build_korean_poet_chronology_catalog.js`를 수정해, worker 결과뿐 아니라 이미 병합된 direct-text와 `Donggyeong Japgi` witness도 후보 제거 기준으로 보게 했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 1316건
- source-located: 0건
- blocked: 0건
- candidate-only: 74건
- totalWorks: 1390건
- workerResultWorks: 1209건

# 핵심 판단과 이유

- 직전 상태는 direct-text 1292건, candidate-only 102건이었다.
- 이번 worker 추가만으로는 candidate-only가 90건까지 줄었다.
- 이후 `Donggyeong Japgi`에서 이미 direct-text로 들어온 작품들이 seed 후보로 중복 잔존하는 문제를 발견했다.
- 중복 작품을 새 worker로 다시 추가하지 않고, builder의 후보 제거 키를 확장해 이미 병합된 direct-text의 `candidateTitle`, `matchedTitle`, `entryTitle`, `sourceVariants`, `collectionWitnesses` 표제를 함께 보게 했다.
- 이 보정으로 candidate-only가 79건까지 줄었고, native-form worker를 더해 최종 74건이 되었다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-20-dongmunseon-yaeun-residual-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-21-native-forms-wikisource-residual-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 repo 기존 상태 때문에 실패했다.
  - 첫 오류: `history/history.tsx(2,35): Cannot find module 'react'`
  - 이어서 `../home/components/Navigation`, `../home/components/Footer` 누락과 JSX 타입 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.
- 이번 세션에서 발견한 실제 파이프라인 문제는 `Donggyeong Japgi` direct-text가 seed 후보 제거 기준에 빠져 있던 점이며, 이번에 builder에서 보정했다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-20-dongmunseon-yaeun-residual-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-21-native-forms-wikisource-residual-wave.v1.json`
  - `docs/handoff/2026-04-26-candidate-residual-reduction-wave.md`
- 수정:
  - `scripts/build_korean_poet_chronology_catalog.js`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-mid-joseon-candidate-reduction-wave.md`
  - `東文選/卷四?action=raw`
  - `東文選/卷十九?action=raw`
  - `冶隱先生言行拾遺/卷上?action=raw`
  - ko Wikisource `황조가`, `서동요`, `정과정`, `단심가`, `주중야음`

# 어디서 멈췄는지

- candidate-only는 74건 남았다.
- 남은 큰 묶음은 이황 3건, 그리고 김정희·김종직·김택영·매창·박제가·박지원·변계량·세종·신위·안중근·원천석·이곡·이제현·정약용·정인보·조위·조희룡·최자·허균·홍랑·황진이 각 2건이다.
- 남은 후보 상당수는 공개 Wikisource raw만으로는 바로 확정하기 어렵고, ITKC/KORCIS/개별 문집 또는 저작권 확인이 필요한 쪽으로 이동했다.

# 다음 세션의 첫 행동

1. 이황 `陶山雜詠`, 매화시, 도산 관련 시는 `退溪集` 공개 witness를 다시 찾되, zh Wikisource 검색이 노이즈가 심하므로 KORCIS/ITKC locator를 먼저 확인한다.
2. 정약용 `哀絶陽`, `耽津村謠`는 공개 원문 witness가 있는지 ko/zh Wikisource와 다른 공개 DB를 다시 탐색한다.
3. 보현십원가처럼 한 후보 아래 여러 하위 작품이 있는 경우는 `textParts` 또는 하위 작품 분할 중 하나를 정한 뒤 worker로 넣는다.

# 다음 세션이 피해야 할 함정

- 이미 `Donggyeong Japgi` import로 들어온 작품을 worker로 중복 추가하지 말 것.
- 제목이 넓은 후보일 때는 `candidateTitle`은 seed 문구 그대로, 실제 제목은 `matchedTitle`에 둔다.
- ko Wikisource의 번역문이나 transclusion 이미지는 수집하지 말고 원문만 넣는다.
- 산문 후보는 작품 수를 늘리기 위해 억지로 시 catalog에 넣지 말 것.
