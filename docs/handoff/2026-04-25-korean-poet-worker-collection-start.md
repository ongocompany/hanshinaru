---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 한국 시인 연대기 worker 병렬 수집 시작
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `04dbc224 [지훈][Docs] Prepare Korean poet worker handoff`와 handoff `docs/handoff/2026-04-25-korean-poet-chronology-json-catalog.md`를 확인했다.
- `gpt-5.4` worker 4개를 병렬로 배치해 작가별 원문 수집 후보를 조사했다.
  - worker 1: 이규보(李奎報)
  - worker 2: 이색(李穡)
  - worker 3: 이제현(李齊賢), 정도전(鄭道傳), 김종직(金宗直)
  - worker 4: 허난설헌(許蘭雪軒)
- worker 결과를 `docs/spec/korean-poet-worker-results/` 아래 4개 JSON으로 저장했다.
- `scripts/validate_korean_poet_worker_results.js`를 추가해 worker 결과 JSON의 필수 형태, 권리값, readiness, source policy 참조를 검사하게 했다.
- `scripts/build_korean_poet_chronology_catalog.js`가 worker 결과 폴더를 읽어 작품 catalog와 public mirror에 반영하도록 확장했다.
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`을 재생성했다.
- `docs/spec/korean-poets-chronology.v1.json`과 `public/index/korean_poets_chronology.v1.json`도 같은 빌드 흐름으로 재생성했다.

# 산출물 요약

- worker 결과 파일: 4개
- worker 결과 작품: 27건
- worker direct-text 확보: 13건
- worker source-located: 13건
- worker blocked: 1건
- 전체 작품 catalog:
  - direct-text 확보: 58건
  - source-located: 13건
  - blocked: 1건
  - candidate-only: 154건
  - totalWorks: 226건

# 핵심 판단과 이유

- worker 결과를 catalog에 직접 손으로 붙이지 않고 build script에 입력으로 연결했다.
- 이유는 다음에 catalog를 재생성해도 worker 수집 결과가 사라지지 않아야 하기 때문이다.
- `source-located`는 원문 전문을 공개 JSON에 넣지 않고 locator와 권리 상태만 남겼다.
- YGC 계열 source는 아직 `korean-hansi-source-policies.v1.json`에 정책이 없어서 `sourcePolicyId=null`, `originalTextUsage=unknown` 상태로 유지했다.
- Wikisource 계열은 `SRC-WIKISOURCE-TEXT`로 표시했고 direct text가 확인된 항목만 `text.poemZh`를 채웠다.

# 생성/수정한 주요 파일

- `docs/spec/korean-poet-worker-results/worker-1-yi-gyubo.v1.json`
- `docs/spec/korean-poet-worker-results/worker-2-yi-saek.v1.json`
- `docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json`
- `docs/spec/korean-poet-worker-results/worker-4-heo-nanseolheon.v1.json`
- `scripts/validate_korean_poet_worker_results.js`
- `scripts/build_korean_poet_chronology_catalog.js`
- `docs/spec/korean-poems-chronology.v1.json`
- `public/index/korean_poems_chronology.v1.json`

# 검증

- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- JSON 참조 검증:
  - public mirror와 docs/spec 기준본 일치
  - 작품 catalog의 모든 `author.authorId`가 시인 catalog에 존재
  - `authorId + title + readiness` 중복 0건
  - worker 항목 27건 반영 확인

# 검증 중 발견한 기존 문제

- `npx tsc --noEmit`은 기존 `scripts/build_general_page.js:469`의 닫히지 않은 template literal 오류로 실패했다.
- 이번 세션에서 새로 만든 수집/검증 스크립트 문법 오류는 없다.

# 어디서 멈췄는지

- worker 1의 `江上曉雨`는 Wikisource에서 exact title locator를 찾지 못해 `blocked`로 남겼다.
- worker 3의 YGC source-located 항목은 source policy가 아직 없으므로 direct text로 승격하지 않았다.
- `東明王篇`, `遣興`, `貧女吟`, `七詠`처럼 연작/장편/compound work 성격이 있는 항목은 다음 병합 정규화 판단이 필요하다.

# 다음 세션의 첫 행동

1. YGC 계열 source policy를 `docs/spec/korean-hansi-source-policies.v1.json`에 추가할지 먼저 판단한다.
2. `source-located` 13건 중 YGC 6건과 Wikisource 7건을 분리해 direct text 승격 가능성을 검토한다.
3. `東明王篇`, `遣興`, `夜坐有感`, `七詠`은 단일 작품 카드와 연작 분할 중 어떤 모델을 쓸지 결정한다.
4. `江上曉雨`는 ITKC/KORCIS 또는 선집 목차에서 권차 locator를 먼저 찾는다.
5. 다음 worker wave는 김시습, 서거정, 이황, 정약용처럼 문집 단위 확장성이 큰 작가로 잡는 것이 좋다.

# 다음 세션이 피해야 할 함정

- `source-located`를 원문 확보 작품처럼 표시하지 말 것.
- YGC 본문은 권리 정책을 확정하기 전까지 `poemZh`에 넣지 말 것.
- 연작을 무조건 한 작품으로 합치거나 무조건 분해하지 말고, 기존 Donggyeong Japgi compound split 경험과 맞춰 판단할 것.
- 기존 dirty worktree의 unrelated 변경을 정리하거나 되돌리지 말 것.
