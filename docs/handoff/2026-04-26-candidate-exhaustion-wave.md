---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Candidate exhaustion wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 `worker-22` 이후 남아 있던 chronology candidate-only 67건을 전부 처리했다.
- 새 worker 결과를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-99-candidate-exhaustion-wave.v1.json`
- 공개 raw에서 2건을 direct-text 후보 해소 근거로 추가했다.
  - 세종 `龍飛御天歌 卷第一 第一章`
  - 이곡 `雞林府公館西樓詩序 中詩`
- 나머지 65건은 산문, 이칭/중복 가능성, 시조 중심, 원문 전사 불안정, 저작권 검토 필요, 넓은 주제 후보 등의 이유로 `blocked` 처리했다.
- catalog 생성 로직을 조정했다.
  - `blocked` worker 항목은 후보 제거와 summary 집계에는 쓰되, 실제 작품 목록에는 작품 카드로 넣지 않게 했다.
  - 이렇게 해야 산문/저작권/불확정 후보가 공개 작품 목록에 섞이지 않는다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 1351건
- source-located: 0건
- blocked: 65건
- candidate-only: 0건
- totalWorks: 1351건
- workerResultWorks: 1311건
- Donggyeong Japgi matched blocks: 94건
- Donggyeong Japgi imported works: 60건
- Donggyeong Japgi source variants: 34건

# 핵심 판단과 이유

- 후보목록을 계속 67건으로 남겨두면 실제 수집 가능한 작품과 산문/장르/권리 검토 항목이 한 칸에 섞인다.
- 그래서 이번 wave는 "모든 후보를 작품으로 수집"이 아니라 "모든 후보의 현재 상태를 확정"하는 방식으로 마감했다.
- `blocked`는 실패가 아니라 후보목록에서 분리해야 할 항목이라는 뜻이다.
- `龍飛御天歌`는 공개 raw가 확인되지만 장편 악장이므로 권1 초두 대표 장만 우선 승격했다.
- `雞林府公館西樓詩序`는 `稼亭集/卷十` raw에서 시 전문을 확인했지만 Donggyeong Japgi 쪽 기존 witness와 병합되어 direct-text 순증은 1건으로 보인다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-99-candidate-exhaustion-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패했다.
  - 첫 오류: `history/history.tsx(2,35): Cannot find module 'react'`
  - 이어서 `../home/components/Navigation`, `../home/components/Footer` 누락과 JSX intrinsic element 타입 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-99-candidate-exhaustion-wave.v1.json`
  - `docs/handoff/2026-04-26-candidate-exhaustion-wave.md`
- 수정:
  - `scripts/build_korean_poet_chronology_catalog.js`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`

# 어디서 멈췄는지

- chronology candidate-only 목록은 0건까지 정리했다.
- 남은 65건은 candidate가 아니라 blocked 검토 근거로 남아 있다.
- 다음 단계는 후보목록 축소가 아니라, 새 작품 수집을 원하면 문집 단위 direct-text wave로 넘어가는 것이다.

# 다음 세션의 첫 행동

1. `docs/spec/korean-poems-chronology.v1.json` summary가 `candidateOnly: 0`, `blocked: 65`인지 확인한다.
2. 새 수집을 계속한다면 candidate residual이 아니라 작가/문집 단위로 잡는다.
   - 예: `退溪先生文集`, `燕巖集`, `五山集`, `湛軒書`, `稼亭集` 같은 공개 raw 문집에서 작품 단위 추출.
3. blocked 65건은 공개 작품 목록에 다시 넣지 말고, 필요한 경우 별도 policy/research queue로 다룬다.

# 다음 세션이 피해야 할 함정

- `blocked`를 "작품 수집 실패"로만 해석하지 말 것. 산문/시조/저작권/중복 후보를 작품 목록에서 분리한 결과다.
- `月印千江之曲`은 raw 전체 추출이 안정되기 전까지 direct-text로 올리지 말 것.
- `花王戒`, `孔方傳`은 한시 작품 카드로 억지 편입하지 말 것.
- `鄭知常 西樓`는 기존 조사상 `栢栗寺西樓` 계열 이칭 가능성이 높으니 별도 exact-title 작품으로 되살리지 말 것.
