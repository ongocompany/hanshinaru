---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: source-located 해소와 황현 공개 원문 wave
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 handoff `docs/handoff/2026-04-25-donggyeong-supplement-author-import.md`와 최신 커밋 `1d0822ca [지훈][Feat] Add Donggyeong supplement seed import`를 확인했다.
- 세션 시작 규칙에 따라 project wiki, environment/session log, `.rules/`, 최근 커밋, 열린 PR 상태를 확인했다.
  - 열린 PR은 없었다.
  - `docs/activity-log.md`와 `docs/inbox/`는 현재 checkout에 없어서 확인 불가였다.
- 이전 handoff의 첫 추천 작업이던 이제현/정도전 `source-located` 6건을 모두 공개 Wikisource 원문으로 승격했다.
  - 이제현 `小樂府`
  - 이제현 `題長安逆旅`
  - 이제현 `寄題白花禪院觀空樓次韻`
  - 정도전 `關山月`
  - 정도전 `秋夜`
  - 정도전 `文德曲`
- `docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json`의 위 6건을 `SRC-YGC-ORIGINAL-TEXT` locator에서 `SRC-WIKISOURCE-TEXT` direct-text로 바꿨다.
- 황현 공개 원문 tranche를 새 worker 파일로 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-8-hwang-hyeon-public-wikisource.v1.json`
  - `梅泉集` Wikisource 원문에서 7건 수집:
    - `絶命詩 四首`
    - `元宵`
    - `孤雲吹笛臺有感`
    - `登梅營南門`
    - `秋夜吟`
    - `一蠧遺墟 二首`
    - `哀朴長興憲陽`
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 195건
- source-located: 0건
- blocked: 0건
- candidate-only: 151건
- totalWorks: 346건
- workerResultWorks: 86건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- YGC는 위치 확인에는 유용하지만 공개 본문 승격 근거로 쓰지 않는다는 기존 정책을 유지했다.
- 이제현/정도전 6건은 모두 zh Wikisource의 공개 문집 권별 raw에서 제목과 원문이 확인되어 direct-text로 승격했다.
- `小樂府`, `題長安逆旅`, `文德曲`처럼 한 heading 아래 여러 수가 묶인 경우는 이번에는 하나의 작품 row 안에 줄바꿈으로 보존했다. 후속으로 연작 분할 기준을 더 엄격히 세울 수 있다.
- 황현의 `上元雜詠` seed 후보는 exact title이 아니라 같은 상원/정월 대보름 계열의 `元宵` 2수로 대응했다. 그래서 locatorConfidence를 `medium`으로 두었다.
- 황현의 `우국시` seed 후보도 포괄 후보라 `孤雲吹笛臺有感`을 대표 수집하고 locatorConfidence를 `medium`으로 두었다.

# 검증

- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check
  - `source-located`/`blocked` catalog row: `[]`
  - worker-3 first 6 rows: Wikisource policy, direct-text, commercial_allowed
  - worker-8: 7 poems, all direct-text
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json docs/spec/korean-poet-worker-results/worker-8-hwang-hyeon-public-wikisource.v1.json docs/spec/korean-poems-chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poems_chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류로 실패한다.
  - `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.`
  - 이번 수집 변경 파일과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/spec/korean-poet-worker-results/worker-8-hwang-hyeon-public-wikisource.v1.json`
  - `docs/handoff/2026-04-25-source-located-clear-and-hwang-hyeon-wave.md`
- 참조:
  - `docs/handoff/2026-04-25-donggyeong-supplement-author-import.md`
  - `docs/handoff/2026-04-25-donggyeong-db-import-phase1.md`
  - `docs/tech-overview.md`
  - `.rules/`

# 원래 계획과 달라진 점

- 원래 추천 작업은 이제현/정도전 source-located 6건 해소였다.
- 6건이 모두 빠르게 풀려서, 같은 세션 안에서 황현 `梅泉集` 공개 원문 tranche 7건까지 추가했다.

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git diff --stat -- docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json docs/spec/korean-poet-worker-results/worker-8-hwang-hyeon-public-wikisource.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-25-source-located-clear-and-hwang-hyeon-wave.md`
2. 황현 worker의 `medium` 대응 2건을 검토한다.
   - `上元雜詠` ↔ `元宵`
   - `우국시` ↔ `孤雲吹笛臺有感`
3. 다음 수집 wave는 `燕巖集`보다 문집 내 시 제목이 더 또렷한 작가를 먼저 잡는 편이 좋다.
   - 후보: 이덕무 `靑莊館全書`, 신위 `紫霞詩集`, 김정희 `阮堂集`
   - 박지원 `燕巖集`은 산문 비중이 커서 "시문"으로 넣을지 기준을 먼저 정해야 한다.
4. 장기적으로는 `小樂府`, `題長安逆旅`, `文德曲`, `絶命詩 四首` 같은 묶음 작품의 분할 기준을 정한다.

# 다음 세션이 피해야 할 함정

- YGC 원문을 직접 공개 본문으로 승격하지 말 것. 공개 대체 판본이 확인될 때만 `SRC-WIKISOURCE-TEXT`로 올린다.
- 포괄 seed 후보를 exact title처럼 취급하지 말 것. 대응 제목이 다르면 `locatorConfidence: medium`으로 남긴다.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
- `npx tsc --noEmit` 실패를 이번 수집 변경의 새 오류로 오해하지 말 것.
