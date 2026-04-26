---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 陶隱集 卷三 complete direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 handoff `docs/handoff/2026-04-26-doeunjip-volume3-long-run-wave.md`의 다음 지점인 `寄全齋李先生`부터 이어서 작업했다.
- `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`에 `陶隱集/卷三` 끝부분 48건을 추가했다.
- 이로써 이번 커밋 범위에서는 `陶隱集/卷三` 후반부가 `寄深源長老`에서 끝나지 않고, 마지막 `題康子野卷`까지 이어졌다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

## 이숭인 陶隱集 卷三 final push

- zh Wikisource raw `陶隱集/卷三`에서 48건 direct-text 추가:
  - `寄全齋李先生`
  - `過廣州憶李浩然`
  - `日本有天祐上人饋赤城紫石硯以詩爲謝`
  - `次如大虛九日韻`
  - `走筆謝眞師惠蒲萄`
  - `八關大會日呈誥院諸公`
  - `題妙覺琛師房`
  - `奉送冏公智異山之行次圃隱韻`
  - `題神孝寺祖師房`
  - `送門生韓有文之西原覲親`
  - `吟得二十八字寄崛山近公禪師`
  - `贈省敏近公禪`
  - `七夕宴集`
  - `贈寶蓮`
  - `贈慶山`
  - `失題枕蘭亭`
  - `南行呈圃隱`
  - `送金少年自知之陽山兼柬陽山長老`
  - `星山別業`
  - `奉寄密陽朴壯元`
  - `失題神堂南澗`
  - `僧舍`
  - `扈駕壺串卽事`
  - `題諫院詩卷`
  - `寄圃隱`
  - `中原雜題`
  - `睡起率爾有作錄奉金生長老法座`
  - `十七日早朝奉天門蒙賜冠服`
  - `是日皇太子御文華殿`
  - `詠安南`
  - `詠流求`
  - `自詠口號`
  - `龍江驛開船`
  - `楊子江`
  - `過儀眞`
  - `過楊州`
  - `瓊花館有感`
  - `舟行自高郵湖過范光白馬二湖奉懷東亭圃隱`
  - `舟中望寶應`
  - `過淮陰有感漂母事`
  - `超然臺`
  - `沙門島懷古`
  - `金州途中`
  - `渡鴨綠`
  - `送僧卷三末`
  - `蠅`
  - `題明遠菴`
  - `題康子野卷`

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 325건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 462건
- workerResultWorks: 216건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 같은 작가의 새 worker 파일은 만들지 않고 기존 `worker-11`을 확장했다. builder의 author별 poem id 충돌 위험을 피하기 위해서다.
- 한 heading 아래 여러 수가 이어지는 항목은 계속 한 작품 row 안에 보존했다.
  - 예: `次如大虛九日韻`, `七夕宴集`, `寄圃隱`, `中原雜題`, `楊子江`, `過儀眞`
- 여러 `失題`와 동명 `送僧`은 catalog에서 구분되도록 `matchedTitle`에 핵심 구절이나 위치 표시를 붙였다.
- raw 주석은 본문에서 제외했다.
  - `次如大虛九日韻`의 `三峯，曾吾也...`
  - `南行呈圃隱`의 永興君 관련 설명
  - `寄圃隱`의 孔文擧 관련 설명
  - `過儀眞`의 `處俊爲遼東副總管`
  - `渡鴨綠` 뒤의 `已上二十首，出《奉使錄》。`

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check로 이숭인 worker 102건과 마지막 10건 반영 확인
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- 100줄 이상 JSON 변경 후 diff를 다시 읽어 제목, 본문, 주석 제외 판단을 재검토했다.

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-11-yi-sungin-doeunjip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-doeunjip-volume3-long-run-wave.md`
  - `docs/handoff/2026-04-26-doeunjip-volume3-complete-wave.md`
- 참조:
  - `docs/handoff/2026-04-26-doeunjip-volume3-long-run-wave.md`
  - `llmwiki/wiki/projects/hanshinaru.md`
  - `陶隱集/卷三?action=raw`

# 어디서 멈췄는지

- `陶隱集/卷三`은 이번 wave에서 마지막 `題康子野卷`까지 반영했다.
- 다음 수집은 새 raw path를 고르는 단계다.

# 다음 세션의 첫 행동

1. 최신 커밋과 이 handoff를 확인한다.
2. 다음 후보를 고른다.
   - `陶隱集/卷四`를 이어가거나
   - `謹齋集/卷二` native-form 판단을 따로 열거나
   - 다른 public Wikisource 문집으로 이동한다.
3. `worker-11`은 이미 102건으로 커졌으므로, 후속 이숭인 작업을 계속할 때는 builder의 id 생성 방식을 먼저 개선할지 판단한다.

# 다음 세션이 피해야 할 함정

- 이미 커진 `worker-11`에 무작정 더 붙이면 리뷰가 어려워질 수 있다. 다음 이숭인 wave 전에는 worker split/id 규칙 개선을 검토할 것.
- 한 heading 아래 여러 수를 즉석에서 쪼개지 말 것. 현재 catalog는 한 작품 row 안에 보존하는 쪽으로 일관되어 있다.
- raw의 후주, 위치 주석, 인용문을 본문에 섞지 말 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
