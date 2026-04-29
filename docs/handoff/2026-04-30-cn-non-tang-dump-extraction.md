---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 비당대 중국 한시 위키문헌 dump 기반 대량 추출 전환
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

최신 커밋 `a3acb20b [지훈][Docs] 비당대 중국 한시 대량 수집 핸드오프 갱신`과 `docs/handoff/2026-04-30-cn-non-tang-content-priority.md`를 읽고 비당대 중국 한시 대량수집을 이어갔다.

처음에는 위키문헌 API로 `author-parentheses-likely` 후보를 직접 가져오는 방식을 붙였지만, 120쪽 중 25쪽만 성공하고 나머지는 `429 Too Many Requests`에 걸렸다. 형님이 제안한 대로 대량 수집은 API 반복 호출이 아니라 Wikimedia dump를 `jinas`에 저장하고 거기서 추출하는 방식으로 전환했다.

# dump 저장 위치와 검증

- 작업 서버: `jinas`
- 저장 위치: `/volume1/homes/jinadmin/dumps/zhwikisource/latest/zhwikisource-latest-pages-articles.xml.bz2`
- 작업 위치: `/volume1/homes/jinadmin/dumps/zhwikisource/work/hanshinaru-cn-non-tang`
- dump 파일: `zhwikisource-latest-pages-articles.xml.bz2`
- 원격 표시 크기: `2.5G`
- 공식 dump 목록 기준 크기: `2,595,201,984 bytes`
- MD5 검증: `b23973bc52a243dcb6c7481b4143deaa` 일치
- `jinas` 여유 공간: `/volume1` 기준 약 `11T`

# 생성/수정한 파이프라인

- `scripts/extract_cn_wikisource_dump_pages.py`
  - `zhwikisource` XML bz2 dump를 스트리밍으로 훑고, 후보 JSON의 exact title만 추출한다.
  - 대형 dump를 로컬에 풀지 않고 `jinas`에서 바로 처리한다.
- `scripts/build_cn_non_tang_candidate_records.mjs`
  - dump raw JSON을 record와 review queue로 변환한다.
  - 기본 입력은 `docs/spec/cn-non-tang-candidate-pages.dump.raw.v1.json`이다.
- `scripts/lib/cn_wikisource_candidate_extractor.mjs`
  - 위키문헌 HTML/wikitext에서 후보 본문을 정리한다.
  - 긴 줄 결합, 너무 긴 본문, 너무 짧은 본문은 review queue로 보낸다.
- `scripts/lib/cn_wikisource_api.mjs`
  - API 요청 제목에서 `絕 -> 絶` 같은 표시용 정규화를 하지 않도록 수정했다.

# 생성한 산출물

- `docs/spec/cn-non-tang-candidate-pages.dump.raw.v1.json`
- `docs/spec/cn-non-tang-candidate-records.v1.json`
- `docs/spec/cn-non-tang-review-queue.v1.json`
- `docs/spec/cn-non-tang-candidate-records.report.v1.json`

# 현재 수집 결과

- 후보 인덱스의 `author-parentheses-likely`: 659건
- dump exact-title 추출 결과: 657개 고유 페이지
- 누락: 0개
- 중복 후보 제목: `春歌 (鄭思肖)`, `秋歌 (鄭思肖)`
- 생성 records: 657건
- 자동 추출: 597건
- 수동 검토 필요: 60건
- 총 추출 줄 수: 6,303줄
- 시대 분포:
  - 宋: 228
  - 元: 93
  - 明: 336

# 검증 결과

- `node --test tests/cn_hansi_pipeline.test.mjs` 통과
- dump MD5 검증 통과
- 첫 120건 API 방식: 25/120 성공
- 같은 120건 dump 방식: 120/120 성공
- 전체 dump 방식: 657개 고유 페이지 추출

# 핵심 판단과 이유

앞으로 비당대 중국 한시 대량수집은 `jinas dump -> exact-title extract -> local normalized records -> review queue` 흐름을 기본으로 둔다.

| 방식 | 판단 |
|---|---|
| dump 기반 추출 | 85% — API 제한이 없고, 659건 규모에서 바로 657개 페이지를 확보했다 |
| API 반복 호출 | 15% — 소량 확인에는 편하지만 429 때문에 대량 수집에는 부적합하다 |

# 원래 계획과 달라진 점

원래 다음 단계는 `candidate index -> raw page fetch -> normalized records -> review queue`였다. `raw page fetch`를 API 반복 호출로 구현하려 했지만 429 제한이 확인되어, raw 확보 방식을 dump 추출로 바꾸었다.

# 다음 세션 첫 행동

1. 이 handoff와 `docs/spec/cn-non-tang-candidate-records.report.v1.json`을 먼저 읽는다.
2. `docs/spec/cn-non-tang-review-queue.v1.json`에서 `manual-check` 60건을 우선 검토한다.
3. `possible-joined-lines`는 문장부호 없는 14자 결합 줄이 많으므로, 자동 분할 규칙을 별도 개선할지 판단한다.
4. 宋·元·明 657건을 한 번에 DB 반영하지 말고, `autoExtracted` 중에서도 대표 작가/짧은 정형시 tranche부터 dry-run payload를 만든다.
5. `清詩` category는 이전 API category 수집에서 실패했으므로, dump title/categorylinks 기반으로 따로 회복한다.

# 다음 세션이 피해야 할 함정

- dump raw JSON은 원문 저장용 중간 산출물이다. 검토 없이 바로 DB upsert하지 말 것.
- `生查子` 같은 詞 제목도 섞여 있으므로, “중국 한시” 공개 범위에서 詩/詞 분리를 다시 봐야 한다.
- `authorHint`에 `宋·陳襄`, `絶命詩`처럼 사람 이름이 아닌 값이 일부 들어온다. review queue나 author normalization에서 걸러야 한다.
- 로컬 저장소에 2.5GB dump를 받지 말 것. dump 원본은 `jinas`에 둔다.
