---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 陶隱集 卷三 second-pass direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 continuation wave를 `70b60202 [지훈][Feat] Extend Doeunjip and Geunjaejip wave`로 커밋한 뒤, 컨텍스트 여유를 활용해 한 턴 더 수집했다.
- `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`에 `陶隱集/卷三` 후속 작품 8건을 추가했다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

## 이숭인 陶隱集 卷三

- zh Wikisource raw `陶隱集/卷三`에서 8건 direct-text 추가:
  - `尋散翁不遇`
  - `呈金仲權`
  - `西江卽事`
  - `送李生之水原`
  - `江邊夜宿`
  - `題全五倫山房`
  - `泰齋相公宅梅花`
  - `丁未十月二十九日扈駕康安殿`
- `西江卽事`는 같은 heading 아래 두 수가 이어지는 구조라 이번 wave에서는 한 작품 row 안에 보존했다.
- `江邊夜宿` raw의 후주 `夜半有暴風。`은 본문이 아니라 주석으로 판단해 `poemZh`에는 넣지 않았다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 243건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 380건
- workerResultWorks: 134건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 같은 작가의 후속 worker를 새 파일로 만들면 poem id 충돌 위험이 있어, 이번에도 기존 `worker-11`을 확장했다.
- 이번 수집은 제목과 본문 경계가 짧고 명확한 작품 위주로 진행했다.
- `陶隱集/卷三`에는 아직 추가 가능한 짧은 작품이 더 남아 있지만, 이번 wave는 검증 가능한 8건에서 끊었다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check로 이숭인 worker 20건 반영 확인
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 React JSX 타입과 암시적 `any` 오류가 이어진다.
  - 이번 worker JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-doeunjip-volume3-second-pass.md`
- 참조:
  - `docs/handoff/2026-04-26-doeunjip-geunjaejip-continuation-wave.md`
  - `陶隱集/卷三?action=raw`

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git diff --stat -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-26-doeunjip-volume3-second-pass.md`
2. `陶隱集/卷三` 후반의 `登松嶽`, `登樓`, `旅寓聞鶯`, `道上遇雪`, `春雲`, `山中感興` 등을 이어서 수집한다.
3. `謹齋集/卷二`의 native-form 자료는 한시 direct-text wave와 분리해 별도 판단한다.

# 다음 세션이 피해야 할 함정

- 같은 작가의 새 worker 파일을 만들면 poem id 충돌 위험이 있다. builder를 고치기 전까지는 기존 worker 확장을 우선할 것.
- heading 아래 여러 수가 있는 작품은 `textParts` 또는 series split 규칙을 정하기 전까지 한 row로 보존하는 편이 안전하다.
- raw의 후주·원주를 본문에 섞지 말 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
