---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 중국 비당대/당이전 한시 번역 v2 904편 quota pause
date: 2026-05-01
author: 지훈
---

# 이번 세션에서 완료한 작업

- v2 translation queue를 `876`편에서 `904`편까지 진행했다.
- 성공 추가 범위는 `CN-TR-00877`부터 `CN-TR-00904`까지 28편이다.
- 결과 파일:
  - `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`
- 현재 전체 상태:
  - 전체 queue: 1,040편
  - 고유 `ok` 완료: 904편
  - 남은 번역: 136편
  - 다음 미완료 queueId: `CN-TR-00905`
  - 남아 있는 실패/audit row: 기존 `CN-TR-00137 簡兮` timeout 1건

# 어디서 멈췄는지

- `CN-TR-00905`부터 Gemini CLI terminal quota가 소진되어 중단했다.
- 에러 메시지 핵심:
  - `TerminalQuotaError: You have exhausted your capacity on this model. Your quota will reset after 4h28m20s.`
- `gemini-2.5-flash` 간단 smoke도 같은 quota error가 발생해, 특정 모델만의 문제가 아니라 현재 Gemini CLI quota 자체가 닫힌 상태로 판단했다.

# 핵심 판단과 이유

- GPT-5.4/Codex CLI smoke는 문체와 해설 길이가 Gemini v2 결과와 달라져 대량 번역에 섞지 않기로 했다.
- quota error로 붙었던 `CN-TR-00905` 이후 실패 row 72건은 번역 실패가 아니라 quota 실패 기록이라 JSONL에서 제거했다.
- 성공한 28편만 보존했다.

# 생성/수정/참조한 문서

- 수정:
  - `docs/spec/cn-translation-results.gemini-cli.v2.jsonl`
- 생성:
  - `docs/handoff/2026-05-01-cn-translation-v2-904-quota-pause.md`
- 참조:
  - `docs/handoff/2026-05-01-cn-translation-v2-600-checkpoint.md`

# 원래 계획과 달라진 점

- 원래는 남은 164편을 `100 + 64`로 끝까지 진행하려 했다.
- Gemini CLI quota가 `CN-TR-00905`부터 소진되어 28편 추가 완료 지점에서 멈췄다.

# 다음 세션의 첫 행동

먼저 현재 완료 수를 확인한다.

```bash
node -e "const fs=require('fs'); const rows=fs.readFileSync('docs/spec/cn-translation-results.gemini-cli.v2.jsonl','utf8').trim().split(/\n/).filter(Boolean).map(JSON.parse); const ok=new Set(rows.filter(r=>r.status==='ok').map(r=>r.queueId)); const ids=[...Array(1040)].map((_,i)=>'CN-TR-'+String(i+1).padStart(5,'0')); console.log({uniqueOk:ok.size, remaining:1040-ok.size, next:ids.find(id=>!ok.has(id))});"
```

quota가 회복된 뒤 다음 명령으로 재개한다.

```bash
npm run cn:translate:gemini-cli -- --limit 100 --timeout-ms 120000 --retry 2 --delay-ms 1000
```

예상 시작점은 `CN-TR-00905`이고, 다음 100편 완료 후 `1004/1040`이 된다. 마지막에는 남은 36편을 한 번 더 실행하면 된다.

# 다음 세션이 피해야 할 함정

- quota error row를 결과 파일에 누적하지 않는다. `TerminalQuotaError` row는 번역 결과가 아니라 운영 실패 로그다.
- 완료 판단은 row 수가 아니라 `status === "ok"`인 고유 `queueId` 수로 한다.
- GPT-5.4 결과는 번역 자체는 가능하지만 Gemini v2 결과와 문체 밀도가 달라, 같은 public batch에 섞지 않는 편이 맞다.
- 형님이 작업 중인 HTML/PSD 변경은 이번 번역 commit에 포함하지 않는다.
