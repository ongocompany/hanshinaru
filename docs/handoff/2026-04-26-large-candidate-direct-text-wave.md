---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Large candidate author direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `38cf927c [지훈][Feat] Add Kim Byeongyeon Jeongjo Hyomyeong wave` 이후 상태에서 후보작가·작품 목록 보강을 이어갔다.
- 새 worker 파일 2개를 만들었다.
  - `docs/spec/korean-poet-worker-results/worker-15-yangchon-nammyeong-jeongildang-songgang-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-16-maewoldang-seokju-nongam-samyeon-wave.v1.json`
- zh Wikisource 공개 raw 기준으로 direct-text 236건을 추가했다.
  - worker-15: 권근 24, 조식 24, 강정일당 24, 정철 24
  - worker-16: 김시습 20, 권필 20, 이현보 20, 김창협 20, 김창흡 20, 송순 20, 신흠 20
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 962건
- source-located: 0건
- blocked: 0건
- candidate-only: 126건
- totalWorks: 1088건
- workerResultWorks: 855건

# 핵심 판단과 이유

- 이번 세션은 남은 후보를 무리하게 전부 direct-text로 승격하지 않았다.
- `燕巖集`, `湛軒書`처럼 공개 원문은 확인되지만 산문·편지·서문 중심인 권은 바로 시 catalog에 넣지 않았다.
- worker-16은 생성 후 자체 재검토에서 긴 `序` 성격 항목이 섞이는 위험을 확인했고, `序/賦` 성격의 긴 산문성 항목을 빼도록 다시 생성했다.
- 이번 wave의 목표는 후보 줄을 실제 작품명과 원문으로 확장하는 것이며, 남은 후보는 개별 장르 확인이 필요한 항목이다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-15-yangchon-nammyeong-jeongildang-songgang-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-16-maewoldang-seokju-nongam-samyeon-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo 상태 때문에 실패한다.
  - 첫 오류는 `history/history.tsx`의 `Cannot find module 'react'`, `../home/components/Navigation`, `../home/components/Footer` 누락이다.
  - 이후 JSX 타입과 암시적 `any` 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-15-yangchon-nammyeong-jeongildang-songgang-wave.v1.json`
  - `docs/spec/korean-poet-worker-results/worker-16-maewoldang-seokju-nongam-samyeon-wave.v1.json`
  - `docs/handoff/2026-04-26-large-candidate-direct-text-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-kim-byeongyeon-jeongjo-hyomyeong-wave.md`
  - `陽村先生文集/卷一?action=raw`
  - `南冥先生集/卷一?action=raw`
  - `靜一堂遺稿?action=raw`
  - `松江集/卷一?action=raw`
  - `梅月堂集/卷三?action=raw`
  - `石洲集/卷二?action=raw`
  - `聾巖集/卷一?action=raw`
  - `農巖集/卷一?action=raw`
  - `三淵集/卷七?action=raw`
  - `俛仰集/卷之一?action=raw`
  - `象村稿/卷三?action=raw`

# 어디서 멈췄는지

- 후보-only는 126건 남았다.
- 남은 상위 후보 묶음은 김부식 3건, 이황 3건, 정서·이인로·임춘·김극기·최자·이제현·이곡·원천석·정도전 등 각 2건이다.
- 공개 원문이 있는 산문 권은 확인했지만, 시 catalog에 넣기 전 작품 성격 검토가 필요하다.

# 다음 세션의 첫 행동

1. 남은 후보 126건을 `직접 수집 가능`, `시문이지만 산문성 강함`, `고유시가/전승 처리`, `저작권/근대 검토` 네 묶음으로 나눈다.
2. direct-text 가능성이 큰 `保閑齋集`, `藫庭遺藁`, `燕巖集`, `湛軒書`는 제목 단위로 시인지 산문인지 먼저 판별한다.
3. 이황 `退溪集` 계열은 zh Wikisource 검색이 잘 빗나가므로 한국고전종합DB/KORCIS 쪽 locator를 먼저 잡는다.

# 다음 세션이 피해야 할 함정

- 공개 원문이 있다고 해서 모두 시로 넣지 말 것. `序`, `記`, `書` 중심 권은 catalog를 오염시킬 수 있다.
- `candidateTitle`은 기존 seed 후보명과 정확히 맞아야 candidate-only fallback이 제거된다.
- 대량 생성 후에는 긴 본문과 산문성 heading을 반드시 샘플링해서 확인할 것.
