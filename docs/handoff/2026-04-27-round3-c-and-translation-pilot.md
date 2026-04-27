---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 라운드 3 C(tang300 4명 매칭) + A 파일럿(KR 한문 한시 sonnet subagent 번역)
date: 2026-04-27
author: 민철
---

# 이번 세션에서 완료한 작업

라운드 3 C(데이터 정합 마무리) + A(KR 한문 한시 1,589수 번역) 파일럿. C는 완료, A는 30수 적용으로 파이프라인 검증까지.

## C: tang300 신규 4명 시인 작품 정합 (jds 커밋 04988f1)

라운드 2에서 INSERT한 4명(邱爲·金昌緖·唐玄宗·杜秋娘)의 작품 1수씩 4수를 정본 `poems`에 INSERT하고 `poem_annotations.poem_id` 채움.

| 항목 | 결과 |
|---|---|
| `poems` INSERT | 4행 (id 48938~48941) |
| `poem_annotations.poem_id` UPDATE | 4행 (NULL 115→111) |
| `poets.poem_count` +1 | 4명 (모두 0→1) |
| 라우트 | `/poets/{qiu-wei,tang-xuan-zong,jin-chang-xu-2,du-qiu-niang}` 200, `/poems/48938~48941` 200 |

스크립트: [`jds/scripts/match_tang300_new_poets.py`](../../../jds/scripts/match_tang300_new_poets.py).

## A 파일럿: 모델 비교 + subagent 파이프라인 검증

### A-1. qwen vs Sonnet 동일 3수 비교

3수: 〈黃鳥歌〉(琉璃王) / 〈贈隋右翊衛大將軍于仲文〉(乙支文德) / 〈題靑山白雲圖〉(申師任堂)

| | qwen3.6:27b 1차 (메타X) | qwen3.6:27b 2차 (메타O) | Sonnet (메타O) |
|---|---|---|---|
| 시간 | 106s | 87s | **33s** |
| 시 1 시인 정체 | ❌ "신라 유리왕" | ✅ "고구려 유리왕" | ✅ "고구려 제2대 유리왕"·치희 일화 |
| 黃鳥 | "노란 새" | "노란 새" | "꾀꼬리" (학계 통설) |
| 한자 섞임 | - | "知足하는" 룰 위반 | 괄호 병기만 |
| 찬사 표현 | - | "지대한 영향" 룰 위반 | 없음 |
| 학술 용어 | - | 부재 | "제화시(題畫詩)" 활용 |

핵심 발견: 사실 정확도는 메타로 해결되지만 룰 준수·자연스러움·학술 용어는 모델 자체 격차.

### A-2. Sonnet subagent 파이프라인 (chunk 30수 파일럿)

설계:
1. `jds.poems` 중 `country='KR' AND translation_ko IS NULL` 1,589수 추출
2. 30수씩 JSONL 청크로 분할 (`/tmp/kr-translate/chunks/chunk-NNN.jsonl`, 53개)
3. subagent(sonnet)에게 청크 파일 Read + 번역 + 결과 파일 Write
4. `apply_kr_translations.py`로 결과 → `poems` UPDATE

파일럿 결과 (chunk-000, 최치원 등 30수):
- 시간: **5분 11초** (시당 ~10초)
- 30/30 JSON 파싱 OK, 빈 번역 0
- 한자 섞임 17건 — 모두 `한글독음(漢字)` 괄호 병기 패턴 (한국 한문학 학계 관행). 형 결정으로 **룰 완화** (괄호 병기 허용).
- 품질: 학술 용어 활용 우수 (예: "탁물우정(托物寓情)"), 사실 정확

DB 적용: `apply_kr_translations.py --chunk 0` → 30수 jinas DB UPDATE 완료
- `quality='sonnet-subagent'`, `status='translated'`, `reviewed_at=now()`
- 사이트 검증: `/poems/47322~47351` 200, 번역/해설 정상 노출

# 어디서 멈췄는지

C 완료. A는 파일럿 30수까지 적용. 나머지 52청크(1,559수) 본격 처리는 다음 세션.

# 핵심 판단과 이유

## 1. C에서 邱爲 등 4명 작품 정본 INSERT 시 country/quality 명시
**판단**: `poems` INSERT 시 `country='CN'`, `quality='canonical'`, `is_notable=TRUE` 부여.
**이유**: tang300 320수 중 4명 시인 시는 정본이 따로 없어 본 INSERT가 곧 정본. canonical로 표시해 후속 다른 책 번역과 구분.

## 2. A 모델은 Sonnet으로 — qwen 사실 오류는 메타로 해결되지만 룰·표현은 모델 격차
**판단**: jinserver의 qwen3.6:27b 대신 Claude Sonnet subagent 사용.
**이유**: qwen은 메타 줘도 (a) 한자 섞임 (룰 위반), (b) 어색한 한국어 ("산맥은 바다 문턱을 향해 사선으로 뻗어"), (c) 찬사 표현 ("지대한 영향"), (d) 학술 용어 부재. Sonnet은 모두 해결. 시간도 ~3배 빠름.

## 3. API 비용 회피 위해 subagent 호출 방식 — 구독 요금제 cover
**판단**: Anthropic API 직접 호출 X, Agent tool로 sonnet subagent 호출.
**이유**: 형 결정. Claude Code 구독 요금제로 추가 비용 0.

## 4. 한자 괄호 병기 허용 (룰 완화)
**판단**: 프롬프트 룰 "번역문에 한자 절대 섞지 말 것"을 `한글독음(漢字)` 괄호 병기는 허용으로 완화.
**이유**: 한국 한문학 학계 표준 표기. 가독성·정확성 모두 향상. notes도 별도 있어 본문 한자는 보조적.

## 5. notes는 본 세션 미반영 (poems 컬럼 부재)
**판단**: subagent 출력의 notes 배열은 결과 JSONL에 보존하되 `poems`에는 UPDATE 안 함.
**이유**: `poems` 테이블에 notes 컬럼 없음. 추가 또는 commentary에 통합할지는 후속 결정. 결과 파일에 보존돼 있어 후속 가능.

## 6. 30수 chunk 크기
**판단**: chunk당 30수, 53청크.
**이유**: 입력 시당 ~500토큰 + 출력 시당 ~600토큰 → 30수면 입출력 33k 정도. subagent 컨텍스트 안전. 50수 이상은 출력 토큰 막힘 우려.

# 생성/수정/참조한 문서

## 생성

### jds (커밋 04988f1)
- `scripts/match_tang300_new_poets.py`

### jds (본 세션 추가, 커밋 대상)
- `scripts/apply_kr_translations.py`

### hanshinaru
- `docs/handoff/2026-04-27-round3-c-and-translation-pilot.md` (본 문서)

## 임시 파일 (다음 세션에서 활용 가능, /tmp는 휘발 가능 — 필요 시 재생성)
- `/tmp/kr-translate/chunks/chunk-000.jsonl` ~ `chunk-052.jsonl` (53개)
- `/tmp/kr-translate/results/chunk-000.jsonl` (파일럿 결과, 이미 DB 적용됨)

## 참조
- `pipeline/translate/prompts/v4_batch_korean.txt` (jds — 프롬프트 베이스)
- `docs/handoff/2026-04-27-data-enrichment-round2.md` (이전 세션)

# 원래 계획과 달라진 점

## 1. A의 모델 결정 — qwen → Sonnet subagent
- 원 계획: jinserver의 qwen3.6:27b 일괄 (5~10시간 백그라운드)
- 실제: 품질 비교 후 Sonnet 우세 → subagent 호출 방식 (구독 요금제 cover)

## 2. 한자 섞임 룰 완화
- 원 프롬프트: "한자 절대 섞지 말 것"
- 실제: `한글독음(漢字)` 괄호 병기 허용 (학계 관행)

# 다음 세션의 첫 행동

## 부트 루틴
1. 본 핸드오프 + `.rules/` + `git log -20`
2. `/tmp/kr-translate/chunks/` 잔존 확인. 휘발됐으면 재생성 (53개 청크 — 본 세션 첫 추출 SQL/스크립트 그대로 재실행)

## 라운드 3 A 본격 처리

### 자동화 옵션 (우선 검토)
파일럿에서 chunk-000은 적용 완료. 나머지 chunk-001 ~ chunk-052 (52청크 = 1,559수) 처리 흐름:

1. **batch 단위 결정** — 한 메시지에 5~10개 subagent 병렬 호출. 메인 컨텍스트 부담 측정 후 조정.
2. **subagent 프롬프트** — 본 세션 파일럿 prompt 그대로 재사용 (paths만 chunk 번호 교체).
3. **결과 검증** — `apply_kr_translations.py --dry-run` 한 번에 53청크 (또는 batch별)로 점검.
4. **DB 일괄 적용** — `apply_kr_translations.py` (chunk 인자 없이 전체).

### 예상 시간
- 직렬: 5분/청크 × 52 = ~4.5시간
- 5 병렬 batch: ~55분
- 10 병렬 batch: ~30분

### 주의
- 메인 컨텍스트 부담 — subagent 결과는 파일에 쓰게 하면 부모 컨텍스트엔 "DONE: N lines written"만 들어옴 (파일럿 검증).
- 일부 청크 실패 시 재처리 — `apply_kr_translations.py --chunk N`로 부분 적용 가능.

# 다음 세션이 피해야 할 함정

## 모델 / 프롬프트
- **qwen3.6:27b 회귀 금지** — 비교 종결됨. Sonnet subagent로 진행.
- **시인 메타 필수** — chunk JSONL에 `country`, `era` 필드 반드시 포함 (없으면 사실 hallucinate).
- **chunk 50수 이상 금지** — 출력 토큰 막힘 우려. 30수 권장.

## 결과 검증
- **한자 괄호 병기 OK, 단독 한자는 NG** — 후처리 검증에서 `한글(漢字)` 패턴 제외하고 단독 한자만 검출.
- **commentary 찬사 표현 점검** — Sonnet은 거의 안 쓰지만 일부 시 자동 검출 (정규식 "걸작|명작|대표작|지대한")해서 재처리 후보 식별.

## DB
- **quality='sonnet-subagent'** — `canonical`(향찰 학계 표준)과 구분. UI에서 표시 분기 가능.
- **title_ko 기존 우선** — UPDATE 시 `COALESCE(NULLIF(title_ko,''), :title)`로 보호 (이미 적용된 패턴).
- **notes 미반영 잔재** — `poems`에 컬럼 없어 결과 파일에만 보존. 후속 별도 spec.

## 환경
- **Local ollama 사용 금지 그대로** — qwen 회귀 안 하므로 무관하지만 룰 유지.
- **Tailscale 접속 URL** — dev server `--host 0.0.0.0` 후 `http://100.92.248.98:4321/` (macbook tailscale IP).

# 후속 작업 (별도 spec/세션)

- **A 본격** — chunk-001 ~ chunk-052 처리 + 전체 DB 적용 (위 부트 루틴 참고)
- **notes 처리** — `poems`에 `notes JSONB` 컬럼 추가 또는 commentary 통합 결정
- **金昌緖 slug 정리** — 현재 `jin-chang-xu-2` (충돌 회피용 -2). 동명이인 확인 후 정리
- **B/D/E/F** — 평측 분석·수기 검수·樂府 분류·jinas 배포 (라운드 2 핸드오프 후보 그대로)
