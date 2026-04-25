---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 동경잡기(東京雜記) 전권 수집과 문헌-작품 이중 모델 전환
date: 2026-04-24
author: 태훈
---

# 이번 세션에서 완료한 작업

- `西樓` 단일 표제 추적에서 벗어나 `동경잡기(東京雜記)`를 권차 단위 대량 수집 대상으로 전환했다.
- 문헌명 표기는 `동경잡기(東京雜記) / Donggyeong Japgi`가 맞고, `donggyeong-japgi`는 내부 canonical slug로만 취급한다.
- `동경잡기(東京雜記) 卷一`, `卷二`, `卷三` 공개 raw 원문을 기준으로 권차별 수확기를 만들고 실제 산출을 생성했다.
- 수집 구조를 `시만 분리`하는 방식이 아니라 `문헌 층 + 작품 층` 이중 모델로 바꿨다.
  - 문헌 층: 권차, section, 항목 원문 보존
  - 작품 층: 시문/가요 후보를 문헌 항목을 가리키는 파생 자산으로 분리
- `동경잡기(東京雜記)` 1~3권 전권 묶음을 생성했다.
  - 문헌 section `50`
  - 문헌 항목 `913`
  - 시문 후보 `91`
  - 설명문/기문 맥락 `7`
- 전권 묶음을 기준으로 `시인별 보기` 산출을 추가했다.
  - 정리 저자 `55명`
  - 상위 시인: `魚世謙 12`, `徐居正 10`, `金克己 9`
- 전권 결과에서 `검수 대기열`도 분리했다.
  - 본문 복원 추가 검수 `5건`
  - 저자 표기 낮은 신뢰 `9건`
  - 이 중 비인명 표기 유력 `8건`
- 설명 언어 규칙도 `AGENTS.md`에 반영했다.
  - 코드/파일명/디렉토리/식별자는 영문 유지
  - 그 외 개념/로직/용어/진행 보고는 한국어 우선

# 어디서 멈췄는지

- `동경잡기(東京雜記)` 1~3권에 대해서는
  - 문헌 보존
  - 작품 후보 분리
  - 전권 묶음
  - 시인별 보기
  - 검수 대기열
  까지 끝난 상태다.
- 아직 안 끝난 건 `검수 대기열` 처리다.
  - 본문 복원 `5건`
  - 저자 표기 정리 `9건`
- 이 검수 대기열을 정리한 뒤에야 `정식 작품 후보` 승격과 `東文選` 확장으로 넘어가는 것이 자연스럽다.

# 핵심 판단과 이유

- `작품 한 편 찾기` 방식은 너무 느리다.
  - 따라서 `문헌 한 권 통째로 수확`하는 방식으로 전환했다.
- `동경잡기(東京雜記)`는 권마다 성격이 다르다.
  - `卷一`: 혼합형
  - `卷二`: 항목 밑 시문 부착형
  - `卷三`: `題詠` 집중형
  - 따라서 `권차별 수확 -> 전권 묶음`이 맞다.
- `동경잡기(東京雜記)` 같은 문집/잡기는 연구자료 가치가 크므로 시만 남기고 버리면 안 된다.
  - 문헌 층을 함께 보존해야 나중에
    - 작품 재분리
    - OCR 대조
    - 이본 비교
    - 설명문/기문 활용
    이 가능하다.
- 현재 전권 합계가 `92 -> 91`로 줄어든 이유는
  - `處容歌` 같은 서사성 항목 1건을 시문에서 문맥 쪽으로 재분류했기 때문이다.
  - 따라서 현재 숫자 `91 시문 / 7 문맥`이 최신 기준이다.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-24-donggyeong-japgi-document-work-pipeline.md`
- `docs/spec/2026-04-23-korean-classical-document-work-model.md`
- `docs/spec/2026-04-23-korean-hansi-donggyeong-japgi-vol1-poem-harvest.md`
- `docs/spec/2026-04-23-korean-hansi-donggyeong-japgi-vol2-poem-harvest.md`
- `docs/spec/2026-04-23-korean-hansi-donggyeong-japgi-vol3-poem-harvest.md`
- `docs/spec/2026-04-23-korean-classics-donggyeong-japgi-collection-bundle.md`
- `docs/spec/2026-04-24-korean-classics-donggyeong-japgi-author-view.md`
- `docs/spec/2026-04-24-korean-classics-donggyeong-japgi-review-queue.md`
- `docs/spec/korean-hansi-donggyeong-japgi-vol1-poem-harvest.v1.json`
- `docs/spec/korean-hansi-donggyeong-japgi-vol2-poem-harvest.v1.json`
- `docs/spec/korean-hansi-donggyeong-japgi-vol3-poem-harvest.v1.json`
- `docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json`
- `docs/spec/korean-classics-donggyeong-japgi-author-view.v1.json`
- `docs/spec/korean-classics-donggyeong-japgi-review-queue.v1.json`
- `docs/spec/korean-hansi-donggyeong-japgi-vol1-raw/`
- `docs/spec/korean-hansi-donggyeong-japgi-vol2-raw/`
- `docs/spec/korean-hansi-donggyeong-japgi-vol3-raw/`
- `scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js`
- `scripts/build_korean_classics_donggyeong_japgi_collection_bundle.js`
- `scripts/build_korean_classics_donggyeong_japgi_author_view.js`
- `scripts/build_korean_classics_donggyeong_japgi_review_queue.js`

## 수정

- `AGENTS.md`
- `package.json`
- `docs/spec/2026-04-20-korean-hansi-data-model.md`

## 참조

- `docs/handoff/2026-04-21-korean-hansi-text-collection-pilot.md`
- `docs/handoff/2026-04-21-jeong-jisang-tranche1-and-wave1-progress.md`
- `docs/research/2026-04-23-jeong-jisang-seoru-locator-check.md`
- `docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json`
- `docs/spec/korean-classics-donggyeong-japgi-author-view.v1.json`
- `docs/spec/korean-classics-donggyeong-japgi-review-queue.v1.json`

# 원래 계획과 달라진 점

- 원래는 `西樓` 한 건 locator를 찾는 쪽으로 너무 좁게 가고 있었다.
- 실제로는 `한국 고전 문헌/시집 디지털화`가 목표라는 점을 반영해
  - `단일 표제 추적`
  에서
  - `문헌 전권 수집 + 작품 파생`
  구조로 전환했다.
- 따라서 기존 `작품 중심 단층 모델` 문서는 `DIVERGED` 메모를 넣고, 별도 이중 모델 문서를 새 기준으로 세웠다.

# 다음 세션의 첫 행동

1. `korean-classics-donggyeong-japgi-review-queue.v1.json`의 `본문 복원 5건`부터 처리한다.
2. `저자 표기 낮은 신뢰 9건`을
   - 인명
   - 놀이/가요명
   - 부제/작품군명
   으로 분리 정리한다.
3. 그다음 `동경잡기(東京雜記)` 전권 후보를 `정식 작품 후보`와 `문맥 자산`으로 나눈다.
4. 이후 같은 방식으로 `東文選` 확장 여부를 판단한다.

# 다음 세션이 피해야 할 함정

- `전권 수확 -> 전권 묶음`보다 먼저 `정식 작품 확정`으로 달려들지 말 것
- `歌` 표기가 있다고 바로 독립 작품으로 확정하지 말 것
  - 설명문/서사적 항목일 수 있음
- 권차 재생성 직후 전권 묶음/시인별 보기를 병렬로 동시에 다시 돌리지 말 것
  - 파일 갱신 타이밍이 꼬여 숫자 정합성이 흔들린다
- 현재 저장소는 전체적으로 dirty tree가 크므로 내 변경 범위만 보고 작업할 것
- `저자 수`보다 `검수 대기열`을 먼저 줄여야 다음 단계가 빨라진다
