---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 중국 비당대/당이전 한시 번역 v2 600편 checkpoint
date: 2026-05-01
author: 지훈
---

# 이번 세션에서 완료한 작업

## 번역 파이프라인 결정

- Gemini API 과금 대신 Gemini CLI의 Google 로그인 구독 quota를 쓰는 방식으로 전환했다.
- 기본 모델은 `gemini-3-flash-preview`로 확정했다.
  - `gemini-3.1-pro-preview`도 테스트했으나 `429 MODEL_CAPACITY_EXHAUSTED`가 발생해 대량 batch용으로 부적합했다.
- v2 prompt를 추가했다.
  - 파일: `docs/spec/cn-translation-prompts/gemini-cli-v2-full.txt`
  - 해설은 350~500자 정도로 확대했다.
  - 문체는 한시나루 본문 톤에 맞춰 `~이다/~한다` 평서문으로 고정했다.

## 번역 결과

- 전체 translation queue: 1,040편
- v2 번역 완료: 600편
- 남은 v2 번역: 440편
- 현재 다음 미완료 queueId: `CN-TR-00601`
- 마지막 완료 queueId: `CN-TR-00600` / 제목 `夏日`
- 결과 파일: `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`
- 파일 내 audit row:
  - `timeout` row 1건이 남아 있다.
  - 대상은 `CN-TR-00137 簡兮`이며, 같은 queueId가 재시도되어 `ok`로 성공했으므로 미해결 실패는 아니다.

완료 checkpoint commits:

- `b571cbec` `[지훈][Data] 중국 한시 번역 v2 100편 checkpoint`
- `93c7d26a` `[지훈][Data] 중국 한시 번역 v2 200편 checkpoint`
- `c05273e6` `[지훈][Data] 중국 한시 번역 v2 300편 checkpoint`
- `1efdce06` `[지훈][Data] 중국 한시 번역 v2 400편 checkpoint`
- `ac4b710b` `[지훈][Data] 중국 한시 번역 v2 500편 checkpoint`
- `dd05050b` `[지훈][Data] 중국 한시 번역 v2 600편 checkpoint`

## production 공개 색인 반영

- v2 완료분 300편을 먼저 production-facing public index에 반영했다.
- 기존 당시삼백수 320편은 유지하고, 중국 번역 완료분을 `321~620`번으로 추가했다.
- 적용 파일:
  - `public/index/poems.v3.json`
  - `public/index/poems.compact.json`
  - `public/index/db_author.with_ko.json`
  - `scripts/apply_cn_translation_results_to_public_index.mjs`
  - `package.json`
- 적용 commit:
  - `a5524ca5` `[지훈][Data] 중국 한시 번역 300편 공개 색인 반영`

검증 결과:

- `public/index/poems.v3.json`: 620편
- `public/index/poems.compact.json`: 620편
- 이번 반영분: 300편
- `poemNoStr` 중복: 0
- 번역/해설/주석 누락: 0
- author count: 97
- `npm run build`는 Node.js `20.20.1` 때문에 실패했다. 현재 Astro가 `>=22.12.0`을 요구하므로 데이터 문제가 아니라 로컬 Node 버전 문제다.

## V1 초안 수동 보정

- V1 50편 초안은 GPT-5.4 worker로 수동 보정했다.
- 보정본 파일:
  - `docs/spec/cn-translation-results.gemini-cli.v1.gpt54-reviewed.jsonl`
- 보정 결과:
  - 50행
  - 해설 350~500자
  - `~이다/~한다` 평서문
  - 경어체 패턴 없음
- 적용 commit:
  - `84ea58d1` `[지훈][Data] 중국 한시 V1 번역 수동보정본`
- 원본 V1 초안 `docs/spec/cn-translation-results.gemini-cli.v1.jsonl`은 보정 완료 후 삭제했다. 현재 git status에는 남아 있지 않다.

# 어디서 멈췄는지

- v2 translation queue 1,040편 중 600편까지 번역 완료했다.
- 아직 production 공개 색인에는 300편까지만 반영되어 있다.
- 남은 번역 440편을 먼저 완료한 뒤, public index에는 600편 완료분 또는 1,040편 전체 완료분을 다시 적용하면 된다.
- 다음 번역 시작점은 `CN-TR-00601`이다.

# 다음 세션 작업 지시

## 1. 이어서 번역

먼저 현재 완료 수를 확인한다.

```bash
node -e "const fs=require('fs'); const rows=fs.readFileSync('docs/spec/cn-translation-results.gemini-cli.v2.jsonl','utf8').trim().split(/\n/).filter(Boolean).map(JSON.parse); const ok=new Set(rows.filter(r=>r.status==='ok').map(r=>r.queueId)); console.log({uniqueOk:ok.size, remaining:1040-ok.size});"
```

그 다음 Gemini CLI chunk를 계속 실행한다.

```bash
npm run cn:translate:gemini-cli -- --limit 100 --timeout-ms 300000 --retry 1 --delay-ms 1000
```

운영 방식:

- 100편 단위로 실행한다.
- chunk 완료 후 `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`만 stage/commit한다.
- commit message 예:
  - `[지훈][Data] 중국 한시 번역 v2 700편 checkpoint`
  - `[지훈][Data] 중국 한시 번역 v2 800편 checkpoint`
  - `[지훈][Data] 중국 한시 번역 v2 900편 checkpoint`
  - `[지훈][Data] 중국 한시 번역 v2 1000편 checkpoint`
  - 마지막 40편 완료 후 `[지훈][Data] 중국 한시 번역 v2 1040편 완료`

## 2. timeout 처리

- timeout row가 생겨도 같은 queueId를 재시도하면 된다.
- 재시도 명령 예:

```bash
npm run cn:translate:gemini-cli -- --queue-id CN-TR-XXXXX --timeout-ms 300000 --retry 1 --delay-ms 1000
```

- 완료 수는 row 수가 아니라 `status === "ok"`인 고유 `queueId` 수로 판단한다.

## 3. production 재적용

번역을 더 진행한 뒤 공개 색인 반영은 아래 명령으로 한다.

```bash
npm run cn:translations:apply-public
```

이 script는 기존 `cn-translation-gemini-cli-v2` 반영분을 제거하고 현재 ok 결과를 다시 붙이는 idempotent 방식이다.

재적용 후 반드시 확인한다.

```bash
node -e "const fs=require('fs'); const full=JSON.parse(fs.readFileSync('public/index/poems.v3.json','utf8')); const compact=JSON.parse(fs.readFileSync('public/index/poems.compact.json','utf8')); const cn=full.filter(p=>p.sourceMeta?.collection==='cn-translation-gemini-cli-v2'); const dup=full.map(p=>p.poemNoStr).filter((id,i,a)=>a.indexOf(id)!==i); console.log({full:full.length, compact:compact.length, cn:cn.length, duplicates:dup.length});"
```

## 4. build 검증 주의

- 현재 로컬 Node는 `20.20.1`이다.
- `npm run build`는 Astro 요구사항 때문에 실패한다.
- build 검증을 하려면 Node `>=22.12.0` 환경에서 실행해야 한다.

# 다음 세션이 피해야 할 함정

- `docs/spec/cn-translation-results.gemini-cli.v1.jsonl` 초안은 삭제된 상태다. 되살리지 말고, 필요하면 `v1.gpt54-reviewed.jsonl`만 참고한다.
- production index에는 아직 300편만 반영되어 있다. v2 result는 600편 완료 상태이므로, 재적용 시 public index의 중국 번역분이 600편으로 늘어나는 것이 정상이다.
- `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`에는 timeout audit row가 있을 수 있다. 완료 판단은 반드시 고유 ok queueId로 한다.
- Gemini CLI는 sandbox 밖 실행이 필요하다. OAuth/네트워크 때문에 `npm run cn:translate:gemini-cli`는 escalated 실행으로 돌린다.
- 형님이 작업 중인 HTML/PSD 변경이 working tree에 남아 있다. 번역 작업 commit에는 포함하지 않는다.
