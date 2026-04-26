---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 圃隱集 卷一 Jeong Mongju direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 handoff `docs/handoff/2026-04-26-doeunjip-volume1-2-large-wave.md`와 최신 커밋 `d069836d`를 확인한 뒤 시 수집을 재개했다.
- `worker-11` 이숭인 파일이 이미 252건으로 커져 있어, 같은 작가를 별도 worker로 쪼갤 때 생길 수 있는 id 충돌을 피하기 위해 새 작가 wave로 전환했다.
- zh Wikisource `圃隱集/卷一?action=raw`에서 heading 경계가 분명하고 본문이 짧은 정몽주 한시 112건을 수집했다.
- 새 worker 파일 `docs/spec/korean-poet-worker-results/worker-13-jeong-mongju-poeunjip.v1.json`을 만들었다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

- `圃隱集/卷一` 정몽주 direct-text 112건 추가.
- 예:
  - `蓬萊驛。示韓書狀。`
  - `龍山驛`
  - `黃山驛路上`
  - `楊州竹西亭。懷松京諸友。`
  - `蒙賜朝服行賀禮`
  - `盖州館柳`
  - `江南柳`
  - `再遊是寺`

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 702건
- source-located: 0건
- blocked: 0건
- candidate-only: 136건
- totalWorks: 838건
- workerResultWorks: 594건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 63건
- donggyeongJapgiSourceVariants: 31건

# 핵심 판단과 이유

- 이번 wave는 `worker-13-jeong-mongju-poeunjip` 새 파일로 분리했다. 기존 이숭인 worker를 계속 키우거나 같은 작가 worker를 추가하면 현재 builder의 per-author sequence id 규칙 때문에 충돌 위험이 있다.
- `圃隱集/卷一` raw의 `<sub>`와 Wikisource template 주석은 본문에서 제거했다.
- body 길이 100자 이하, title 길이 45자 이하, heading 경계가 뚜렷한 항목만 반영했다. 추가 연속 wave에서 같은 조건으로 `盖州館柳`부터 `再遊是寺`까지 32건을 더 붙였다.
- 정몽주 seed에 `丹心歌`가 있어 worker 한시까지 `시조`로 잘못 추론되는 문제를 발견했다. `scripts/build_korean_poet_chronology_catalog.js`에서 worker direct-text는 제목 자체가 고유시가가 아닌 경우 `한시/미확정`으로 보정하도록 수정했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-13-jeong-mongju-poeunjip.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- scripts/build_korean_poet_chronology_catalog.js docs/spec/korean-poet-worker-results/worker-13-jeong-mongju-poeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq`로 정몽주 `圃隱集` 112건이 `한시 / 미확정 / hansi-direct-text`로 들어간 것을 확인했다.

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-13-jeong-mongju-poeunjip.v1.json`
  - `docs/handoff/2026-04-26-poeunjip-volume1-jeong-mongju-wave.md`
- 수정:
  - `scripts/build_korean_poet_chronology_catalog.js`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-doeunjip-volume1-2-large-wave.md`
  - `圃隱集/卷一?action=raw`

# 어디서 멈췄는지

- `圃隱集/卷一`에서 이번 조건으로 안전하게 자동 선별 가능한 짧은 항목 112건은 모두 반영했다.
- 같은 raw에는 긴 항목과 산문 설명이 섞인 항목이 남아 있다.
- `王坊驛。贈遼東程鎭撫。`, `僮陽驛壁畫鷹熊。歌用陳敎諭韻。`처럼 긴 항목은 이번 wave에서 제외했다.

# 다음 세션의 첫 행동

1. 이 handoff와 현재 diff를 확인한다.
2. `圃隱集/卷二` raw 접근성을 확인하거나, `圃隱集/卷一`의 긴 항목을 수동 분리할지 판단한다.
3. 같은 작가 worker를 새로 분리해야 한다면 먼저 builder id 규칙을 `workerId` 포함 방식으로 개선할지 판단한다.

# 다음 세션이 피해야 할 함정

- 정몽주 seed의 `丹心歌` 때문에 한시가 `시조`로 오분류될 수 있다. 이번 builder 보정이 유지되는지 먼저 확인할 것.
- Wikisource의 `<sub>` 교감주와 `{{*|...}}` 주석을 poemZh에 섞지 말 것.
- 전체 repo는 unrelated dirty tree가 많다. 이번 chronology 관련 파일만 pathspec으로 다룰 것.
