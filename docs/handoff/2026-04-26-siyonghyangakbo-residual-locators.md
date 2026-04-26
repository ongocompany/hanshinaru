---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Siyonghyangakbo residual locators
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 deep push wave를 커밋했다.
  - commit: `1ccde993 [지훈][Feat] Add marginal voices deep push`
- 남은 candidate-only 13건을 한 번 더 조사했다.
- `時用鄕樂譜` 계열 궁중가요 3건은 국립국악원 국악사전 이미지 페이지로 원문 위치를 고정했다.
  - `城隍飯`: 대표 항목 `https://www.gugak.go.kr/ency/multimedia/view/image/6821`, 세부 이미지 `6879`, `6880`, `6882`, `6886`, `6889`, `6890`, `6891`, `6892`, `6893`
  - `內堂`: 대표 항목 `https://www.gugak.go.kr/ency/multimedia/view/image/6822`, 세부 이미지 `6844`-`6850`
  - `大國`: 대표 항목 `https://www.gugak.go.kr/ency/multimedia/view/image/6827`, 세부 이미지 `6851`, `6852`, `6853`, `6854`, `6856`, `6857`
- 새 worker 결과를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-25-siyonghyangakbo-residual-locators.v1.json`
- chronology catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 148명
- direct-text 확보: 1616건
- source-located: 3건
- blocked: 65건
- candidate-only: 10건
- totalWorks: 1629건
- workerResultWorks: 1579건

# 더 파본 결과

- `조선여류한시선집` 목차에는 서영수합 `겨울밤에`, `맑은 밤에`, `애별`과 김호연재 `옛 마을`이 보인다.
- 하지만 ko Wikisource API 확인 결과 해당 개별 subpage는 missing 상태였다.
- 안평대군 `夢遊桃源圖詩`, `匪懈堂集`은 공개 Wikisource 검색에서 실제 원문시 페이지가 확인되지 않았다.
- `時用鄕樂譜`는 디지털집현전/국악사전/민족문화대백과에서 목록과 해설은 확인되지만, 텍스트 원문은 이미지 기반이라 direct-text 수집으로 바로 올리지 않았다.

# 어디서 멈췄는지

남은 candidate-only 10건은 자동 direct-text 수집 기준으로는 현재 막혔다.

- 안평대군: `夢遊桃源圖詩 관련`, `匪懈堂集 수록시`, `서화 제영시`
- 김호연재: `浩然齋遺稿 수록시`, `수양시`, `생활시`
- 서영수합: `令壽閣詩稿 수록시`, `규방시`, `교유시`
- 조선 궁중가요 무명씨: `궁중 악장·무속가요 후보`

# 핵심 판단과 이유

- `城隍飯`, `內堂`, `大國`은 원문 이미지 위치가 명확하므로 candidate-only로 남기기보다 source-located가 더 정확하다.
- 다만 이미지 전사와 저작권 정책 검토가 필요하므로 direct-text-collected로 승격하지 않았다.
- 여성 시인 잔여분은 선집 목차만으로는 원문 확보가 아니므로 보수적으로 candidate-only에 남겼다.
- 안평대군은 그림 해설과 관련 문헌 설명이 검색에 많이 잡히지만, 실제 작품 원문 witness는 아직 확정하지 못했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-25-siyonghyangakbo-residual-locators.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 다음 세션의 첫 행동

1. `時用鄕樂譜` 이미지 3건은 OCR보다 먼저 사람이 볼 수 있는 전사 기준을 정한다.
2. 전사가 가능하면 `source-located` 3건을 direct-text로 승격한다.
3. 김호연재/서영수합은 ko Wikisource 말고 별도 영인본, 국역본, 논문 부록, 지역문화 자료를 찾아야 한다.
4. 안평대군은 `匪懈堂集` 실물/영인본 또는 `夢遊桃源圖詩` 원문 수록처를 먼저 확정한다.

# 종료 선언

공개 raw 텍스트에서 바로 추가 direct-text로 올릴 수 있는 후보는 이번 세션 기준으로 더 확인되지 않았다. 다음 진전은 이미지 전사, OCR, 또는 별도 문헌 접근이 필요하다.
