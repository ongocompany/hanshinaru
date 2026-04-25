---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 동경잡기 본 DB 1차 병합과 장편 서사시 처리
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `574dc03f [지훈][Docs] Handoff Donggyeong DB import plan`과 handoff `docs/handoff/2026-04-25-donggyeong-db-inclusion-and-yi-i-closeout.md`를 확인했다.
- `scripts/build_korean_poet_chronology_catalog.js`에 동경잡기 bundle import 단계를 추가했다.
- `docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json`의 작품 94편 중 기존 seed 시인 한자명과 매칭되는 44편만 1차 처리했다.
- 44편 중 새 작품 28편은 `korean-poems-chronology`에 direct-text 작품으로 추가했다.
- 44편 중 기존 작품과 같은 제목 또는 같은 본문으로 판단되는 16건은 새 작품으로 만들지 않고 기존 작품의 `sourceVariants`에 동경잡기 수록본으로 붙였다.
  - 김종직 `七詠` 계열 7건은 기존 worker direct-text 작품의 collection witness로 처리했다.
  - `鵄述嶺`/`鴟述嶺` 표기 차이는 같은 제목으로 비교하도록 보정했다.
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`을 재생성했다.
- `docs/spec/korean-poets-chronology.v1.json`과 `public/index/korean_poets_chronology.v1.json`도 같은 빌더 출력으로 동기화했다.
- 형의 지시에 따라 최신 handoff보다 한 단계 전 커밋과 handoff도 다시 확인했다.
  - `0a8e726c [지훈][Feat] Add Yi I Jeong Cheol Gwon Pil wave`
  - `docs/handoff/2026-04-25-yi-i-jeong-cheol-gwon-pil-worker-wave.md`
  - `docs/handoff/2026-04-25-kim-jongjik-qiyeong-compound-split.md`
- 이전 handoff에서 멈춘 `江上曉雨`와 `春雨`를 direct-text로 승격했다.
  - `江上曉雨`: ko Wikisource `강상효우` 개별 page에서 원문과 독음을 재확인했다.
  - `春雨`: ko Wikisource `조선여류한시선집/봄비` 개별 page에서 `春雨暗西池` 본문을 재확인했다.
- `東明王篇 幷序`는 전례를 찾아본 뒤 하나의 작품 row로 유지하고 내부 `textParts`를 두는 방식으로 direct-text 승격했다.
  - 참고 전례: 우리역사넷은 `東明王篇`을 서문과 282구 본시로 이루어진 약 4000자 장편 서사시로 설명한다.
  - 참고 전례: KCI 논문 `<동명왕편(東明王篇)>의 서술 체계와 인물 형상`은 서장/본장/종장 구조를 기준으로 분석한다.
  - 참고 전례: 국립중앙도서관 영상 전시는 주요 장면 8장으로 구성했다.
- `東明王篇 幷序`의 `textParts`는 9구간이다.
  - `preface`
  - `intro-sacred-kings`
  - `haemosu-descent`
  - `yuhwa-habaek`
  - `jumong-birth-growth`
  - `escape-and-river-crossing`
  - `founding-and-songyang`
  - `ascension-and-yuri`
  - `conclusion-author-reflection`

# 현재 catalog 상태

- direct-text 확보: 146건
- source-located: 6건
- blocked: 0건
- candidate-only: 143건
- totalWorks: 295건
- workerResultWorks: 79건
- donggyeongJapgiMatchedBlocks: 44건
- donggyeongJapgiImportedWorks: 28건
- donggyeongJapgiSourceVariants: 16건

# 전체 맥락

- 현재 큰 작업축은 한국 한시/고전시문을 시인 연대기형 catalog로 정리하는 것이다.
- seed author는 97명이고, 작품 catalog는 `docs/spec/korean-poems-chronology.v1.json`을 기준본으로, `public/index/korean_poems_chronology.v1.json`을 사이트 fetch용 mirror로 둔다.
- worker 결과는 `docs/spec/korean-poet-worker-results/*.json`이 입력이고, `scripts/build_korean_poet_chronology_catalog.js`가 seed/direct/worker/donggyeong import를 합쳐 catalog를 재생성한다.
- 이번 세션 이전의 실제 중단점은 단순히 동경잡기 DB 병합이 아니라, worker wave에서 남은 `source-located`/`blocked` 항목 해소였다.
- 이번 세션에서 그 흐름을 이어 `江上曉雨`, `春雨`, `東明王篇 幷序`를 direct-text로 올렸고, 이제 blocked는 0건이다.
- 남은 source-located 6건은 YGC 계열이다.
  - 이제현 `小樂府`
  - 이제현 `題長安逆旅`
  - 이제현 `寄題白花禪院觀空樓次韻`
  - 정도전 `關山月`
  - 정도전 `秋夜`
  - 정도전 `文德曲`
- YGC는 본문 위치 확인에는 유용하지만, 이용약관/저작권 정책 URL이 안정적이지 않아 공개 본문 승격은 아직 보류한다.
- 동경잡기 쪽은 기존 seed 시인 44편 1차 반영을 끝냈고, 미등록 시인 35명/50편은 seed author row를 만든 뒤 2차 반영해야 한다.

# 핵심 판단과 이유

- 동경잡기 94편 전체를 바로 넣지 않고, 기존 seed author와 한자명이 매칭되는 44편만 먼저 반영했다.
- 같은 제목 또는 같은 본문이 이미 있으면 새 row를 만들지 않았다. 특히 김종직 `七詠`은 같은 작품의 다른 수록본 성격이 강하므로 `sourceVariants`에 동경잡기 witness를 붙이는 편이 안전하다.
- 미등록 시인 35명 50편은 아직 본 DB에 넣지 않았다. author seed row를 먼저 만든 뒤 2차 승격해야 한다.
- `江上曉雨`는 기존 worker에서는 blocked였지만, 예전 pilot 산출물에 남은 ko Wikisource 개별 page가 실제로 살아 있어 direct-text로 올리는 편이 맞다.
- `春雨`는 `蘭雪軒詩集` collection 안에서는 seed title이 모호했지만, `조선여류한시선집/봄비` 개별 page가 같은 원문을 직접 제공하므로 seed title `春雨`의 direct-text로 처리했다. 번역문은 worker 결과에 넣지 않고 원문과 독음만 보존했다.
- `東明王篇 幷序`는 `七詠`과 다르다. 독립 하위 표제가 있는 연작이 아니라 하나의 장편 서사시이므로, 여러 작품으로 쪼개지 않고 한 작품 내부의 구간으로 나누는 편이 맞다.
- `poemZh`에는 기존 호환을 위해 순수 원문 전체를 넣고, 실제 화면/번역/해설 작업은 `text.textParts`를 우선 쓰는 방식이 안전하다.

# 검증

- `node scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `curl -L --max-time 20 -s 'https://ko.wikisource.org/wiki/%EA%B0%95%EC%83%81%ED%9A%A8%EC%9A%B0?action=raw'`
- `curl -L --max-time 20 -s 'https://ko.wikisource.org/wiki/%EC%A1%B0%EC%84%A0%EC%97%AC%EB%A5%98%ED%95%9C%EC%8B%9C%EC%84%A0%EC%A7%91/%EB%B4%84%EB%B9%84?action=raw'`
- `curl -L --max-time 20 -s 'https://zh.wikisource.org/w/index.php?title=%E6%9D%B1%E5%9C%8B%E6%9D%8E%E7%9B%B8%E5%9C%8B%E5%85%A8%E9%9B%86/%E5%8D%B7%E4%B8%89&action=raw'`
- `node -e` catalog spot check: `東明王篇 幷序` direct-text, `장편 서사시`, `textParts` 9건 확인
- `git diff --check -- scripts/build_korean_poet_chronology_catalog.js docs/spec/korean-poet-worker-results/worker-1-yi-gyubo.v1.json docs/spec/korean-poet-worker-results/worker-4-heo-nanseolheon.v1.json docs/spec/korean-poems-chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poems_chronology.v1.json public/index/korean_poets_chronology.v1.json docs/handoff/2026-04-25-donggyeong-db-import-phase1.md`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류로 실패한다.
  - `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.`
  - 이번 동경잡기 import 변경 파일과 직접 관련된 오류는 아니다.

# 다음 세션의 첫 행동

1. 이 커밋의 변경 범위를 확인한다.
   - `git show --stat --format=fuller HEAD`
   - `docs/handoff/2026-04-25-donggyeong-db-import-phase1.md`
2. `textParts`를 실제 화면/번역/현토 파이프라인에서 어떻게 우선 사용할지 확인한다.
3. YGC 6건은 계속 source-located로 두되, 대체 공개 판본이 있는지 먼저 찾는다.
4. 미등록 동경잡기 시인 35명에 대한 seed author row 초안을 만든다.
5. seed row를 추가한 뒤 남은 50편을 2차 import 대상으로 분리한다.
6. 2차 import에서도 같은 제목/본문은 `sourceVariants`로 붙이고, 새 작품만 direct-text로 추가한다.

# 다음 세션이 피해야 할 함정

- `tokyo-zakki` 명칭을 되살리지 말 것. 공개 표면과 slug는 `동경잡기(東京雜記) / Donggyeong Japgi / donggyeong-japgi`가 맞다.
- 김종직 `七詠`처럼 이미 다른 기준본으로 들어온 작품을 새 작품으로 중복 생성하지 말 것.
- 미등록 시인 50편을 author row 없이 바로 작품 catalog에 넣지 말 것.
- `東明王篇 幷序`를 `textParts` 없이 여러 작품으로 임의 분할하지 말 것. 작품 정체성은 하나이고, 구간은 내부 구조다.
- 기존 dirty worktree의 unrelated 변경은 되돌리지 말 것.
