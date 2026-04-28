---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 미커밋 정리 + 안중근→안축 127수 매핑 정정 + 근재집 commentary 재생성 + 검수 도구 정리
date: 2026-04-28
author: 민철
---

# 이번 세션에서 완료한 작업

## Phase 1 — 미커밋 정리 (3 commits)

지난 라운드 잔재 67개 미커밋이 쌓여 있던 상태에서, 진우형의 **"production + 신규 로컬 SSR 외는 archive + gitignore"** 방침에 따라 안전하게 격리.

| 커밋 | 내용 |
|---|---|
| `c4dc3425` `[민철][Chore]` | 옛 정적 페이지 archive 격리 + 도구 메타 ignore (20 files, -7507줄). `chinese-poetry/`, `tang300/`, `README.md`(Tangshi 시절 옛 버전) → `docs/archive/2026-04-28-pre-cleanup/`. `.bkit/`, `.gemini/`, `.omc/`, `.superpowers/`, `.venv/`, `.claude/settings.json`, `FOREMAN-E2E-TEST.md`, `scripts/auto-push-error.log` ignore. |
| `cb769405` `[민철][Chore]` | `.rules/commit-rules.md`, `.rules/document-lifecycle.md`, `.graphifyignore` 신규 추적. |
| `17c7b7b7` `[민철][Docs]` | `東京雜記` → `동경잡기(東京雜記)` 일관성 정리 (handoff/research/spec 6 docs). |

**보류** (UI 통합 라운드에서 처리): 22개 .html 1줄 사이트명 통일(`<title>` 변경), `shared/template-*.html`, `public/assets/hero/river_scroll.psd` 압축. 이유: 운영 hanshinaru.kr의 정적 페이지가 진실의 출처라, 로컬 변경을 푸시하면 운영 충돌 위험.

## Phase 2 — 사이트 spot-check (어제 도은집 정정 결과 검증)

`npm run dev` (Node 22.22.2 + Astro 6.1.1) 띄워 어제 라운드 3 A + 도은집 정정이 사이트에 잘 반영됐는지 확인.

- 라우트 smoke test: `/`, `/poets`, `/korea`, `/eras/goryeo`, `/poems/47671`, `/poems/47446`, `/poets/k-3468`, `/poets/k-3469` 모두 200
- 데이터 무결성: 이숭인(252수)/안축/도은시 페이지에서 이언진/송목관 등 잘못된 흔적 0건 ✅

핸드오프상 `/eras/goryeo-late`는 잘못된 표기. 실제 KR era slug는 `goryeo` (matchPeriods에 '고려 후기' 포함).

## Phase 3 — E. KR commentary hallucination 검수

KR commentary 1,615수에 대해 패턴 카운트 진단 (`scripts/maintenance/audit_kr_commentary.mjs`).

**quality 분포**:
- opus-subagent: 1,306수
- opus-subagent-v2: 252수 (어제 도은집 재생성)
- sonnet-subagent: 30수
- canonical: 27수

**패턴 매치 결과**:
- 도은집 정정 잔재 (이언진/송목관/통신사/역관/우상/1763): 통신사 1건만 매치 — 검수 결과 변계량 통신사(1413년) 사실 인용으로 정상
- 과장 표현 (명편/걸작/백미/정수/정점 등): 14건 매치 — 검수 결과 정수 2건 + 정점 5건은 정규식 false positive(시 분석 표현), 진짜 hype 7건 모두 학술 정평 평가로 사실 부합. **수정 0건**.
- 인물 인용 (이백/두보/도연명/소식 등): 159건 — 모두 정확한 한국 한시 전통 인용 (소식 「적벽부」, 굴원 「이소」/「어부사」, 백거이 「장한가」, 이하 「金囊」 고사 등). 사실 부합.
- 4자리 연도 50건 — 검수 중 **새 매핑 오류 발견** (아래).

## Phase 4 — 안중근(3343) → 안축(3469) 127수 매핑 정정 (도은집 패턴 재발)

검수 중 결정적 발견: **poet#3343 安重根에 127수가 잘못 매핑되어 있음** — 모두 안축의 「謹齋集」(근재집) 시.

### 발견 경위

1. 검수 4자리 연도 패턴에서:
   - poem#47673 「天曆三年五月，受江陵道存撫使之命」 = 1330년 강릉도존무사 부임 (안축의 행적)
   - poem#47698 「至順元年十月始八日，承王命赴京」 = 1330년 (元 지순 1년)
   - poem#47759 「至順二年九月，罷任如京」 = 1331년
   → 안중근(1879-1910)이 元 연호로 시 쓸 수 없음.

2. **결정적 단서**: poem#47672 「竹溪別曲」 commentary 본문에서 자체 모순 발견:
   > "고려 안중근(安重根)이 ... 학계에서는 흔히 **안축(安軸)의 〈죽계별곡〉과 같은 작품으로 다루어진다**"
   → Opus subagent가 안축임을 알면서도 DB 매핑 따라 어색하게 작성.

3. 어제 핸드오프(`2026-04-27-kr-hansi-factcheck-do-eun-remap.md`)에서 「관동별곡」 1수만 안중근→안축 정정. 그런데 실제로는 **127수가 더 남아있었고** 핸드오프 점검 누락.

### Cross-check (B 방식 — 안전 검증)

표본 7수(47634, 47672, 47673, 47694, 47744, 47745, 47761) commentary 본문 검토:
- 47634 「過鐵嶺」: commentary가 "안중근의 망국 우국지정"이라 작성 → DB 매핑 따라간 hallucination
- 47672 「竹溪別曲」: 위 자체 모순
- 47744 「別母」: "안중근의 효자상" → hallucination
- 47761 「過松澗驛（卷一第2首）」: 「卷一」 표시 = 「謹齋集」 권차 → 안축 시집 형식

자동 수집 색인(`docs/handoff/2026-04-26-automatic-collection-final-index.md`)의 「**안축 / 謹齋集 / 128수**」 명단과 DB의 (poet#3343 127수 + poet#3469 1수) **128/128 = 100% 매칭** 확정.

### 실행

| 단계 | 결과 |
|---|---|
| 매핑 정정 | poems poet_id 3343 → 3469 일괄 UPDATE (127 row, id 47634~47761) |
| Poet 메타 — 안축(3469) | poem_count: 1 → 128 |
| Poet 메타 — 안중근(3343) | life_birth/death=1879/1910, era_period='근대', bio_ko 추가 ("이전 매핑은 안축 근재집과 혼동된 결과"), poem_count=0 |
| Commentary 재생성 | Opus subagent 5병렬 (chunk-001~005, 26+26+26+26+23=127수). 길이 222~464자 (avg 309). 금지 표현 0건 |
| Apply | jinas DB UPDATE: commentary_ko + quality='opus-subagent-v2' + review_memo='근재집 127수 매핑 정정 (안중근→안축) + commentary 재생성' (127/127 row) |

### 검증 (HTTP smoke + grep)

| 페이지 | 결과 |
|---|---|
| `/poets/k-3469` 안축 | 128수, 安軸/謹齋/관동/관동별곡/죽계별곡/순력/존무사 노출. 안중근 흔적 0 |
| `/poets/k-3343` 안중근 | 1879/1910/독립운동/이토/하얼빈 (새 bio), '안축 근재집과 혼동' 메모 |
| `/poems/47672` 죽계별곡 | 安軸 매핑, 竹溪/소백산 commentary, 안중근 흔적 0 |
| `/poems/47634` 過鐵嶺 | 安軸 매핑, 철령/존무사 commentary. 이전 "망국 우국지정" 완전 제거 |
| `/poems/47744` 別母 | 安軸 매핑, 모친/효 commentary. 이전 "효자상" 완전 제거 |

## Phase 5 — 검수 도구 정리

검수/마이그레이션 `.mjs` 5개를 `scripts/maintenance/` 로 이동 (재사용 도구화):

| 파일 | 용도 |
|---|---|
| `audit_kr_commentary.mjs` | KR commentary 패턴 매치 카운트 (CRITICAL/hype/ref/year/...). `--samples=N --pattern=label` 인자로 샘플 출력 |
| `match_anchuk.mjs` | (안축 case) 색인 시제 vs DB 시제 1:1 매칭 검증 — 다음 매핑 swap 검사 시 패턴 활용 가능 |
| `remap_3343_to_3469.mjs` | (안축 case) 매핑 일괄 UPDATE. dry-run 기본, `--apply`로 실행 |
| `check_anchuk_anjg.mjs` | (안축 case) 양 poet row 메타 비교 + 동기화 |
| `apply_anchuk_commentary.mjs` | (안축 case) `/tmp/.../results/*.jsonl` → DB UPDATE. 검증(길이/금지/누락/중복) 자동 |

이 중 `audit_kr_commentary.mjs`는 일반 도구, 나머지 4개는 안축 case 특화. 향후 비슷한 매핑 swap 발견 시 안축 4종을 템플릿으로 재사용.

`/tmp/anchuk-translate/` 임시 데이터 정리 완료. dev server 종료.

# 어디서 멈췄는지

본 라운드 작업 완료. 인물 인용·연도·사행 등 잔여 hallucinate 후처리는 표본 검수에서 모두 사실 부합 확인. 단 sonnet-subagent 30수, canonical 27수, opus-subagent 1,178수에 대한 추가 정밀 sample 검수는 후속 라운드.

# 핵심 판단과 이유

## 1. .html 변경/삭제 미커밋은 보류 (UI 통합 라운드)
**판단**: 22개 .html 1줄 변경 + chinese-poetry/tang300 삭제는 커밋하지 않고 archive로 격리 또는 working tree 유지.
**이유**: 진우형 명시 — "현재 로컬의 UI를 jinas production UI로 흡수시켜야 함". 운영 = 정적 페이지가 진실의 출처. 로컬의 SSR 라운드 1 변경을 운영에 푸시하면 사이트 깨짐. UI 통합 라운드에서 일괄 처리.

## 2. AGENTS.md/CLAUDE.md/gemini.md foreman 자동 변경 원복
**판단**: foreman이 자동 삽입한 `# Current Task` / `<!-- foreman:secrets -->` 블록 + 헤더 잘림을 `git checkout HEAD --` 로 원복.
**이유**: 진우형 의도가 아닌 도구 부수 효과. 추적할 가치 없음.

## 3. 안축 매핑 검증을 B 방식(표본 검수 후 일괄)으로 진행
**판단**: 패턴이 도은집과 정확히 동일하지만, 형 지시로 표본 7수 commentary 검토 후 일괄 정정.
**이유**: production DB 직접 쓰기는 신중. 7수 검수에서 100% 안축 확정 → 색인 cross-check 100% → 안전하게 일괄 정정.

## 4. 「관동별곡」(47671)은 재생성 대상에서 제외
**판단**: 어제 핸드오프에서 수기 재작성 완료. quality='opus-subagent' 그대로 유지.
**이유**: commentary가 이미 "충숙왕 17년(1330) 강릉도존무사 부임 ... 관동 일대 순력"으로 정확. 재생성 비용 회피.

## 5. 청크 크기 26수 (어제 28수 → 26수로 축소)
**판단**: 5병렬 chunks, 26+26+26+26+23 = 127.
**이유**: 어제 도은집 28수에서 chunk-006/036 stall/누락 사례 있었음. 26수로 약간 줄여 토큰 한도 여유 확보. 결과: 5/5 chunks 누락 0, stall 0.

## 6. 길이 가이드 200~350자 vs 실제 222~464자
**판단**: 가이드 초과해도 환각 없으면 그대로 적용 (3수가 400자 초과).
**이유**: chunk-005 subagent가 "전고·자주·역사 정황 정확화 위해 학술적 격조 우선"이라 보고. 환각 위험 없으면 길이만으로 재작업할 가치 없음.

## 7. 안중근 row 보존 + bio 정확화
**판단**: poet#3343 row 삭제 X, life/era/bio 정확화 + poem_count=0.
**이유**: 안중근(1879-1910)은 진짜 시인. 향후 「獄中遺墨」 등 진짜 안중근 시 적재 가능. row 보존 + "이전 매핑은 안축과 혼동" bio로 흔적 남김.

## 8. 검수 도구는 scripts/maintenance/ 로 추적 (옵션 A)
**판단**: 진우형 결정 — 패턴 정형화돼서 다음 매핑 swap 검사 시 재사용 가능.
**이유**: 도은집 + 안축 같은 합본 매핑 오류가 다른 시인에게도 있을 가능성 (어제 핸드오프 "자동 수집 색인 vs 본 적재 DB 불일치" 항목). 도구 보존 시 효율 ↑.

# 생성/수정/참조한 문서

## 생성

- `docs/handoff/2026-04-28-anjg-anchuk-remap-and-geunjaejip-recommentary.md` (본 문서)
- `scripts/maintenance/audit_kr_commentary.mjs`
- `scripts/maintenance/match_anchuk.mjs`
- `scripts/maintenance/remap_3343_to_3469.mjs`
- `scripts/maintenance/check_anchuk_anjg.mjs`
- `scripts/maintenance/apply_anchuk_commentary.mjs`
- `docs/archive/2026-04-28-pre-cleanup/` (chinese-poetry/, tang300/, README.md 격리)

## DB 변경 (jinas:5433)

- `poets`:
  - poet#3343 (안중근): poem_count 128 → 0, era_period 근대 전환기 → 근대, life_birth=1879, life_death=1910, life_raw='1879-1910', bio_ko 신규
  - poet#3469 (안축): poem_count 1 → 128
- `poems`: 127 row UPDATE (id 47634~47761)
  - poet_id: 3343 → 3469 (127 row)
  - commentary_ko: 신규 재생성 (127 row, opus-subagent 5병렬)
  - quality: → 'opus-subagent-v2'
  - review_memo: '근재집 127수 매핑 정정 (안중근→안축) + commentary 재생성'

## 참조

- `docs/handoff/2026-04-27-kr-hansi-factcheck-do-eun-remap.md` — 도은집 252수 정정 (선례)
- `docs/handoff/2026-04-26-automatic-collection-final-index.md` — 자동 수집 색인 (안축 「謹齋集 128수」 명단 — 매핑 결정 근거)
- `docs/handoff/2026-04-27-kr-hansi-translation-mass-apply.md` — 라운드 3 A (대상 commentary 작성 시점)
- `docs/handoff/2026-04-27-site-rebuild-round1-complete.md` — SSR 라우트 구조

# 원래 계획과 달라진 점

## 1. E 작업이 별 case 발견으로 확장
- 원: KR commentary 1,615수 잔여 hallucinate 검수 → sample fix 정도
- 실제: 검수 중 안중근→안축 매핑 오류 127수 발견 → 도은집 패턴 그대로 정정 작업 추가
- 영향: 한 번의 fact-check가 두 번째 합본 매핑 오류를 잡아냄

## 2. 어제 핸드오프 정확성 정정
- 어제 도은집 핸드오프에 "안중근 row 시 0수"라고 기록됐으나 실제 127수 잔존
- 이번 라운드에서 점검 후 0수로 정상화
- 어제 핸드오프 사후 정정은 별도 노트 없이 본 핸드오프로 갱신

# 다음 세션의 첫 행동

## 부트 루틴

1. 본 핸드오프 + `.rules/` + `git log -20`
2. `git status` — 본 라운드 변경 (DB만, 파일 시스템엔 maintenance/scripts + handoff)

## 우선 후속

### A. D. 「松穆館燼餘稿」 이언진 진짜 시집 적재 (별도 spec)
- ~150수 별도 적재 → poet#3348
- 어제·오늘 두 번의 매핑 정정에서 row 보존된 이유 = 향후 진짜 시집 적재 대비

### B. F. 라운드 2 잔여
- jinas docker-compose 배포 + CF Tunnel
- CN era 정밀 분류 (위키 lookup → era_period 정규화)
- 잔여 라우트 (`/search`, `/poems`, `/books/tang300/poets`)

### C. UI 통합 (별 라운드)
- 운영 hanshinaru.kr 라우트 매트릭스 작성
- 로컬 SSR 11 라우트 vs 운영 정적 페이지 비교
- archive / 폐기 / 흡수 분류 + 보류 미커밋 처리

### D. 자동 수집 색인 잔여 cross-check
- 색인의 다른 시인들도 비슷한 매핑 swap 가능성 (어제 핸드오프 watch 항목)
- 안축 색인은 「풍월정집 235수」, 차천로 「五山集 ?」 등 색인에 있으나 DB 시 0수 — 별도 적재 wave 또는 swap 검사
- `scripts/maintenance/audit_kr_commentary.mjs` + `match_*.mjs` 패턴으로 자동화 가능

### E. 잔여 hallucinate 정밀 검수
- sonnet-subagent 30수, canonical 27수에 대한 별도 sample 검수
- opus-subagent 1,178수 (도은집 + 근재집 제외) 추가 패턴 검수 (예: 「~을 본받아」 11건, 「사행」 113건)

# 다음 세션이 피해야 할 함정

## DB

- **poet#3343(안중근) row 삭제 금지** — 진짜 시인. 향후 「獄中遺墨」 등 적재 시 매핑 대상.
- **poet#3469(안축) bio_ko 손대지 말 것** — 어제 INSERT 시 정확하게 들어감. 본 라운드는 poem_count만 갱신.
- **commentary_ko quality 컬럼 16자 한도** — `opus-subagent-v2` (16자) OK.

## 데이터

- **127수 commentary 잔여 hallucinate 가능** — 모델 재생성도 위험 0이 아님. 표본 검수 후 발견 시 수기 정정.
- **자동 수집 색인의 다른 매핑 swap 가능성** — 도은집·근재집 패턴이 같은 적재 단위(id 47382~47633 도은집, 47634~47761 근재집)에서 발생. 그 직전·직후 id 범위에서도 비슷한 swap 가능성 검사 필요.
- **「관동별곡」(47671)과 「죽계별곡」(47672)** — 둘 다 안축의 한문 경기체가. 47671 quality='opus-subagent' (어제 수기), 47672 quality='opus-subagent-v2' (오늘 재생성) — 라벨 차이 자연스러움.

## 작업 흐름

- **검수 작업이 매핑 오류 발견의 진짜 가치** — 단순 "환각 패턴 정리" 목적이었으나 더 큰 데이터 정합성 사고를 잡음. 향후 사이트 가동 전 추가 검수 라운드 권장.
- **production 비교는 hanshinaru.kr 기준** — 로컬 SSR/dist는 미배포. UI 통합 라운드 전엔 .html 변경 working tree에 유지.
- **subagent 본문 분석의 한계** — 「죽계별곡」 케이스처럼 작자 식별을 본문 단서로만 하면 헷갈림. 핸드오프 색인 + 외부 출처 cross-check 필수.
- **production DB 직접 쓰기 신중** — 본 라운드 2 시인 row + 127 시 row UPDATE. dry-run + 검증 + 진우형 OK 후 실행 절차 유지.

# 후속 작업 (별도 spec/세션)

- 「松穆館燼餘稿」 이언진 진짜 시 적재 → poet#3348
- 「獄中遺墨」 등 안중근 진짜 시 적재 → poet#3343 (저작권 확인 필요)
- 자동 수집 색인의 다른 시인 매핑 swap 검사 (전수 cross-check, scripts/maintenance/match_*.mjs 패턴 활용)
- sonnet-subagent 30수 + canonical 27수 + opus-subagent 1,178수 정밀 sample 검수
- 안축 slug 부여 (현재 NULL, fallback k-3469로 동작 중)
- 운영(hanshinaru.kr) UI vs 로컬 SSR 통합 라운드
- 미커밋 .html 변경 처리 (UI 통합 시)
- jinas docker-compose 배포 + CF Tunnel
- CN era 정밀 분류
