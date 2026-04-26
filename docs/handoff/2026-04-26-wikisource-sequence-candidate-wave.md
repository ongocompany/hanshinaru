---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Wikisource sequence candidate reduction wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- compact 이후 같은 목표로 candidate-only 축소와 direct-text 작품 수 확장을 이어갔다.
- 새 worker 결과를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-22-wikisource-sequence-residual-wave.v1.json`
- 공개 Wikisource raw에서 35건을 direct-text로 추가했다.
  - 균여 `普賢十願歌` 하위 11수
  - 최치원 `鄕樂雜詠` 5수
  - 박인범 `涇州龍朔寺閣兼柬雲栖上人` 1수
  - 최광유 `御溝` 1수
  - 오세재 `次韻金無迹見贈` 1수
  - 정약용 `耽津村謠` 15수, `哀絶陽` 1수

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 1350건
- source-located: 0건
- blocked: 0건
- candidate-only: 67건
- totalWorks: 1417건
- workerResultWorks: 1244건
- Donggyeong Japgi imported works: 61건
- Donggyeong Japgi source variants: 33건

# 핵심 판단과 이유

- 직전 커밋 기준은 direct-text 1316건, candidate-only 74건이었다.
- 이번 worker는 35건을 추가했고 candidate-only는 7건 줄었다.
- `普賢十願歌`와 `耽津村謠`처럼 한 후보가 여러 하위 작품을 품는 경우에는 하위 작품을 개별 작품으로 분할했다.
- `鄕樂雜詠`도 `金丸`, `月顚`, `大面`, `束毒`, `狻猊` 5수로 분할했다.
- `Donggyeong Japgi` imported work 수가 62에서 61로 줄고 source variant가 32에서 33으로 늘었다. 이는 새 worker의 direct-text가 기존 Donggyeong import 1건과 병합되어 중복 작품 하나가 witness로 흡수된 결과로 보이며, direct-text 손실은 아니다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-22-wikisource-sequence-residual-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패했다.
  - 첫 오류: `history/history.tsx(2,35): Cannot find module 'react'`
  - 이어서 `../home/components/Navigation`, `../home/components/Footer` 누락, JSX intrinsic element 타입 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 이번 세션에서 발견한 문제

- Wikimedia raw를 user-agent 없이 연속 호출하면 429가 발생한다. 이후 호출은 `hanshinaru-codex/1.0` user-agent를 붙여 확인했다.
- `月印千江之曲`, `龍飛御天歌`는 ko Wikisource에 항목은 있지만 원문이 `<pages>` transclusion 중심이라 raw에서 안정적인 전체 텍스트를 바로 확보하기 어렵다.
- `花王戒`, `孔方傳`은 후보로 남아 있으나 시 작품으로 넣기 어렵다. 특히 `孔方傳`은 산문 후보로 보아야 한다.
- `鄭知常 西樓` 후보는 검색 중 `東文選/卷十九`의 `西樓觀雪`, `西樓晚望`이 잡히지만 해당 구간 저자는 `金克己`로 이어져 정지상 후보로 넣으면 안 된다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-22-wikisource-sequence-residual-wave.v1.json`
  - `docs/handoff/2026-04-26-wikisource-sequence-candidate-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`

# 어디서 멈췄는지

- candidate-only는 67건 남았다.
- 남은 후보 중 바로 처리 가능한 공개 raw 후보는 빠르게 줄어들고 있다.
- 남은 후보는 다음 성격이 많다.
  - 문집 원문 위치를 더 찾아야 하는 제목 넓은 후보
  - 산문 또는 장편 악장이라 시 catalog에 넣을지 판단이 필요한 후보
  - Wikisource raw가 transclusion 또는 이미지 중심인 후보
  - 근대 저작권 주의가 필요한 후보

# 다음 세션의 첫 행동

1. `東文選`에서 남은 고려 전기/중기 후보를 더 훑는다.
   - 최승우, 예종, 이규보 제야시, 진화 제야시, 최자 후보부터 검색한다.
2. `月印千江之曲`, `龍飛御天歌`는 raw 전체 원문 확보가 어려우므로, 텍스트 추출 방식이 안전할 때만 넣는다.
3. 산문 후보인 `花王戒`, `孔方傳`은 direct-text 작품으로 억지 편입하지 말고 blocked/제외 정책을 별도로 정한다.

# 다음 세션이 피해야 할 함정

- 제목만 보고 author context를 건너뛰지 말 것. `西樓觀雪`, `西樓晚望`은 정지상이 아니라 김극기 구간이었다.
- ko Wikisource의 번역문은 수집하지 말고 원문만 수집할 것.
- `<pages>` transclusion만 있는 항목을 direct-text-collected로 처리하지 말 것.
- sequence 후보는 큰 후보명은 `candidateTitle`, 실제 하위 작품명은 `matchedTitle`로 두어 seed 후보 제거와 작품 분할을 동시에 만족시킬 것.
