---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 陶隱集 卷三·謹齋集 卷一 continuation direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `0c7bb6bd [지훈][Feat] Add Samguk Yusa Doeunjip Geunjaejip wave`와 최신 handoff `docs/handoff/2026-04-26-samguk-yusa-doeunjip-geunjaejip-wave.md`를 확인하고 이어서 작업했다.
- 세션 시작 규칙에 따라 environment/session log, project wiki, `.rules/`, 최근 커밋, inbox/PR 상태를 확인했다.
  - `docs/activity-log.md`와 `docs/inbox/to-codex/`는 현재 checkout에 없었다.
  - `gh pr list --limit 10 --json ...` 결과 열린 PR은 `[]`였다.
- 같은 작가의 worker 파일을 새로 만들면 catalog builder의 per-file worker index 때문에 poem id가 겹칠 수 있어, 기존 worker 파일에 후속 작품을 이어 붙였다.
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
- catalog와 public mirror를 재생성했다.

# 수집 결과

## 이숭인 陶隱集 卷三

- zh Wikisource raw `陶隱集/卷三`에서 4건 direct-text 추가:
  - `南郊`
  - `苦熱`
  - `玄聖寺讀書`
  - `奉送羅判事使日東`
- `奉送羅判事使日東`은 heading 아래 네 수가 이어지는 구조라 이번 wave에서는 한 작품 row 안에 보존했다.

## 안축 謹齋集 卷一

- zh Wikisource raw `謹齋集/卷一`에서 6건 direct-text 추가:
  - `元帥臺詩`
  - `次洞山縣觀瀾亭詩韻`
  - `叢石亭宴使臣有作`
  - `穿島詩`
  - `金幱窟詩`
  - `登州古城懷古`
- 모두 `관동 지역 시문` bucket에 들어갈 수 있는 지리·기행·풍속 비판 성격의 작품이다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 235건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 372건
- workerResultWorks: 126건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 이번 세션 목표는 작품 수 확장이었고, 지난 handoff의 추천대로 이미 raw path가 확인된 `陶隱集`과 `謹齋集` continuation이 가장 안정적이었다.
- 같은 작가의 후속 worker를 새 파일로 만들면 `scripts/build_korean_poet_chronology_catalog.js`가 worker file 안의 순번만으로 poem id를 만들기 때문에 같은 author의 기존 poem id와 충돌할 위험이 있다. 그래서 기존 worker 파일을 확장했다.
- `謹齋集` 권1은 아직 뒤쪽에 `關東別曲`, `竹溪別曲` 같은 native-form 자료도 있지만, 이번 wave에서는 한시 direct-text만 추가했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check로 이숭인 卷三 4건과 안축 worker 12건 반영 확인
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`와 `../home/components/Navigation` 누락이다.
  - 이후 `history/history.tsx`, `tang300/tang300.tsx`에서 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 worker JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-doeunjip-geunjaejip-continuation-wave.md`
- 참조:
  - `docs/handoff/2026-04-26-samguk-yusa-doeunjip-geunjaejip-wave.md`
  - `.rules/`
  - `llmwiki/wiki/projects/hanshinaru.md`

# 원래 계획과 달라진 점

- 최신 handoff는 `退溪先生文集` raw 재탐색도 후보로 남겼지만, 이번 한 턴에서는 이미 raw가 열려 있고 연속 수집이 쉬운 두 문집을 먼저 확장했다.
- 새 worker 파일을 추가하지 않고 기존 worker 파일을 확장했다. 이는 id 충돌을 피하기 위한 안전 조치다.

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git diff --stat -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-26-doeunjip-geunjaejip-continuation-wave.md`
2. `謹齋集/卷二`의 `白文寶按部上謠`, `同使上妓謠`, `關東別曲`, `竹溪別曲`을 native-form으로 넣을지 별도 worker로 분리할지 판단한다.
3. `陶隱集/卷三` 후반의 추가 짧은 제목시를 계속 수집한다.
4. 시간이 있으면 `退溪先生文集` 권별 raw 경로를 다시 찾는다.

# 다음 세션이 피해야 할 함정

- 같은 작가의 새 worker 파일을 무심코 추가하지 말 것. 현재 builder는 같은 author 안에서 worker file별 순번이 겹치면 poem id 충돌 위험이 있다.
- `奉送羅判事使日東`처럼 한 heading 아래 여러 수가 묶인 작품은 무리하게 쪼개지 말고, 먼저 series split 규칙을 정한 뒤 처리할 것.
- `謹齋集/卷二`의 가요 자료는 한시와 장르가 다르므로 `genre.track` 판단을 확인하면서 넣을 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
