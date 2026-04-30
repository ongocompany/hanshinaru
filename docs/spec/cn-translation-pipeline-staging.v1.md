---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: pipeline-staging
status: active
title: 중국 한시 번역 파이프라인 staging
date: 2026-04-30
author: 지훈
---

# 목적

전당시 때 만든 `jds/pipeline` 번역 파이프라인에, 한시나루에서 확보한 중국 비당대/당이전 원문을 태우기 위한 staging 산출물이다.

# 번역 담당 결정

1차 번역 담당은 `Gemini CLI`의 Google 로그인 구독 quota를 쓰는 `gemini-3-flash-preview`로 둔다.

이유:

- 형님이 이미 Gemini 구독을 사용 중이라 API key 방식은 이중 지출이 된다.
- Gemini CLI는 Google 계정 로그인 방식으로 구독 quota를 사용할 수 있다.
- `docs/spec/cn-translation-prompts/gemini-cli-v2-full.txt`가 번역, 독음, 주석, 해설 JSON을 한 번에 받는 구조다.
- v2 prompt는 해설을 350~500자 정도로 늘리고, 한시나루 사이트 톤에 맞춰 `~이다/~한다` 평서문으로 고정한다.
- `gemini-3-flash-preview`는 CLI 구독 경로에서 10편 smoke와 50편 batch를 모두 성공 처리했다.
- 전면 공개 전 초벌 번역을 많이 생산한 뒤 검수하는 흐름에 맞다.
- API batch보다 느리므로, JSONL 결과 파일에 성공분을 누적 저장하고 중단 시 이어서 실행한다.

정밀 검수나 대표작 보강은 나중에 상위 모델로 재번역/비평하는 2차 패스로 분리한다.

# 산출물

- queue: `docs/spec/cn-translation-pipeline-staging.v1.json`
- report: `docs/spec/cn-translation-pipeline-staging.report.v1.json`
- JDS SQL chunks: `docs/spec/cn-translation-pipeline-staging.jds-upsert/`
- builder: `scripts/build_cn_translation_pipeline_staging.mjs`
- Gemini CLI prompt: `docs/spec/cn-translation-prompts/gemini-cli-v2-full.txt`
- Gemini CLI runner: `scripts/run_cn_translation_gemini_cli.mjs`

# 현재 queue

| 구분 | 수량 |
|---|---:|
| selected source records | 1050 |
| translation jobs after dedupe | 1040 |
| duplicate aliases | 10 |
| held out | 76 |

era별 번역 job:

| era | jobs |
|---|---:|
| 先秦 | 338 |
| 兩漢 | 69 |
| 魏晉南北朝 / 晉 | 27 |
| 宋 | 202 |
| 元 | 88 |
| 明 | 316 |
| 清 | 0 |

held out:

| batch | count | 이유 |
|---|---:|---|
| pre-tang-tao-yuanming | 25 | collection witness / prose / classic overlap은 1차 시 번역에서 제외 |
| song-yuan-ming-auto | 51 | 원문 추출 상태가 `needs-review`라 번역 전 검토 필요 |

# 검증

`jinserver`의 live JDS DB는 현재 `localhost:5432`이며, local model보다 오래된 schema라 `poets.title_id`와 짧은 `poems.quality` 값을 사용한다.

검증 명령:

```bash
for f in docs/spec/cn-translation-pipeline-staging.jds-upsert/part-*.sql; do
  ssh jinserver "PGPASSWORD=jds psql -h localhost -p 5432 -U jds -d jds -v ON_ERROR_STOP=1" < "$f"
done
```

검증 결과:

- 전체 chunk 합산 기준 `INSERT 0 195` poets
- 전체 chunk 합산 기준 `INSERT 0 1040` poems
- quality별 parsed rows: `cnnt-auto 606`, `cnpt-chuci 17`, `cnpt-comp 95`, `cnpt-shijing 295`, `cnpt-tao 27`
- 마지막은 `ROLLBACK`

# 다음 작업

1. SQL의 마지막 `ROLLBACK`을 적용용 복사본에서만 `COMMIT`으로 바꿔 JDS에 적재한다.
2. 먼저 터미널에서 `gemini`를 한 번 실행해 Google 계정 로그인을 완료한다.
3. `npm run cn:translate:gemini-cli -- --limit 10`으로 smoke 번역을 돌리고 JSON 파싱/해설 품질을 검토한다.
4. 문제가 없으면 `--limit`과 `--era` 또는 `--batch`를 조합해 대량 실행한다.
5. 결과는 `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`에 누적된다.
