---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Bohanjae Gobong Seonggeunbo Cheongeum direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `d8899f2e [지훈][Feat] Add large candidate direct text wave`와 직전 handoff `docs/handoff/2026-04-26-large-candidate-direct-text-wave.md`를 확인하고 이어서 진행했다.
- 새 worker 파일을 만들었다.
  - `docs/spec/korean-poet-worker-results/worker-17-bohanjae-gobong-seonggeunbo-cheongeum-wave.v1.json`
- zh Wikisource 공개 raw 기준으로 direct-text 92건을 추가했다.
  - 신숙주 `保閑齋集/卷二`: 24건
  - 기대승 `高峯集/卷一`: 24건
  - 성삼문 `成謹甫先生集/卷一`: 20건
  - 김상헌 `淸陰先生集/卷之三`: 24건
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 1054건
- source-located: 0건
- blocked: 0건
- candidate-only: 118건
- totalWorks: 1172건
- workerResultWorks: 947건

# 핵심 판단과 이유

- 이번 wave는 남은 후보작가 중 공개 raw 구조가 뚜렷한 문집을 우선했다.
- `保閑齋集`, `高峯集`, `成謹甫先生集`, `淸陰先生集`은 heading과 본문이 분리되어 있어 제목-원문 매칭 신뢰도가 높았다.
- 단, 후보명은 `외교시`, `관각시`, `교유시`, `절의시`처럼 넓은 묶음이므로 새 항목은 후보를 실제 작품 제목으로 확장하는 성격이다.
- 성삼문 쪽은 `卷一` 안에 연작과 聯句가 많다. 후속 세션에서 더 엄밀히 다듬을 경우 `卷二~卷四`의 충절 관련 기록과 별도로 비교해야 한다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-17-bohanjae-gobong-seonggeunbo-cheongeum-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-17-bohanjae-gobong-seonggeunbo-cheongeum-wave.v1.json docs/spec/korean-poems-chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poems_chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패한다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-17-bohanjae-gobong-seonggeunbo-cheongeum-wave.v1.json`
  - `docs/handoff/2026-04-26-bohanjae-gobong-seonggeunbo-cheongeum-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-large-candidate-direct-text-wave.md`
  - `保閑齋集/卷二?action=raw`
  - `高峯集/卷一?action=raw`
  - `成謹甫先生集/卷一?action=raw`
  - `淸陰先生集/卷之三?action=raw`

# 어디서 멈췄는지

- candidate-only는 118건 남았다.
- 남은 상위 후보 묶음은 김부식 3건, 이황 3건, 그리고 정서·이인로·임춘·김극기·최자·이제현·이곡·원천석·정도전 등 각 2건이다.
- 다음부터는 단순 zh Wikisource 문집 raw만으로는 속도가 조금 떨어질 가능성이 높다.

# 다음 세션의 첫 행동

1. `退溪集`은 zh Wikisource 검색이 `退軒集`로 빗나가므로 한국고전종합DB/KORCIS locator를 먼저 잡는다.
2. `三峯集`, `耘谷遺稿`, `冶隱集`, `成謹甫先生集/卷二~卷四`는 제목 구조를 먼저 샘플링하고 시만 골라 worker-18로 확장한다.
3. 김부식·이인로·임춘·김극기·최자 같은 고려 쪽은 `東文選`, `破閑集`, `補閑集` 계열 선집에서 제목 단위로 확인한다.

# 다음 세션이 피해야 할 함정

- 문집 raw에 `序`, `記`, `跋`, 전기 자료가 섞이면 시 catalog에 넣지 말 것.
- `candidateTitle`은 기존 seed 후보명과 정확히 맞아야 candidate-only fallback이 제거된다.
- 성삼문은 충절 이미지와 실제 `卷一` 작품 주제가 항상 일치하지 않는다. 필요하면 후보명은 유지하되 notes에 작품 성격을 더 선명히 적는다.
