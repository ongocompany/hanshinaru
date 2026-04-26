---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Marginal voices deep push
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 커밋과 핸드오프를 확인했다.
  - latest commit: `b960e7fd [지훈][Feat] Add marginal voices supplement wave`
  - previous handoff: `docs/handoff/2026-04-26-marginal-voices-supplement-wave.md`
- 이전 worker-23의 source-located 4건을 direct-text로 승격했다.
  - `청산별곡`, `서경별곡`, `동동`, `쌍화점`
  - 주석, 설명문, 현대어 번역은 제외하고 원문 본문만 남겼다.
- 새 worker 결과를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-24-marginal-voices-deep-push.v1.json`
- 새 worker-24에서 248건을 direct-text로 수집했다.
  - 월산대군 `風月亭集/卷之一`: 235건
  - 삼의당 김씨 `조선여류한시선집`: 4건
  - 김금원 `海東艷史`: 3건
  - 김부용 `조선여류한시선집`: 4건
  - 이옥봉 `海東艷史`: 2건
- `滕王閣序集字八首`는 8수 split 작품으로 수집하되, 첫 split 항목의 `candidateTitle`을 원래 후보명에 연결해 candidate-only가 남지 않게 했다.
- chronology catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 148명
- direct-text 확보: 1616건
- source-located: 0건
- blocked: 65건
- candidate-only: 13건
- totalWorks: 1629건
- workerResultWorks: 1576건

# 어디서 멈췄는지

남은 candidate-only 13건은 공개 위키문헌 raw만으로 바로 확인되지 않은 층이다.

- 안평대군: `夢遊桃源圖詩 관련`, `匪懈堂集 수록시`, `서화 제영시`
- 김호연재: `浩然齋遺稿 수록시`, `수양시`, `생활시`
- 서영수합: `令壽閣詩稿 수록시`, `규방시`, `교유시`
- 조선 궁중가요 무명씨: `城隍飯`, `內堂`, `大國`, `궁중 악장·무속가요 후보`

# 핵심 판단과 이유

- 이번 wave는 여성 시인과 작자 미상 가요, 종친 문학 보완이 목적이었다.
- 고려가요 4건은 이미 raw 위치가 확인되어 있었고, 본문만 정리하면 바로 direct-text로 승격 가능한 상태였다.
- 월산대군은 `風月亭集/卷之一` raw가 안정적으로 열려 단일 source family에서 큰 수량을 확보할 수 있었다.
- `조선여류한시선집`은 김억 번역이 섞여 있으므로 catalog `text.poemZh`에는 한문 원시 줄만 분리했다.
- 김호연재/서영수합 일부는 목차에는 보이지만 개별 subpage가 없거나 원문 위치가 불충분해 이번에는 candidate-only로 남겼다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-24-marginal-voices-deep-push.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `rg -n '&#[0-9]+;|Wikimedia Error|Not Found|<ref|<poem' docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json docs/spec/korean-poet-worker-results/worker-24-marginal-voices-deep-push.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo-wide React/JSX 설정 문제로 실패한다.
  - 첫 오류: `history/history.tsx(2,35): Cannot find module 'react'`
  - 이어서 `../home/components/Navigation`, `../home/components/Footer` 누락과 JSX intrinsic element 타입 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 보강과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-24-marginal-voices-deep-push.v1.json`
  - `docs/handoff/2026-04-26-marginal-voices-deep-push.md`
- 수정:
  - `docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 참조:
  - `docs/handoff/2026-04-26-marginal-voices-supplement-wave.md`
  - `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`

# 다음 세션의 첫 행동

1. 안평대군은 `匪懈堂集` 또는 `夢遊桃源圖詩` 원문 witness를 먼저 확정한다.
2. 김호연재는 `浩然齋遺稿` 원문 소장/DB 경로를 찾고, 단순 선집 목차만으로는 direct-text 승격하지 않는다.
3. 서영수합은 `令壽閣詩稿` 또는 개별 원시 페이지가 열리는지 다시 확인한다.
4. 조선 궁중가요 무명씨는 `時用鄕樂譜` 계열 원문 이미지/텍스트를 찾아야 한다. 글로벌 백과 설명문만으로는 본문 수집하지 않는다.

# 다음 세션이 피해야 할 함정

- `조선여류한시선집`의 번역문을 원문으로 섞지 말 것.
- `風月亭集`의 내부 heading을 무시해 `滕王閣序集字八首` 같은 복합 작품을 한 덩어리로만 처리하지 말 것.
- 안평대군은 그림 해설 자료가 많아 원문시가 아닌 설명문이 섞이기 쉽다.
- 궁중가요 후보는 음악사 설명문과 실제 가사 원문을 구분해야 한다.
