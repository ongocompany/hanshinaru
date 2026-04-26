---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Kim Byeong-yeon, Jeongjo, and Hyomyeong royal direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 커밋 `41e5738d [지훈][Feat] Add Jeong Mongju and royal seed wave` 이후 상태에서 시 수집 wave를 재개했다.
- 최신 seed gap handoff의 다음 행동대로 김병연, 정조, 효명세자 후보를 먼저 확인했다.
- 새 worker 파일 `docs/spec/korean-poet-worker-results/worker-14-kim-byeongyeon-jeongjo-hyomyeong-royal.v1.json`을 만들었다.
- zh Wikisource 공개 원문 기준으로 direct-text 25건을 추가했다.
  - 김병연 4건: `嘲僧儒`, `蚤`, `步至華楊洞歌`, `論鄭嘉山忠節死 嘆金益淳罪通于天`
  - 정조 5건: `弘齋全書/卷六` 수록 어제시
  - 효명세자 16건: `敬軒集/卷二`, `敬軒集/卷三` 수록 개인 한시, 절첩, 궁중시
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 727건
- source-located: 0건
- blocked: 0건
- candidate-only: 140건
- totalWorks: 867건
- workerResultWorks: 619건

# 핵심 판단과 이유

- 김병연은 `蘭皐集` / `金笠詩集` 단위 공개 문집이 바로 확인되지 않았다. zh Wikisource 검색에서 `蘭皐集`은 중국 `蘭軒集`류로 빗나갔고, `金笠詩集` 단권 페이지도 잡히지 않았다.
- 그래서 이번 wave에서는 단권 문집을 억지로 기다리지 않고, 金炳淵 작자로 확인되는 개별 수록작 4건을 direct-text로 먼저 올렸다.
- 효명세자 `敬軒集`은 공개 raw가 아주 안정적이었다. 왕실 악장/궁중 정재 후보와 개인 한시 후보를 한 파일 안에서 구분해 수집했다.
- 정조 `弘齋全書`는 권수가 크고 聯句가 많아, 이번에는 권육에서 heading이 분명하고 독립시로 다루기 쉬운 짧은 어제시 5건만 선별했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-14-kim-byeongyeon-jeongjo-hyomyeong-royal.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-14-kim-byeongyeon-jeongjo-hyomyeong-royal.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-14-kim-byeongyeon-jeongjo-hyomyeong-royal.v1.json`
  - `docs/handoff/2026-04-26-kim-byeongyeon-jeongjo-hyomyeong-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `docs/spec/korean-poets-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
  - `public/index/korean_poets_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-kim-byeongyeon-royal-seed-gap.md`
  - `弘齋全書/卷六?action=raw`
  - `敬軒集/卷二?action=raw`
  - `敬軒集/卷三?action=raw`
  - zh Wikisource `金炳淵` 검색 결과

# 어디서 멈췄는지

- 김병연은 개별 수록작 4건까지 확보했다. `蘭皐集` / `金笠詩集` 단위 문집 원문은 아직 별도 탐색 대상이다.
- 정조는 `弘齋全書/卷六`의 짧고 독립적인 시 5건만 반영했다. 다른 권과 긴 聯句는 다음 wave에서 별도 기준을 세워야 한다.
- 효명세자는 `敬軒集/卷二`, `卷三`만으로도 추가 수집 여지가 크다.

# 다음 세션의 첫 행동

1. `敬軒集/卷二`의 `山齋詠物詩 四十九首`를 더 확장할지, 아니면 `敬軒集/卷四` 이후로 넘어갈지 정한다.
2. `弘齋全書`는 聯句를 개인 저작으로 다룰지, 御製 구절만 분리할지 원칙을 정한 뒤 다음 묶음을 수집한다.
3. 김병연은 zh Wikisource 개별 작품 추가 검색과 별도 공개 선집 검색을 나눠 진행한다.

# 다음 세션이 피해야 할 함정

- 김병연 `蘭皐集` 검색 결과가 중국 `蘭軒集`으로 쉽게 빗나간다. 문집명만 믿지 말고 작자 金炳淵과 작품 페이지를 같이 확인할 것.
- 정조 `弘齋全書`의 聯句는 신하 구절이 섞인다. 전체를 정조 개인시로 단순 처리하지 말 것.
- 효명세자 `敬軒集`의 궁중 절첩·응제시와 개인 한시는 candidateTitle을 구분해 넣을 것.
