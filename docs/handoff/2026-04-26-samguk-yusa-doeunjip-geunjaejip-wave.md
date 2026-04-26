---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 三國遺事·陶隱集·謹齋集 direct-text 확장 wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `7887c8b3 [지훈][Feat] Add Yi Deokmu Cheongjanggwan wave`와 최신 handoff `docs/handoff/2026-04-26-yi-deokmu-cheongjanggwan-wave.md`를 확인하고 이어서 작업했다.
- 세션 시작 규칙에 따라 environment/session log, project wiki, `.rules/`, 최근 커밋, inbox/PR 상태를 확인했다.
  - `docs/activity-log.md`와 `docs/inbox/to-codex/`는 현재 checkout에 없었다.
  - `gh pr list --limit 20 --json ...` 결과 열린 PR은 `[]`였다.
- 새 worker 결과 3개를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-10-samguk-yusa-hyangga.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
- catalog와 public mirror를 재생성했다.

# 수집 결과

## worker-10 三國遺事 향가

- zh Wikisource raw `三國遺事/卷第五`, `三國遺事/卷第二`에서 8건 direct-text 수집:
  - 월명사: `兜率歌`, `祭亡妹歌`
  - 충담사: `安民歌`, `讚耆婆郞歌`
  - 융천사: `彗星歌`
  - 신충: `怨歌`
  - 영재: `遇賊歌`
  - 처용: `處容歌`
- `處容歌` raw의 `{{!|𬚵|...}}` 표기는 표시 글자 `𬚵`로 정리했다.
- `遇賊歌`의 결자 표지 `□`는 원문 상태를 보존했다.

## worker-11 이숭인 陶隱集

- zh Wikisource raw `陶隱集/卷一`, `陶隱集/卷二`에서 8건 direct-text 수집:
  - `感興`
  - `秋夜感懷`
  - `題倫上人絶磵松風軒卷`
  - `扈從城南`
  - `自壽`
  - `病中`
  - `江村卽事`
  - `送潤雲老上人還山`
- `浮碧樓` exact title은 이번 quick pass에서 못 찾았다.
  - 대신 `題倫上人絶磵松風軒卷`을 누정·산수 계열 대표 direct-text로 임시 매핑했고, `locatorConfidence: medium`으로 낮춰 표시했다.
- `秋夜感懷`는 같은 heading 아래 연작이 이어지지만 이번 wave에서는 첫 수만 수집했다. 후속 분할 여지가 있다.

## worker-12 안축 謹齋集

- zh Wikisource raw `謹齋集/卷一`에서 6건 direct-text 수집:
  - `過鐵嶺`
  - `次襄州公館詩韻`
  - `三陟西樓八詠`
  - `詠梅`
  - `次叢石亭詩韻`
  - `金剛山`
- `三陟西樓八詠`은 8영 연작이므로 이번 wave에서는 한 작품 row 안에 보존했다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 225건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 362건
- workerResultWorks: 116건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 이번 세션 목표가 작품 수 확장이었으므로, exact title 하나를 오래 추적하기보다 공개 raw 원문이 바로 열리는 문집·사서 단위로 움직였다.
- `三國遺事` 향가는 seed에 이미 향가·고대 가요를 본편 수집 대상으로 남기기로 했던 방향과 맞고, 원문 표기가 짧고 명확해 빠른 승격 대상으로 적합했다.
- 이숭인·안축은 후보 제목보다 문집 원문이 훨씬 풍부했다. 그래서 candidate bucket을 대표 작품으로 닫되, 추가 direct-text 작품을 함께 넣어 전체 작품 수를 늘렸다.
- `濯溪集` 검색 결과는 `金相進` 문집으로, seed의 `김일손/濯纓集`과 다르므로 수집하지 않았다.
- `退溪先生文集`은 표제 페이지는 확인됐지만 권별 raw가 비어 있거나 404여서 이번 세션에서는 깊게 들어가지 않았다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-10-samguk-yusa-hyangga.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- ...`
- `jq`/node spot check로 신규 author별 반영 작품 확인

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 대표 오류: `history/history.tsx`와 `tang300/tang300.tsx`에서 `Cannot find module 'react'`, `JSX.IntrinsicElements` 없음, 암시적 `any` 오류 다수.
  - 이번 worker JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-10-samguk-yusa-hyangga.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
  - `docs/handoff/2026-04-26-samguk-yusa-doeunjip-geunjaejip-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-yi-deokmu-cheongjanggwan-wave.md`
  - `.rules/`
  - `llmwiki/wiki/projects/hanshinaru.md`

# 원래 계획과 달라진 점

- 최신 handoff는 신위·김정희·이덕무 추가 권을 다음 후보로 제안했다.
- 실제 검색에서는 신위·김정희보다 `三國遺事`, `陶隱集`, `謹齋集` raw가 훨씬 빠르고 안정적으로 확보되어 이번 wave의 주 수집원으로 바꿨다.

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git status --short -- docs/spec/korean-poet-worker-results/worker-10-samguk-yusa-hyangga.v1.json docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-26-samguk-yusa-doeunjip-geunjaejip-wave.md`
2. `秋夜感懷`, `三陟西樓八詠` 같은 연작을 한 row로 둘지, `textParts` 또는 subwork split으로 나눌지 판단한다.
3. 다음 수집 wave는 아래 순서가 효율적이다.
   - `陶隱集` 권3의 짧은 제목시 추가
   - `謹齋集` 권1 후반의 관동 시문 추가
   - `退溪先生文集`은 권별 raw 경로를 다시 찾아본 뒤 진행

# 다음 세션이 피해야 할 함정

- `濯溪集`은 `김일손/濯纓集`이 아니다. 제목이 비슷하지만 저자와 문집이 다르므로 김일손 수집원으로 쓰지 말 것.
- `浮碧樓` exact title을 못 찾았다는 점을 잊지 말 것. worker-11의 해당 매핑은 `medium` 대표 매핑이다.
- `三國遺事` 향가는 원문 표기 특성상 결자·희귀 글자 처리를 함부로 보정하지 말 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
