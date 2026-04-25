---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 김종직 七詠 and 허난설헌 연작 compound split
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `0f41295d [지훈][Feat] Add YGC policy and promote source texts`와 handoff `docs/handoff/2026-04-25-ygc-policy-and-source-located-review.md`를 확인했다.
- 열린 PR이 없음을 확인했다.
- `docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json`에서 김종직 `七詠` 단일 source-located 항목을 7개 하위 작품으로 분리했다.
- 분리한 작품:
  - `會蘇曲`
  - `憂息曲`
  - `鴟述嶺`
  - `怛忉歌`
  - `陽山歌`
  - `碓樂`
  - `黃昌郞`
- 7개 작품 모두 `SRC-WIKISOURCE-TEXT` 기준 `direct-text-collected`로 승격했다.
- `docs/spec/korean-poet-worker-results/worker-4-heo-nanseolheon.v1.json`에서 허난설헌 `貧女吟`과 `遣興`도 연작 구조에 맞춰 분리했다.
- `貧女吟`은 3수, `遣興`은 8수로 나누고 모두 `SRC-WIKISOURCE-TEXT` 기준 `direct-text-collected`로 승격했다.
- 허난설헌 `春雨`는 standalone 제목이 아니라 첫 구 기반 후보라 계속 `source-located`로 보류했다.
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`을 재생성했다.

# 핵심 판단과 이유

- `七詠`은 단일 제목 아래 이어지는 7수 연작이지만, Donggyeong Japgi 때의 compound split 원칙과 맞춰 하위 작품 단위로 공개 catalog에 넣는 편이 더 좋다.
- Wikisource `新增東國輿地勝覽/卷021` raw에서 7개 표제와 본문이 연속으로 확인되고, 기존 source policy `SRC-WIKISOURCE-TEXT`가 적용 가능하므로 YGC 보류 항목과 달리 본문 공개가 가능하다.
- `陽山歌`의 `糧/粻` 이형은 Wikisource 교감 표기에 따라 본문 표기는 `糧`로 두고 notes에 정규화 이유를 남겼다.
- `蘭雪軒詩集` raw에서 `貧女吟`은 본표제 1수와 `又` 2수, `遣興`은 본표제 1수와 `又` 7수로 경계가 분명하다.
- 다만 `春雨`는 같은 standalone 표제가 아니라 `春雨梨花白...`, `春雨暗西池...`처럼 첫 구에 들어가는 형태라 이번 승격 대상에서 제외했다.

# 현재 catalog 상태

- direct-text 확보: 78건
- source-located: 8건
- blocked: 1건
- candidate-only: 154건
- totalWorks: 241건
- workerResultWorks: 42건

# 검증

- `node -e "JSON.parse(require('fs').readFileSync('docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json','utf8')); console.log('worker3 json ok')"`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- public mirror와 docs/spec 기준본 일치 확인
- `七詠` 하위 7작품 모두 `direct-text-collected` 및 `poemZh` 보유 확인
- 허난설헌 `貧女吟` 3작품과 `遣興` 8작품 모두 `direct-text-collected` 및 `poemZh` 보유 확인
- `authorId + title + readiness` 중복 0건 확인

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류 `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.` 때문에 실패한다.
- 이 오류는 이전 handoff에도 기록된 기존 문제이며, 이번 `七詠` catalog 수정과는 별개다.

# 다음 세션의 첫 행동

1. 허난설헌 `春雨`는 standalone 제목이 아니라 첫 구 기반 후보라서 어느 작품을 seed title로 볼지 확정한다.
2. `東明王篇 幷序`는 장편 작품 카드로 둘지, 서문과 본문을 나눌지 결정한다.
3. `江上曉雨`는 ITKC/KORCIS 또는 선집 목차에서 권차 locator를 먼저 찾는다.
4. YGC 6건은 공개 본문 승격 전 별도 권리 근거 또는 대체 공개 판본을 찾는다.

# 다음 세션이 피해야 할 함정

- `七詠`을 다시 단일 카드로 되돌리지 말 것. 이번 세션에서 compound split 기준으로 catalog를 이미 재생성했다.
- YGC 6건은 계속 source-located로 유지할 것. 공개 본문 승격은 별도 권리 근거가 생긴 뒤에 한다.
- 허난설헌 `貧女吟`과 `遣興`은 이번 세션에서 이미 분할했다. 다시 source-located 단일 항목으로 되돌리지 말 것.
- 허난설헌 `春雨`는 title만 보고 곧장 direct-text로 올리지 말고, seed title이 어느 incipit을 가리키는지 먼저 확인할 것.
