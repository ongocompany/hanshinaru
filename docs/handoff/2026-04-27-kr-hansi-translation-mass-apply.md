---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 라운드 3 A 본격 — KR 한문 한시 1,589수 Opus subagent 번역 + jinas DB 일괄 적용
date: 2026-04-27
author: 민철
---

# 이번 세션에서 완료한 작업

라운드 3 A 본격 처리. chunk-001~052 (1,589수)를 Sonnet/Opus subagent로 번역 → jinas DB 일괄 UPDATE → 사이트 노출 검증까지.

## 결과 요약

| 항목 | 값 |
|---|---|
| 처리 시 수 | 1,589 (chunk-001~052) + 기존 chunk-000 30수 |
| 모델 분포 | Opus 1,439 / Sonnet 150 / canonical 27 |
| jinas DB UPDATE | 1,619 (멱등) — KR 시 1,616수 모두 번역 보유, 누락 0 |
| 검증 | 샘플 8수 HTTP 200 + 본문/해설 정상 렌더 |

## 모델 결정 — Sonnet → Opus

1. 1차 5청크(001~005)를 **Sonnet**으로 처리.
2. chunk-001을 Opus로 추가 처리 후 **품질 비교** 실시.
3. 1건 표본 비교에서 Opus가 학술 깊이·격조에서 우세, 단 "명편" 찬사 / 도연명 인용 hallucinate 의심 1건씩 발견.
4. 형 결정: **Sonnet의 hallucinate 가능성도 동일하니 1건 비교는 표본 부족**. 이후 chunk-006~052 모두 **Opus 본격 처리**.
5. chunk-001은 비교 실험용 Opus 결과가 results-opus/에 남아있어 본 적용 시 sonnet을 덮어씀 → **chunk-001은 결과적으로 Opus로 통일됨** (의도외, 그대로 둠).

## 처리 파이프라인

1. `/tmp/kr-translate/chunks/chunk-NNN.jsonl` (입력 시 30수씩, chunk-052만 29수)
2. subagent (Sonnet 또는 Opus)에게 Read + 번역 + Write 위임. 메인 컨텍스트 부담은 "DONE: N lines written" 한 줄만 받음.
3. 5병렬 batch (10~11회) — 회당 ~5분.
4. `apply_kr_translations.py --quality opus-subagent` 로 jinas DB UPDATE.

## 사고/대응

| 사고 | 원인 | 대응 |
|---|---|---|
| chunk-006 출력 잘림 (21/30) | Opus 출력 토큰 한도 추정 | 누락 9수 `chunk-006-redo.jsonl` 미니청크로 재처리 |
| chunk-023 stall (10분 무응답) | 알 수 없음 (시 길이 평균 수준) | 재실행으로 정상 처리 |
| chunk-036 stall 2회 연속 | 평균 155자(다른 청크의 3배), 489자 시 포함 → 토큰 한도 | 10수씩 `chunk-036-1/2/3` split 처리 |

# 어디서 멈췄는지

본작업 완료. dev server 종료, `/tmp/kr-translate/` 임시 데이터 정리.

# 핵심 판단과 이유

## 1. Opus subagent 본격 진행 — Sonnet 30수 단일 비교는 표본 부족
**판단**: 1차 5청크 후 Sonnet → Opus로 전환.
**이유**: Opus의 hallucinate 1건만 검증한 비대칭 평가였음. 양적 처리에서 hallucinate는 모델 무관 후처리로 잡아야 한다는 합의에 따라 Opus의 학술 깊이 강점을 채택.

## 2. jinserver 아닌 **jinas:5433**이 권위 DB
**판단**: `postgresql://jds:jds@jinas:5433/jds` (`100.115.194.12:5433`) 사용.
**이유**: `jds/docs/handoff.md`엔 jinserver:5432 URL이 적혀있으나 그건 옛 스냅샷(45,951수, country 컬럼 없음). jinas Docker의 `jds-db-1` 컨테이너가 실제 권위 DB(46,848수, country 컬럼 보유). 한시나루 사이트 `.env.local`도 jinas:5433 가리키고 있음.

## 3. 청크 크기 — 30수 유지 + stall 시 split
**판단**: 30수 청크 유지, 사고 청크만 사후 split/redo.
**이유**: 일률적으로 청크 크기를 줄이면 청크 수가 늘어 처리 시간 ↑. 사고 비율이 낮아(53청크 중 사고 3건) 사후 대응이 더 효율적.

## 4. quality 필드 분리 — `sonnet-subagent` / `opus-subagent`
**판단**: 모델별로 다른 quality 값 부여. `apply_kr_translations.py`에 `--quality` / `--review-memo` 인자 추가.
**이유**: 후속 검수·UI 분기·hallucinate 점검에서 모델별 추적 가능해야 함.

## 5. chunk-001 Opus 덮어쓰기 그대로 둠
**판단**: 비교 실험 Opus 결과가 본 적용에서 Sonnet 덮어쓴 사실 발견 후, 롤백하지 않음.
**이유**: Opus 우세 결정과 결과적으로 일관. 추가 작업 비용 대비 효과 낮음. quality 필드로 구분 가능.

# 생성/수정/참조한 문서

## 생성
- `docs/handoff/2026-04-27-kr-hansi-translation-mass-apply.md` (본 문서)

## 수정 (jds 리포)
- `scripts/apply_kr_translations.py` — `--quality` / `--review-memo` 인자 추가. quality 하드코딩 제거.

## 참조
- `docs/handoff/2026-04-27-round3-c-and-translation-pilot.md` (이전 세션, 파일럿)

# 원래 계획과 달라진 점

## 1. chunk-001 30수 — Sonnet 의도였으나 Opus로 적용
- 원: chunk-001~005를 Sonnet으로 두고 chunk-006부터만 Opus.
- 실제: 비교 실험용 `results-opus/chunk-001.jsonl`이 본 적용에서 sonnet을 덮어씀.
- 영향: 품질 면에서는 무해(오히려 Opus 우세 결정과 일관).

## 2. DB URL — jinserver → jinas
- 원: `jds/docs/handoff.md`의 `jinserver:5432` 가이드를 따름.
- 실제: 1차 적용 시 0 row 영향(스키마 미스매치). 형 정정 후 `jinas:5433`으로 재적용.

# 다음 세션의 첫 행동

## 부트 루틴
1. 본 핸드오프 + `.rules/` + `git log -20`
2. 한시나루 사이트 `npm run dev`(node 22)로 jinas DB 가리키는지 점검 — 또는 jinas Docker에 한시나루 web 컨테이너 배포 확인.

## 우선 후속

### A. jinserver의 옛 jds 인스턴스 정리 (별 spec)
- jinserver의 `jds-*` 컨테이너 / 데이터가 **현재 어떤 서비스에서 참조되는지** 조사 (분산 번역 워커 등).
- 안전 확인 후 dump 백업 → 컨테이너/볼륨 제거 → 디스크 회수.
- `jds/docs/handoff.md`의 DB URL을 `jinas:5433`으로 수정.

### B. notes 컬럼 처리 결정
- subagent 출력의 `notes` 배열이 `poems` 테이블에 컬럼 부재로 미반영 상태. 결과 파일은 `/tmp` 휘발이라 사라짐.
- 옵션: (a) `poems`에 `notes JSONB` 컬럼 추가 + 재추출 (b) commentary에 통합 (c) 별 테이블.
- **참고**: `/tmp/kr-translate/results*/` 모두 정리됐으므로 notes 복구 필요 시 subagent 재호출 또는 결과 파일 재생성 단계가 필요.

### C. hallucinate 후처리 검증
- commentary 내 의심 패턴(특정 인물 인용, 시집명, "명편/걸작/지대한") 정규식 추출 → 샘플링 검수.
- 모델 무관(Sonnet도 가능성 동일).

### D. 라운드 2 잔여 (B/D/E/F)
- 평측 분석 / 수기 검수 / 樂府 분류 / jinas 배포 — 라운드 2 핸드오프 후보.

# 다음 세션이 피해야 할 함정

## DB
- **jinserver:5432 URL 사용 금지** — 옛 스냅샷, 한국 시 ID 없음. 권위 DB는 `jinas:5433` (`postgresql://jds:jds@jinas:5433/jds` 또는 `100.115.194.12:5433`).
- **`country` 컬럼은 jinas DB에만 존재** — jinserver 옛 DB는 country 컬럼 자체 없음. 추출 SQL 작성 시 jinas 연결 확인.

## subagent 사용
- **Opus 30수 청크에서 stall/누락 발생률 ~5%** — 다음 세션에서 비슷한 양적 처리 시 누락 자동 검증 + redo 파이프라인 필요.
- **결과 파일에 "DONE: N lines written" 한 줄이 섞이는 사고** — chunk-050에서 발생. 적용 스크립트가 빈 줄/비-JSON 줄을 건너뛰지만, 명시적 cleanup 보강 가능.
- **이전 비교 실험 결과 파일이 정리 없이 남아있으면 본 적용에서 의도외 덮어쓰기** — chunk-001이 그 사례. 비교 실험 후엔 즉시 결과 파일 별 디렉토리로 격리 권장.

## 환경
- **node 20.20.1로 astro dev 실행 불가** — `>=22.12.0` 요구. nvm v22.22.2 사용 (`PATH="/Users/jinwoo/.nvm/versions/node/v22.22.2/bin:$PATH"`).

# 후속 작업 (별도 spec/세션)

- **jinserver jds 정리** — 위 A 항목.
- **notes 처리** — 위 B 항목.
- **chunk-001 Sonnet 복원 여부** — 그대로 두기로 결정. 필요 시 별 세션에서 Sonnet 재처리.
- **hallucinate 후처리** — 위 C 항목.
- **B/D/E/F 라운드** — 라운드 2 핸드오프 그대로.
