---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 비당대 중국 한시 review queue 자동 분할 1차 개선
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

최신 커밋 `d30ba0aa [지훈][Data] 비당대 중국 한시 dump 추출 큐 추가`와 `docs/handoff/2026-04-30-cn-non-tang-dump-extraction.md`를 읽고, dump 기반 후보 657건의 manual-check 축소 작업을 이어갔다.

`possible-joined-lines`의 주원인은 문장부호가 없는 7언/5언 정형시 구가 한 줄로 붙은 경우였다. 예를 들어 28자는 7언절구 4구, 14자는 7언 2구로 나눌 수 있다.

이에 `scripts/lib/cn_wikisource_candidate_extractor.mjs`에 보수적인 무표점 정형시 분할 규칙을 추가했다.

- 주석 괄호나 인용부호가 있는 줄은 자동 분할하지 않는다.
- 14~56자이고 7로 정확히 나누어지는 줄만 7자 단위로 나눈다.
- 10~40자이고 5로 정확히 나누어지는 줄만 5자 단위로 나눈다.
- `===其一===` 같은 위키문헌 section heading은 본문에서 제외한다.

또 `scripts/lib/cn_hansi_text_normalizer.mjs`에 `阳 -> 陽` 정규화를 추가해 `歐阳玄`, `登嶽阳樓` 잔존을 제거했다.

# 생성/수정한 파일

- `scripts/lib/cn_wikisource_candidate_extractor.mjs`
- `scripts/lib/cn_hansi_text_normalizer.mjs`
- `tests/cn_hansi_pipeline.test.mjs`
- `docs/spec/cn-non-tang-candidate-records.v1.json`
- `docs/spec/cn-non-tang-review-queue.v1.json`
- `docs/spec/cn-non-tang-candidate-records.report.v1.json`

# 결과 숫자

- 전체 후보: 657건 유지
- 자동 추출: 597건 -> 606건
- 수동 검토 필요: 60건 -> 51건
- 총 추출 줄 수: 6,303줄 -> 6,152줄
- `歐阳玄` 잔존: `歐陽玄`으로 정규화 완료

# 남은 review queue 성격

남은 51건은 단순 줄붙임보다 사람이 보거나 별도 전략이 필요한 케이스다.

- `extracted-too-many-lines`: 10건
  - 긴 작품 또는 연작이다. 대표 예: `鹿門寺`, `北風行`, `帝京篇`, `春日閑居`.
- `extracted-too-few-lines + empty-body`: 17건
  - 위키문헌 본문이 `{{:하위문서}}` transclusion 위주라 exact title 페이지에서 본문이 비어 있다.
  - 다음에는 dump 안에서 transclusion target title을 추출해 추가 raw page를 붙이는 방식이 필요하다.
- `possible-joined-lines`: 23건
  - 주석, 이본 설명, 출처 문구가 본문 줄에 섞인 경우가 많다.
  - 자동으로 과감히 지우기보다 주석 제거 규칙을 별도 검증해야 한다.
- `extracted-too-few-lines`: 1건
  - `絶命詩 (施邦耀)`은 원문 자체가 1행만 추출되어 별도 확인 필요.

# 검증 결과

- `node --test tests/cn_hansi_pipeline.test.mjs` 통과
- `node scripts/build_cn_non_tang_candidate_records.mjs` 통과
- `git diff --check` 통과
- `npx tsc --noEmit` 실패
  - 기존 `docs/archive/2026-04-28-pre-cleanup/tang300/tang300.tsx`, `poets/poets.tsx` 등의 React/JSX 타입 문제로 대량 실패한다.
  - 이번 데이터 파이프라인 변경의 회귀로 보지 않는다.

# 다음 세션 첫 행동

1. 이 handoff와 `docs/spec/cn-non-tang-candidate-records.report.v1.json`을 먼저 읽는다.
2. `empty-body` 17건의 raw page에서 `{{:...}}` transclusion target을 뽑아 dump raw에 추가할지 판단한다.
3. 주석 섞임 23건은 `西巖集`, `瀛奎律髓`, `同上書冊` 같은 출처 문구 제거 규칙을 샘플 기반으로 따로 만든다.
4. 긴 작품 10건은 DB 반영에서 제외하지 말고, 긴 작품 tranche 또는 연작 split 정책으로 별도 관리한다.

# 다음 세션이 피해야 할 함정

- 현재 51건을 모두 사람이 직접 고치려 들지 말 것. `empty-body`, 주석 섞임, 긴 작품은 서로 다른 문제다.
- transclusion page는 API 재호출보다 dump 내부 title lookup으로 해결하는 편이 낫다.
- 주석 제거는 과하게 하면 원문 손실이 생긴다. 먼저 20건 이하 샘플로 규칙을 검증한다.
- 기존 작업트리의 HTML/PSD 변경은 이번 파이프라인 작업과 별개로 보인다. 섞어서 stage하지 않는다.
