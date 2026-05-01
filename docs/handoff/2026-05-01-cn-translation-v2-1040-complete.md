---
epic_id: cn-translation-v2
doc_type: handoff
status: active
title: 중국 한시 번역 v2 1040편 완료
date: 2026-05-01
author: 지훈
---

## 이번 세션에서 완료한 작업
- `docs/spec/cn-translation-results.gemini-cli.v2.jsonl` 기준 중국 한시 번역 v2 queue `CN-TR-00001`~`CN-TR-01040`의 ok 결과를 모두 채웠다.
- 최종 검증:
  - unique ok: `1040/1040`
  - missing: `0`
  - duplicate ok: `0`
  - reading 한자 혼입: `0`
  - bad rows: `1` (`CN-TR-00137`의 과거 timeout audit row, 같은 queueId의 ok row는 존재)
- 모델 분포:
  - `gemini-3-flash-preview`: `987`
  - `gpt-5.4-mini`: `52`
  - `gpt-5.4`: `1`

## 어디서 멈췄는지
- 번역 JSONL 채우기는 완료했다.
- 공개 데이터 적용 단계는 아직 진행하지 않았다. 이전 상태상 public index에는 300편만 적용되어 있을 수 있으므로, 다음 세션 첫 작업은 apply script 확인 후 public data 반영 여부를 결정하는 것이다.

## 핵심 판단과 이유
- Gemini CLI quota가 남아 있을 때는 Gemini를 우선 사용했다. 기존 v2 문체와 가장 가까웠기 때문이다.
- quota 동안 GPT fallback을 사용했지만, `gpt-5.4-mini`의 `low/high` reasoning은 해설이 짧아지는 경향이 있어 폐기했다.
- `scripts/run_cn_translation_codex_cli.mjs`에 `--reasoning-effort` 옵션과 `reading-contains-hanzi` 검증을 추가했다. GPT 결과 중 독음에 원문 한자가 섞이는 경우를 막기 위한 조치다.
- 기존에 ok로 들어갔던 `CN-TR-00922`~`CN-TR-00924`의 독음 한자 혼입을 발견해 제거 후 재생성했다.

## 생성/수정/참조한 문서
- 수정: `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`
- 수정: `scripts/run_cn_translation_codex_cli.mjs`
- 생성: `docs/handoff/2026-05-01-cn-translation-v2-1040-complete.md`

## 원래 계획과 달라진 점
- 처음에는 남은 95개 처리였지만, 이전 GPT 결과 3개에서 독음 한자 혼입을 발견해 제거했다. 따라서 실제 재처리 대상은 잠시 98개가 되었다.
- Gemini quota가 풀린 뒤에는 GPT fallback 대신 Gemini로 마지막 83개를 처리했다.

## 다음 세션의 첫 행동
1. `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`의 최종 검증 명령을 다시 한 번 실행한다.
2. public data 적용 script를 확인한다.
3. v2 번역 결과를 사이트 데이터에 반영할지, 먼저 형님 육안 비교용 smoke preview를 만들지 결정한다.

## 다음 세션이 피해야 할 함정
- `CN-TR-00137` timeout row 하나가 남아 있어도 같은 queueId의 ok row가 있으므로 누락으로 해석하면 안 된다.
- `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`은 1000라인을 넘어 Foreman warning이 뜬다. 경고 자체는 현재 작업 실패가 아니다.
- 형님이 수정한 정적 HTML/PSD 파일들이 working tree에 많이 남아 있다. 이 세션 작업과 섞어 커밋하지 말아야 한다.
- GPT fallback을 다시 쓸 경우 `low/high`는 해설이 짧아질 수 있다. 기본 `xhigh`와 `reading-contains-hanzi` 검증을 유지한다.
