---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 謹齋集 large direct-text collection wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 handoff `docs/handoff/2026-04-26-doeunjip-volume3-complete-wave.md` 이후 새 raw path를 골라 수집을 이어갔다.
- `陶隱集/卷四`는 확인했지만 대부분 記·序·表 계열 산문이라 이번 "시를 많이 수집" 목표에는 맞지 않아 보류했다.
- `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`에 안축 `謹齋集` direct-text 116건을 추가했다.
- catalog와 public mirror를 재생성했다.

# 수집 결과

## 안축 謹齋集 卷二

- zh Wikisource raw `謹齋集/卷二`에서 27건 direct-text 추가:
  - `李起居注榮親席上作` 5수
  - `白文寶按部上謠` 8수와 별도 보충 1수
  - `同使上妓謠` 10수
  - `送李中父還朝`
  - `關東別曲`
  - `竹溪別曲`

## 안축 謹齋集 卷一

- zh Wikisource raw `謹齋集/卷一`에서 89건 direct-text 추가.
- 산문 序가 길게 붙은 항목은 이번 자동 선별에서 제외하고, 본문 길이가 짧고 詩 본문 경계가 분명한 항목 위주로 넣었다.
- 이미 이전 wave에서 한 row로 보존한 `三陟西樓八詠`의 하위 8수는 중복 생성을 피하려고 제외했다.
- 동명 `過桃源驛`, `過松澗驛`은 뒤쪽 작품을 `（卷一第2首）`로 구분했다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 440건
- source-located: 0건
- blocked: 0건
- candidate-only: 137건
- totalWorks: 577건
- workerResultWorks: 332건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 63건
- donggyeongJapgiSourceVariants: 31건

# 핵심 판단과 이유

- 새 안축 worker 파일을 만들지 않고 기존 `worker-12`를 확장했다. 현재 builder는 같은 작가를 여러 worker 파일로 나누면 worker index 기반 poem id가 충돌할 수 있기 때문이다.
- `卷二`의 `====` 하위 제목은 개별 시로 분리했다. 원문 제목 경계가 분명하고, `四時紅`처럼 동명이 반복되는 경우 상위 묶음명을 `matchedTitle`에 붙여 구분했다.
- `卷一`은 긴 序가 섞인 항목을 욕심내서 넣지 않았다. 이번 wave의 목적은 많은 수집이지만, 산문이 시 본문으로 섞이는 위험은 피하는 쪽이 낫다고 판단했다.
- `晉陽矗石樓`은 최초 자동 추출 때 뒤 설명문이 섞여서 즉시 재검토 후 첫 절구만 남기고, 뒤의 `靈龜山宿水樓`은 별도 항목으로 보존했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- 100줄 이상 JSON 변경 후 diff와 샘플 `jq`를 다시 읽어 제목, 본문 길이, 동명 구분, public mirror 반영을 재검토했다.

# 남은 검증 이슈

- `npx tsc --noEmit`은 실패했다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.
- 전체 catalog의 candidate-only 영역에는 기존 중복 `poemId`가 있다. 이번 direct-text worker 수집분에서는 중복 `poemId`가 없음을 확인했다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/korean-poet-worker-results/worker-12-an-chuk-geunjaejip.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 생성:
  - `docs/handoff/2026-04-26-geunjaejip-large-collection-wave.md`
- 참조:
  - `docs/handoff/2026-04-26-doeunjip-volume3-complete-wave.md`
  - `llmwiki/wiki/projects/hanshinaru.md`
  - `謹齋集/卷一?action=raw`
  - `謹齋集/卷二?action=raw`
  - `陶隱集/卷四?action=raw`

# 어디서 멈췄는지

- 안축 `謹齋集/卷一`의 짧고 안전한 詩 항목은 대량 반영했다.
- `卷一`에 남은 긴 `幷序` 항목과 긴 장편/서문 혼합 항목은 아직 보류 상태다.
- `謹齋集/卷三`은 headings만 확인했고 깊게 수집하지 않았다.

# 다음 세션의 첫 행동

1. 이 handoff와 최신 diff를 확인한다.
2. 다음 중 하나를 고른다.
   - `謹齋集/卷一`에서 보류한 긴 `幷序` 항목을 수동으로 시 본문만 분리한다.
   - `謹齋集/卷三`의 `詩` heading을 확인해 추가 수집한다.
   - 다른 공개 문집으로 이동한다.
3. 같은 작가 worker를 더 키울 경우, builder의 worker id 생성 방식을 먼저 개선할지 판단한다.

# 다음 세션이 피해야 할 함정

- 같은 작가를 새 worker 파일로 쪼개면 현재 poem id가 충돌할 수 있다. 이 문제를 고치기 전에는 기존 worker 확장이 더 안전하다.
- `幷序` 항목은 서문과 시가 붙어 있으므로 자동 추출 결과를 그대로 믿지 말 것.
- `三陟西樓八詠`처럼 이미 한 row로 보존한 연작의 하위 제목을 중복 row로 만들지 말 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
