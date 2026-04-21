---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 한국 한시 실제 텍스트 수집 15수 파일럿
date: 2026-04-21
author: 태훈
---

# 이번 세션에서 완료한 작업

- 상위 3명(최치원, 정지상, 허난설헌) 범위 안에서 실제 본문이 열리는 위키문헌 페이지를 기준으로 15수 파일럿을 구성했다.
- 새 스크립트 `scripts/build_korean_hansi_text_collection_pilot.js`를 추가했다.
- 추가로 `등윤주자화사`는 한국민족문화대백과 본문 수록 원문/번역을 이용해 보드 후보 텍스트로 교체했다.
- 위키문헌 raw 본문 15개를 `docs/spec/korean-hansi-text-collection-raw/`에 캐시했다.
- 아래 산출물을 생성했다.
  - `docs/spec/korean-hansi-text-collection-pilot.input.v1.json`
  - `docs/spec/korean-hansi-text-collection-pilot.records.v1.json`
  - `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
  - `docs/spec/korean-hansi-text-collection-pilot.source-urls.tsv`
  - `docs/spec/korean-hansi-text-collection-pilot.rights-sheet.tsv`
- 생성된 15건 레코드는 `validate_korean_hansi_records.js` 검증을 통과했다.

# 어디서 멈췄는지

- 실제 텍스트 15건은 확보했지만, 원래 `priority-11 board`가 의도한 “최치원 5 / 정지상 5 / 허난설헌 5” 구조로는 아직 못 갔다.
- 현재 실제 확보 분포:
  - 최치원 4
  - 정지상 1
  - 허난설헌 10
- 보드 후보 커버리지:
  - 최치원 3/5 (`秋夜雨中`, `題伽倻山`, `登潤州慈和寺`)
  - 정지상 1/5 (`送人`)
  - 허난설헌 1개 축(`貧女吟`)만 실제 텍스트 확보
- 따라서 “실제 본문 수집 파일럿”은 성공했지만, “보드 후보 15수와 1:1 대응하는 ingest pilot”은 아직 아니다.

# 핵심 판단과 이유

- 지금 단계에서는 `실제로 페이지가 열리는 텍스트`를 먼저 확보하는 편이 맞다고 판단했다.
- 원래 보드 후보와 100% 일치시키려 하면 바로 수집이 멈춘다.
  - 정지상은 실제 텍스트가 바로 열리는 위키문헌 작품이 `송인` 1수뿐이다.
  - 최치원은 한국어 위키문헌보다 중국 위키문헌 쪽 개별 작품 페이지가 더 잘 열린다.
  - 허난설헌은 실제 텍스트 접근성은 좋지만, 즉시 열리는 작품군이 보드 후보와 정확히 같지는 않다.
- 그래서 이번에는 “실제 수집 성공”을 우선 달성하고, 후보-실수집 불일치 자체를 문제로 분리했다.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-21-korean-hansi-text-collection-pilot.md`
- `docs/spec/korean-hansi-text-collection-pilot.input.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.records.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.source-urls.tsv`
- `docs/spec/korean-hansi-text-collection-pilot.rights-sheet.tsv`
- `docs/spec/korean-hansi-text-collection-raw/` 하위 raw 캐시 15개

## 수정

- `scripts/build_korean_hansi_text_collection_pilot.js`

## 참조

- `docs/spec/korean-hansi-priority-11-board.v1.json`
- `docs/spec/korean-hansi-source-policies.v1.json`
- `docs/spec/korean-hansi-text-collection-pilot.report.v1.json`
- `docs/handoff/2026-04-21-jeong-jisang-korcis-collection-check.md`
- `/Users/jinwoo/Documents/development/llmwiki/docs/kiwix-federation.ko.md`

# 원래 계획과 달라진 점

- 원래는 보드 후보 15수를 그대로 실제 수집까지 밀어붙이려 했지만, 실제 텍스트 접근성 차이 때문에 바로 그렇게는 안 됐다.
- 대신 “상위 3명 실제 접근 가능한 15수 파일럿”으로 우회해서 수집 파이프라인을 먼저 검증했다.

# 다음 세션의 첫 행동

1. `docs/spec/korean-hansi-text-collection-pilot.report.v1.json` 기준으로 미수집 보드 후보를 우선순위화한다.
2. 정지상 `新雪`, `鄕宴致語`, `栢律寺`, `西樓` 실제 본문 소스 확보를 시도한다.
3. 최치원 `登潤州慈和寺`, `江南女`, `鄕樂雜詠` 실제 본문 소스를 추가 확보한다.
4. 허난설헌은 이미 실제 본문 접근이 좋으므로 보드 후보(送荷谷謫甲山, 寄夫讀書江舍, 哭子, 遣興) 쪽으로 맞춰간다.
5. 그 뒤 실제 수집 15수를 보드 후보 15수에 더 가깝게 재구성한다.

# 다음 세션이 피해야 할 함정

- `records` 파일이 있더라도 build/apply를 병렬로 돌리면 예전 입력을 읽을 수 있으니, 최종 생성은 반드시 순차로 할 것
- 이 환경에서는 Node 안에서 직접 DNS가 실패할 수 있으므로, 원문은 raw 캐시를 우선 사용하고 필요하면 셸 `curl`로 보충할 것
- 위키문헌에서 바로 열리는 작품과 보드 후보가 다르다고 해서 수집 자체를 중단하지 말 것
- `등윤주자화사`처럼 EncyKorea article text를 쓰면 실제 텍스트는 확보되더라도 `commercial ready`에서 바로 막힐 수 있으니, Wikisource 기반 수집과 같은 의미로 보면 안 된다
