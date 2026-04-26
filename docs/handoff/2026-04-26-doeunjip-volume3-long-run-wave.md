---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 陶隱集 卷三 long-run direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `f5ebe24d [지훈][Feat] Extend Doeunjip volume three wave`와 최신 handoff `docs/handoff/2026-04-26-doeunjip-volume3-second-pass.md`를 확인하고 이어서 작업했다.
- 세션 시작 규칙에 따라 environment/session log, llmwiki project summary, `.rules/`, 최근 커밋, inbox/PR 상태를 확인했다.
  - 열린 PR은 `[]`였다.
  - `docs/inbox/`는 현재 checkout에 없었다.
  - `docs/activity-log.md`도 현재 checkout에 없었다.
- `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`에 `陶隱集/卷三` 후속 작품 34건을 추가했다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

## 이숭인 陶隱集 卷三

- zh Wikisource raw `陶隱集/卷三`에서 34건 direct-text 추가:
  - `登松嶽`
  - `登樓`
  - `送金若齋`
  - `送李密直承源巡問楊廣`
  - `失題`
  - `旅寓聞鶯`
  - `道上遇雪`
  - `雪夜憶三峯呈諸友`
  - `春雲`
  - `秋日雨中有感`
  - `丁未七月十五日夜赴直廬夢得一聯`
  - `冒雨過地藏寺南池`
  - `山中感興`
  - `游琊山呈息谷`
  - `奉送息谷吉祥山之行`
  - `雨中看牧丹`
  - `謝息谷惠米`
  - `七夕`
  - `冒雨過東安江書所見`
  - `白廉使惠茶`
  - `有感寄樞齊先生`
  - `李浩然借拙藁以詩答之`
  - `題浩然遁村卷後`
  - `十月十五日夜寄呈息谷長老`
  - `呈尹判書求梅`
  - `再呈尹判書求瑞香`
  - `梅花`
  - `李浩然送唐詩以詩答之`
  - `雨中寄淸涼然禪師`
  - `睡菴文長老印藏經于海印寺戲呈`
  - `題僧舍`
  - `送兪散翁還別業`
  - `代書寄法水長老`
  - `寄深源長老`

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 277건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 414건
- workerResultWorks: 168건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 같은 작가의 후속 worker를 새 파일로 만들면 poem id 충돌 위험이 있어 기존 `worker-11`을 계속 확장했다.
- `七夕`, `山中感興`, `梅花`, `白廉使惠茶`처럼 한 heading 아래 여러 수가 이어지는 항목은 이번 wave에서도 한 작품 row 안에 보존했다. 후속 `textParts`/series split 규칙이 정해지면 그때 분할하는 편이 안전하다.
- `秋日雨中有感` 뒤의 思菴先生 임종시는 주석성 인용으로 보고 본문에 넣지 않았다.
- `睡菴文長老印藏經于海印寺戲呈` 뒤의 `海印洞口...`는 위치 주석으로 보고 본문에 넣지 않았다.
- `十月十五日夜寄呈息谷長老`의 `□`는 raw의 결자 표시라 원문 상태로 보존했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check로 이숭인 worker 54건과 마지막 8건 반영 확인
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- 100줄 이상 JSON 변경 후 diff를 다시 읽어 제목, 본문, 주석 제외 판단을 재검토했다.

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 `history/history.tsx`, `tang300/tang300.tsx`의 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-doeunjip-volume3-long-run-wave.md`
- 참조:
  - `docs/handoff/2026-04-26-doeunjip-volume3-second-pass.md`
  - `.rules/`
  - `llmwiki/wiki/projects/hanshinaru.md`
  - `陶隱集/卷三?action=raw`

# 어디서 멈췄는지

- `陶隱集/卷三` raw의 `寄深源長老`까지 반영했다.
- 다음 raw heading은 `寄全齋李先生`이다.

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git diff --stat -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-26-doeunjip-volume3-long-run-wave.md`
2. `陶隱集/卷三`의 `寄全齋李先生`부터 계속 수집한다.
3. 후반에는 `日本`, `中原`, `楊子江`, `鴨綠` 등 사행·여행시 heading이 길게 이어지므로, heading 단위 보존과 주석 제외 판단을 계속 엄격히 적용한다.

# 다음 세션이 피해야 할 함정

- 같은 작가의 새 worker 파일을 만들지 말 것. 현재 builder에서는 같은 author 안에서 worker file별 순번이 겹치면 poem id 충돌 위험이 있다.
- 한 heading 아래 여러 수가 있는 항목을 즉석에서 쪼개지 말 것. 현재 catalog는 한 작품 row 안에 보존하는 쪽으로 일관되어 있다.
- raw의 후주, 위치 주석, 인용문을 본문에 섞지 말 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
