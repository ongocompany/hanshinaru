---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 비당대 중국 한시 콘텐츠 우선 결정과 source catalog 착수
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

최신 handoff와 최근 커밋을 읽고, 전한·후한을 비롯한 당 이외 중국 시대의 콘텐츠 공백을 확인했다.

확인 결과 중국 데이터는 jds 기준 당대 4분화와 미분화 당만 있고, 兩漢·魏晉南北朝·宋·元·明·淸은 시인·작품이 0이었다. 따라서 이번 판단은 UI polishing보다 콘텐츠 수집·가공 우선이다.

이후 위키문헌을 1차 기본 소스로 삼는 방향을 확정하고, jds의 Wikisource/normalizer/DB 모델 흐름을 참조해 비당대 중국 한시 1차 수집 파이프라인을 시작했다. 핵심 제약은 간체자를 그대로 노출하지 않고, 한시나루 표시 원칙에 맞춰 한국식 한자 형태를 기본으로 삼는 것이다.

# 생성한 문서

- `docs/research/2026-04-30-cn-non-tang-content-production-plan.md`
- `docs/spec/2026-04-30-cn-non-tang-source-catalog.v1.json`
- `docs/spec/cn-non-tang-tranche1.sources.raw.json`
- `docs/spec/cn-non-tang-tranche1.records.v1.json`
- `docs/spec/cn-non-tang-tranche1.report.v1.json`
- `docs/spec/cn-non-tang-tranche1.db-dry-run.v1.json`
- `docs/spec/cn-non-tang-tranche1.jds-upsert.sql`

# 생성한 파이프라인

- `scripts/lib/cn_wikisource_api.mjs`: 위키문헌 URL을 MediaWiki parse API 요청으로 바꾸고 raw HTML을 가져온다.
- `scripts/lib/cn_hansi_text_normalizer.mjs`: 간체자와 비한국식 이체자를 한국식 한자 표시로 정규화한다.
- `scripts/lib/cn_wikisource_record_builder.mjs`: 위키문헌 seed를 한시나루/JDS 후보 구조로 바꾼다.
- `scripts/lib/cn_curated_payload_builder.mjs`: records를 Supabase `hansi_curated_*` 검토용 payload로 바꾼다.
- `scripts/data/cn_non_tang_tranche1_seed.mjs`: 兩漢 6수, 魏晉 6수의 1차 seed 원문·번역·해설이다.
- `scripts/fetch_cn_wikisource_tranche1.mjs`: tranche 1 source URL의 위키문헌 raw page bundle을 생성한다.
- `scripts/build_cn_non_tang_tranche1.mjs`: seed를 records/report JSON으로 생성한다.
- `scripts/build_cn_non_tang_tranche1_db_dry_run.mjs`: 실제 DB 쓰기 전 curated upsert 후보를 negative provisional id로 생성한다.
- `scripts/build_cn_non_tang_tranche1_jds_sql.mjs`: JDS 선적재용 SQL을 생성한다. 기본 끝맺음은 `ROLLBACK`이다.
- `tests/cn_hansi_pipeline.test.mjs`: 간체자 정규화, 한국식 `絶`, 전당 이전 정형시 과분류 방지, record 구조화를 검증한다.

# 1차 산출물

- 총 12수
- 위키문헌 raw source page bundle 10페이지
- DB dry-run: curated poets 9명, curated poems 12수
- JDS SQL ROLLBACK 검증: insert 예상 poets 9명, poems 12수, 실제 잔존 0건
- 시대 분포: `qian-han` 6수, `wei-jin` 6수
- 작가 분포: 劉邦 1, 項羽 1, 劉徹 1, 無名氏 3, 曹操 2, 曹丕 1, 曹植 1, 陶淵明 2
- 번역 상태: 12수 모두 owned draft 번역·해설 포함
- 생성 JSON에서 대표 간체자 잔존 검색 결과: 0건

# 검증 결과

- `node --test tests/cn_hansi_pipeline.test.mjs` 통과
- `node scripts/fetch_cn_wikisource_tranche1.mjs` 통과: raw source 10페이지 생성
- `node scripts/build_cn_non_tang_tranche1.mjs` 통과
- `node scripts/build_cn_non_tang_tranche1_db_dry_run.mjs` 통과
- `ssh jinas "PGPASSWORD=jds psql ..."`로 `cn-non-tang-tranche1.jds-upsert.sql` ROLLBACK 검증 통과
- 생성 결과: `records=12`, `translatedOwned=12`

# 핵심 판단

콘텐츠 수집·가공을 먼저 한다.

| 선택지 | 판단 |
|---|---|
| 콘텐츠 먼저 | 70% — 6시대가 실제로 비어 있어 사이트 본질 공백을 해소함 |
| UI polishing 먼저 | 30% — 보기 좋아지지만 빈 시대 문제는 그대로 남음 |

# 확인 근거

- 최신 handoff: `docs/handoff/2026-04-29-d-cycle-3c-b-curation-text-14-eras.md`
- 최신 commit: `842ea003 [민철][Docs] D 라운드 cycle 3c-B 핸드오프 — 14시대 큐레이션 텍스트 작성 마감`
- jds 실측:
  - `era_period='당'`: 2,628명 / poem_count 합 17,586
  - `초당`: 11명 / 1,113
  - `성당`: 29명 / 4,879
  - `중당`: 33명 / 12,692
  - `만당`: 35명 / 9,629
  - 비당대 6시대: 현재 없음

# 이번 세션의 안전장치

- 기존 작업트리에 제가 만들지 않은 정적 산출물 변경이 많아, 코드·dist 산출물은 건드리지 않았다.
- Supabase DB도 바로 수정하지 않았다.
- 먼저 수집 큐와 1차 구조화 JSON을 남겨 다음 세션이 정확히 이어갈 수 있게 했다.
- `兮`가 들어간 초사·악부풍 작품과 전당 이전 5/7언 고시는 `絶句`·`律詩`로 과분류하지 않도록 보수적으로 처리했다.

# 다음 세션 첫 행동

1. `docs/spec/2026-04-30-cn-non-tang-source-catalog.v1.json`을 연다.
2. `docs/spec/cn-non-tang-tranche1.records.v1.json`의 12수 원문 URL을 위키문헌 API/raw로 한 번 더 대조한다.
3. `docs/spec/cn-non-tang-tranche1.jds-upsert.sql`의 마지막 `ROLLBACK`을 `COMMIT`으로 바꾸기 전, 품질명 `cn-tranche1`과 중복 방지 조건을 최종 확인한다.
4. JDS 선적재 후 real `jds_id`를 받은 뒤 Supabase `hansi_curated_*` upsert로 전환한다.
5. 兩漢/魏晉 tranche 2 또는 宋代 tranche 1로 확장한다.

# 다음 세션이 피해야 할 함정

- UI polishing으로 먼저 빠지지 말 것. 지금 핵심 공백은 디자인이 아니라 대표 시인·작품 0개 상태다.
- `全宋詩` 같은 대형 자료를 처음부터 전량 파싱하지 말 것. 대표작 10~20수의 얇은 공개 세트부터 만든다.
- 무명 작품을 일반 시인처럼 억지로 붙이지 말 것. `anonymous-han-gushi` 같은 별도 규칙이 필요하다.
- 당대 미분화 2,628명 재분류는 가치가 크지만, "당 제외 시대 전무" 문제 해결 뒤로 둔다.
- 간체자뿐 아니라 `絕/絶`, `内/內` 같은 한국식 한자 표시 차이를 계속 테스트로 고정할 것.
