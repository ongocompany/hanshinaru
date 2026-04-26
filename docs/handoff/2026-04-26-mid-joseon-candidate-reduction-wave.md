---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Mid Joseon candidate reduction direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 wave `worker-17`을 커밋했다.
  - commit: `f6b5e57b [지훈][Feat] Add Bohanjae Gobong Cheongeum wave`
- 이어서 후보-only를 더 줄이고 작품 수를 늘리는 방향으로 worker 파일 2개를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-18-sambong-yongjae-jeibong-midjoseon-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-19-gyegok-gosan-takyeong-wave.v1.json`
- zh Wikisource 공개 raw 기준으로 direct-text 238건을 추가했다.
  - worker-18: 정도전 30, 이행 24, 고경명 24, 백광훈 24, 최경창 24, 허봉 20, 김려 24, 이달 10
  - worker-19: 장유 24, 윤선도 24, 김일손 10
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 1292건
- source-located: 0건
- blocked: 0건
- candidate-only: 102건
- totalWorks: 1394건
- workerResultWorks: 1185건

# 핵심 판단과 이유

- 후보를 줄이는 효과는 `candidateTitle`이 기존 seed 후보명과 일치할 때만 생긴다. 이번 wave는 실제 작품 수 증가와 후보 제거를 같이 노렸다.
- `三峯集`, `容齋集`, `霽峯集`, `玉峯集`, `孤竹遺稿`, `荷谷先生集`, `藫庭遺藁`, `蓀谷詩集`, `谿谷先生集`, `孤山遺稿`, `濯纓先生文集`에서 heading과 본문이 분리된 항목만 사용했다.
- `worker-19`는 처음 생성 뒤 nested heading이 본문에 섞인 항목을 발견했다. `=====附=====`, `原韻`, `其四`류 편집 표식과 불안정 항목을 제거한 뒤 58건으로 줄였다.
- `燕巖集`, `湛軒書`, `記言`, `谿谷先生集/卷二`처럼 공개 원문이 있어도 산문·서간·표문 중심인 권은 이번 catalog에 넣지 않았다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-18-sambong-yongjae-jeibong-midjoseon-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-19-gyegok-gosan-takyeong-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-18-sambong-yongjae-jeibong-midjoseon-wave.v1.json docs/spec/korean-poet-worker-results/worker-19-gyegok-gosan-takyeong-wave.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패한다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-18-sambong-yongjae-jeibong-midjoseon-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-19-gyegok-gosan-takyeong-wave.v1.json`
  - `docs/handoff/2026-04-26-mid-joseon-candidate-reduction-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-bohanjae-gobong-seonggeunbo-cheongeum-wave.md`
  - `三峯集/卷二?action=raw`
  - `容齋集/卷二?action=raw`
  - `霽峯集/卷一?action=raw`
  - `玉峯集 (白光勳)/上?action=raw`
  - `孤竹遺稿?action=raw`
  - `荷谷先生集/詩鈔?action=raw`
  - `藫庭遺藁/卷一?action=raw`
  - `蓀谷詩集/卷一?action=raw`
  - `谿谷先生集/卷二十五?action=raw`
  - `孤山遺稿/卷一?action=raw`
  - `濯纓先生文集/續上?action=raw`

# 어디서 멈췄는지

- candidate-only는 102건 남았다.
- 남은 상위 후보 묶음은 김부식 3건, 이황 3건, 그리고 정서·이인로·임춘·김극기·최자·이제현·이곡·원천석·변계량·길재 등 각 2건이다.
- 남은 후보 중 상당수는 단순 문집 raw 수집보다 선집·사서·고유시가 원전 확인이 필요하다.

# 다음 세션의 첫 행동

1. 고려 전기·중기 후보는 `東文選`, `破閑集`, `補閑集`, `三韓詩龜鑑` 계열 선집에서 제목 단위로 확인한다.
2. 이황 `退溪集`은 zh Wikisource 검색이 계속 빗나가므로 한국고전종합DB/KORCIS locator를 먼저 잡는다.
3. 변계량 `春亭集`, 길재 `冶隱集`, 원천석 `耘谷遺稿`는 zh Wikisource에 표제는 보이나 raw 구조가 약하므로 다른 권·다른 witness를 먼저 확인한다.

# 다음 세션이 피해야 할 함정

- 공개 원문이 있다고 해서 산문 권을 시 catalog에 넣지 말 것.
- nested heading이 본문에 섞이는지 반드시 `=====`, `{{`, `[[`, `<small>` 같은 표식을 샘플링할 것.
- 넓은 후보명에 새 작품을 많이 붙일 때는 `candidateTitle`을 seed 후보명 그대로 유지하고, 실제 제목은 `matchedTitle`에 둔다.
