---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 陶隱集 卷一·卷二 large direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 커밋 `258bf4a9`로 안축 `謹齋集` 대량 wave를 먼저 고정했다.
- 이어서 `陶隱集/卷一`, `陶隱集/卷二` raw를 확인하고, 짧고 heading 경계가 분명한 詩 항목을 대량 추가했다.
- `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`에 이숭인 direct-text 150건을 추가했다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

- `陶隱集/卷一`에서 11건 추가.
  - 예: `送偰符寶還朝`, `送鄭大常按慶尙`, `行路難`, `渡遼曲`
- `陶隱集/卷二`에서 139건 추가.
  - 예: `送徐九思之江陵省親`, `辛亥除夜，呈席上諸公`, `十一月十七日夜，聽功益新羅《處容歌》...`, `鏡浦泛舟`, `浮碧樓次韻，錄呈巡問令公`
- 이번 wave는 긴 산문 권이 아니라 詩 heading이 조밀한 `卷二`가 중심이었다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 590건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 727건
- workerResultWorks: 482건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 63건
- donggyeongJapgiSourceVariants: 31건

# 핵심 판단과 이유

- 기존 `worker-11`을 계속 확장했다. 현재 builder가 같은 작가를 여러 worker 파일로 나눌 때 poem id 충돌 위험이 있기 때문이다.
- `卷一·卷二` 모두 heading level 2 기준으로, 원문 길이 120자 이하이고 본문 경계가 분명한 항목만 자동 선별했다.
- raw의 후주와 상황 설명이 본문에 섞인 항목 2개를 재검토해 제거했다.
  - `寄若齋`: `時柳君克恕作驪興守。` 제외
  - `浮碧樓次韻，錄呈巡問令公`: `龍潭，驛名，隷應天府上元縣。` 제외
- 긴 제목 항목은 원 heading을 보존했다. 다만 다음 편집 wave에서 display title을 더 짧게 정리할 수 있다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- worker-11 source file 기반 direct-text poem id 중복이 없음을 확인했다.
- `rg`로 `驛名`, `時柳君`, `隷應天`, `已上...出《`류 주석 섞임을 재확인했다. 남은 hit는 notes에만 있다.

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-doeunjip-volume1-2-large-wave.md`
- 참조:
  - `docs/handoff/2026-04-26-geunjaejip-large-collection-wave.md`
  - `陶隱集/卷一?action=raw`
  - `陶隱集/卷二?action=raw`
  - `謹齋集/卷三?action=raw`

# 어디서 멈췄는지

- `陶隱集/卷一·卷二`의 짧고 안전한 heading 항목은 대량 반영했다.
- `陶隱集/卷一`에는 길이가 긴 항목, 내부 `其二`류 구조가 있는 항목, 또는 제목/본문 구조를 더 손으로 봐야 하는 항목이 남아 있다.
- `謹齋集/卷三`은 headings 기준으로 수집량이 작아 보였고, 이번 wave에서는 보류했다.

# 다음 세션의 첫 행동

1. 최신 커밋과 이 handoff를 확인한다.
2. `worker-11`이 252건으로 커졌으므로, 다음 이숭인 wave 전에는 worker id 생성 방식 개선 또는 worker split 방식을 먼저 검토한다.
3. 추가 수집을 계속한다면 `陶隱集/卷一`의 긴 항목을 수동 분리하거나, 새 공개 문집 후보로 이동한다.

# 다음 세션이 피해야 할 함정

- `幷序`, 지명 설명, 작가 설명 같은 주석을 시 본문에 섞지 말 것.
- `worker-11`이 매우 커졌으므로 리뷰 가능한 단위로 끊거나 builder id 규칙을 개선하지 않은 채 무작정 더 키우지 말 것.
- 전체 repo는 여전히 unrelated dirty tree가 많다. active chronology 파일만 pathspec으로 다룰 것.
