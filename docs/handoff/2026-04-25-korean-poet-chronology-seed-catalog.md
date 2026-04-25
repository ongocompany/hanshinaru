---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 한국 시인 연대기형 seed catalog v1
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 한국 한시 수집 방향을 `작품 대량 수집 우선`에서 `시인 연대기 우선`으로 전환하는 조사 문서를 작성했다.
- 새 문서: `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`
- 기존 자료를 재활용했다.
  - `public/index/korean_timeline.json`
  - `docs/research/2026-04-20-korean-hansi-pilot-authors.md`
  - `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`
  - 기존 최치원/정지상/허난설헌 수집 산출물
- 시인을 A/B/C/D 수집 등급으로 나눴다.
  - A: 본편 V1 수집 대상
  - B: V1 또는 V2 후보
  - C: 본편 수집 대상이지만 갈래·전승·원문 형태를 별도 처리해야 하는 대상
  - D: 생애·작품 귀속 또는 원문 접근이 불안정한 보류 대상
- V1/V2/V3 확장 방식을 정리했다.
  - V1: 연대기 대표 화면
  - V2: 문집 단위 확장
  - V3: 선집·지역 문헌·OCR 보강
- 번역/주석 저작권 운영 원칙을 문서화했다.

# 어디서 멈췄는지

- 아직 JSON catalog로 변환하지 않았다.
- 각 시인별 원문 확보 상태와 실제 source URL은 붙이지 않았다.
- 각 작가별 homepage용 600~900자 bio는 아직 작성하지 않았다.

# 핵심 판단과 이유

- 홈페이지가 한시 전문 사이트처럼 보이려면 작가당 작품 수를 작게 고정하지 않는 편이 맞다.
- 대신 작가별로 문학사적으로 의미 있는 작품을 넉넉히 싣되, 수집 순서는 `대표작/핵심작 -> 문집 tranche -> 선집/지역문헌/OCR`로 잡는다.
- 향가·고려가요·설화 속 시문도 한국 고유 형태의 시문으로 보고 수집 대상에 포함한다.
- 다만 한문 정형시와 같은 방식으로 처리하지 않고 `genre`와 원문 표기 방식을 분리한다.
- 한국고전종합DB 번역은 참고용으로만 쓰고, 공개 번역은 직접 번역 또는 권리 확인 번역으로 제한한다.

# 생성/수정/참조한 문서

- 생성: `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`
- 생성: `docs/handoff/2026-04-25-korean-poet-chronology-seed-catalog.md`
- 참조: `docs/research/2026-04-20-korean-hansi-pilot-authors.md`
- 참조: `public/index/korean_timeline.json`
- 참조: `docs/spec/korean-hansi-famous-authors-wave1-batch.v1.json`

# 원래 계획과 달라진 점

- 처음에는 1~3편 대표작 중심으로 생각했지만, 형의 지시에 맞춰 작품 수를 고정하지 않는 방식으로 바꿨다.
- 이번 문서는 즉시 ingest용 JSON이 아니라, 이후 catalog와 수집 큐를 만들기 위한 문학사 seed 문서로 작성했다.

# 다음 세션의 첫 행동

1. `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`의 A급 작가를 JSON catalog로 변환한다.
2. 최치원 32편, 정지상 15편, 허난설헌 파일럿 작품을 새 catalog에 매핑한다.
3. A급 작가별 source plan을 붙인다.
4. 작가별 대표 bio 초안을 작성한다.
5. 번역이 필요한 작품은 `ownedTranslationNeeded=true` queue로 분리한다.

# 다음 세션이 피해야 할 함정

- 향가·시조·가요 중심 인물을 수집 대상에서 제외하지 말 것.
- 다만 한문 한시와 같은 원문/번역 구조로 억지 변환하지 말고, 갈래별 원문 표기와 풀이 방식을 따로 둘 것.
- 한국고전종합DB 번역을 그대로 홈페이지 공개 번역으로 쓰지 말 것.
- 근대 전환기 인물은 저작권을 먼저 확인할 것.
- 작품 귀속이 불확실한 여성/기생 문학은 원문 출처별로 분리할 것.
