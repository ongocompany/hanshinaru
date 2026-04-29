---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: D 라운드 cycle 1+2 — UI 통합 본격 진입 (시대 페이지·메뉴 운영 반영, 모드 변경 사고 복구)
date: 2026-04-29
author: 민철
---

# 이번 세션에서 완료한 작업

오늘 한 세션에 6 라운드 진행. **DB 정합화(A·B)** + **D 본격 진입(UI 통합)** + **운영 회복**.

## 1. A 라운드 (오전 1) — sonnet-subagent 30수 검수
- 라운드 3 A 파일럿 chunk-000 (최치원 30수, sonnet-subagent quality)
- 3 Sonnet subagent 병렬 web 검증 → CLEAN 18 / MINOR 12 / **HALLUCINATION 0**
- MINOR 6건 학술 정확도 정정 (47326·47333·47342·47347·47348·47350)
- 환각 위험 검증 완료 (sonnet 처리분 안전)
- **commit: 4cd4f314**

## 2. B 라운드 (오전 2) — 시제 단위 swap cross-check
- 어제 9 swap (분량 일치만 검사) 후 잔여 옅은 swap 발견용 시제 매칭 도구
- 의심 44수 발견. 4 Sonnet subagent web 검증.
- **41수 swap 확정** + 3건 보류:
  - 김창흡 → 김상헌 24 + 김일손 10 (어제 "잔여 52수" 결론을 18수로 정정)
  - 이안눌 → 이공승 1 + 이원현 1
  - 최경창 → 최광유 1 (위키문헌 자구 일치)
  - 시제 명백 4: 조위·박원형·장일·이문화
- 신규 시인 9명 INSERT (poet#3479~3487)
- commentary 41수 재생성 (Opus 3병렬, opus-subagent-v2)
- **commit: 83c2da7e**
- 누적 정합화 **546수** (전체 1,615의 34%)

## 3. D 라운드 진입 — 큰 그림 reframe (2회)

### Reframe 1: "production 노출"이 본질
- 4일간 KR commentary 정합화에 매몰. CN 45,955수는 손도 안 댔고, 사이트 자체가 죽어있었다.
- 형 통찰: "한시만 있는 게 아니라 전당시·당시삼백수도 있는데 그 시들은?"
- 운영 진단:
  - SSR 라우트 모두 404 (`/poets/`, `/poems/*`, `/eras/*`, `/books`, `/china`)
  - 정적 잔재만 살아있음 (`/community/`, `/hansi/*` 등)
  - last-modified 4/25 → 그 후 deploy 0건
- 로컬 main이 origin/main(4/14)보다 40+ 커밋 앞섬 → 모든 작업 **운영 미반영** 상태

### Reframe 2: 메뉴 구조 통합 vs 단순 push
- 형 통찰: "jinas 메뉴와 local 메뉴가 다른데 어떻게 합치겠다는 거지?"
- 결정: **운영 hanshinaru.kr이 진실의 출처**, 4/27 SSR 라운드 1 코드는 폐기
- /hansi/{chinese,korean}/reading/ 안에 시·시인 보기 UI를 새로 작성

## 4. D Phase 1 — 안전 cleanup
- admin/tools 4 .html 사이트명 통일 ('당시삼백수 등' → '한시나루')
- hero psd 압축 (32MB → 4.4MB) + archive/design/ 이동 (운영 dist 제외)
- **commit: b0222b51**

## 5. D — 4/27 SSR 라운드 1 폐기
- src/pages/{books,china,eras,korea,poems,poets}/* + lib/db.ts + data/eras.ts → archive/local-ssr-round1/
- 변경된 components·layouts·pages/index → origin/main 시점 복원
- **commit: b03b830d**

## 6. D 라운드 UI 설계 합의 (D 옵션 — 4 영역 차례)

| Q | 답 |
|---|---|
| Q1 통합 방향 | 1번 홈 진화 (콘텐츠 겹치는 일일오수·오늘의 시인을 차별화) |
| Q1 차별화 | 홈=감상(서화 콜렉션) / 국가별=학습(번역+해설) |
| Q2 메뉴 이름 | "대표작가와 작품소개" → "오늘의 한시" |
| Q3 시 목록 | C(에디토리얼) + A(드릴다운) + B(검색) 결합 |
| Q3 시인 | a (별 URL `/hansi/{c,k}/poets/[slug]`) + 검색 / tang300 옛 자료 활용 |
| Q3 시 본문 URL | `/poems/[id]` 통합 (국가별 분리 X) |
| Q4 시대 처리 | 사이드바 하위 메뉴 + 시대별 전용 페이지 |
| Q5 시대 URL | `/hansi/{c,k}/eras/[slug]/` (slug=한자 음가 영문화) |
| Q6 홈 4 섹션 | Hero + 일일오수 + 오늘의 시인 + 소식 (그대로) |

## 7. D Cycle 1 — 시대 페이지 + 메뉴 SQL 작성
- `src/data/eras.ts` (CN 7 + KR 3)
- `src/pages/hansi/chinese/eras/[slug].astro` (placeholder)
- `src/pages/hansi/korean/eras/[slug].astro` (placeholder)
- `scripts/migrations/2026-04-29-d-cycle1-sidebar-eras.sql` (UPDATE 2 + INSERT 12)
- 로컬 dev server 검증: 10 시대 페이지 모두 200, 국가-slug 분리 정확
- **commit: 04cc48b6**

## 8. jinas SSH 진단 — SSR Node 미설치 발견
- `/var/www/hanshinaru.kr/`: 4/25 빌드 정적 파일만
- **hanshinaru SSR Node 프로세스 없음** (pm2/docker 미설치)
- 운영은 nginx로 정적만 서빙
- 결론: prerender된 페이지만 운영 작동 가능

## 9. D Cycle 2 — 시대 페이지 prerender + Supabase site_menu 적용
- 시대 페이지에 `export const prerender = true` + getStaticPaths 추가
- 로컬 build: 10 시대 HTML 정적 생성
- Supabase site_menu 변경 (PostgREST + service_role key):
  - UPDATE 2 row: 메뉴 이름 변경
  - INSERT 12 row: 시대 부모 (id 45·46) + CN 7 (id 47~53) + KR 3 (id 54~56)
  - hansi section 8 → 20 row
- **commit: 22f4a658**

## 10. 사고 발생 — push 후 운영 전체 404

### 원인
- 4/25 시점 origin/main astro.config: `output: 'static'`
- 4/27 라운드 1에서 `output: 'server'` (adapter node)로 변경됨, push 안 돼서 운영은 그대로 'static'
- 본 push (22f4a658)에서 'server' 모드 코드가 처음 운영 반영
- Astro server 모드 빌드 결과는 `dist/client/` + `dist/server/`로 분리
- jinas nginx root는 `dist/` 직접 가리키므로 `client/` 안 정적 파일 접근 불가
- **결과: 모든 페이지 nginx 404, 운영 사이트 깨짐**

### 회복
- astro.config `output: 'server'` → `'static'` 복귀 (4/25 운영 모드로 정렬)
- adapter @astrojs/node 제거
- 로컬 build: 33 페이지 정적 prerender (시대 10 + 기존 23)
- push → GitHub Actions deploy 32초 → 운영 회복
- **commit: 821735cf**

## 11. 최종 운영 검증

| 항목 | 결과 |
|---|---|
| 13 페이지 HTTP 200 (홈·community·hanja·hansi·reading·poets·eras 10개·admin·tools) | ✓ |
| 시대 페이지 10개 (CN 7 + KR 3) 운영 노출 | ✓ |
| 사이드바 메뉴 "오늘의 한시" 운영 노출 | ✓ |
| 사이드바 "시대" + 개별 시대 항목 운영 노출 | ✓ |
| 누적 정합화 546수 (DB 적용) 사이트 노출 가능 상태 | ✓ (단 시 본문은 SSR 필요) |

# 어디서 멈췄는지

D 라운드 cycle 1+2 완료. 운영 살아남. 다음 cycle 시작점:

- **본격 콘텐츠**: 시대 페이지 placeholder를 채우기 (시대 배경·한시 특징·대표 시인·대표 작품)
- **"오늘의 한시" 페이지 본격** (`/hansi/{c,k}/poets/`): 오늘의 한수 + 시인 상세 + 시집 입문
- **시 본문·시인 상세는 SSR 필요** (47,571수 정적 prerender 비현실적)

미커밋 잔존 18 .html (auth/community/hanja/history/korean-poetry/poem/privacy/terms/writing-helper/shared/* + tts-studio)는 D 라운드 후속 단계에서 처리.

# 핵심 판단과 이유

## 1. 형 reframe 2회 모두 정확 — 큰 그림 두 번 짚어주심

**판단**: 형 통찰을 1차로 통째 채택.
**이유**:
- Reframe 1 ("CN 시는?"): KR 정합화 4일 매몰 인식. 본질 = production 노출
- Reframe 2 ("메뉴 구조 다른데?"): 단순 push가 아닌 운영 진실 base 위에 구축
- AI 디테일 매몰의 큰 위험 — 형의 큰 그림 역할 핵심

## 2. 4/27 SSR 라운드 1 폐기 (archive/local-ssr-round1/)
**판단**: src/pages/{books,china,eras,korea,poems,poets}/* + lib/db.ts + data/eras.ts archive 격리. components/layouts origin 복원.
**이유**: 형 결정. 운영 진실 = origin/main, 본 SSR 라운드 1은 미푸시 + 운영 미작동 + 메뉴 mismatch. 보존이 무가치.

## 3. 시대 페이지 prerender 채택 (SSR Node 안 살림)
**판단**: 시대 데이터(eras.ts)는 정적이므로 `export const prerender = true` + getStaticPaths.
**이유**: jinas에 SSR Node 미설치 (진단 결과). prerender이 가장 빠른 정적 노출. 시대 데이터는 정적이라 prerender 자연스러움.

## 4. astro.config 'static' 회복 결정
**판단**: 운영 사고 발견 즉시 'server' → 'static' 복귀.
**이유**:
- 4/25 운영 상태와 정렬 = 즉시 회복
- jinas SSR Node 살리기는 별 cycle (2~4시간 작업)
- 사이트 다운 시간 최소화 우선

## 5. Supabase site_menu UPDATE/INSERT (코드 아닌 DB)
**판단**: site_menu에 INSERT 12 + UPDATE 2.
**이유**: 메뉴는 build time에 Supabase에서 fetch. service_role key로 PostgREST 직접 변경. SQL 파일도 작성 (재실행 가능 보존).

## 6. 시 본문·시인 상세는 SSR 필요 인정
**판단**: 47,571수 정적 prerender 비현실 (빌드 시간 폭발). SSR Node 살리기를 별 cycle로 분리.
**이유**: 시대 페이지는 10개라 정적 OK. 시 47,571 + 시인 2,891 정적 빌드는 불가능 수준. SSR 또는 hybrid 모드 필요.

## 7. 누적 commit 한 번에 push (43개)
**판단**: 본 세션 commit + 어제·그제·4/27 + 4/14 이전 잔여를 한 번에.
**이유**: 4/14 이후 deploy 0이었어서 어차피 한 번에 가야 함. 단 사고 발생 → 즉시 fix push로 회복.

# 생성/수정/참조한 문서

## 생성 (본 세션)

### 핸드오프
- `docs/handoff/2026-04-29-sonnet-subagent-30-audit-and-minor-fixes.md` (A 라운드)
- `docs/handoff/2026-04-29-b-round-title-level-swap-audit.md` (B 라운드)
- `docs/handoff/2026-04-29-d-cycle-1-2-ui-integration-with-incident.md` (본 문서, D 라운드)

### 코드
- `src/data/eras.ts` (시대 정의)
- `src/pages/hansi/chinese/eras/[slug].astro` (시대 페이지 CN, prerender)
- `src/pages/hansi/korean/eras/[slug].astro` (시대 페이지 KR, prerender)
- `astro.config.mjs` 변경: `output: 'static'`, adapter 제거

### 도구·스크립트
- A 라운드: `extract_sonnet30.mjs`, `apply_sonnet30_minor_fixes.mjs`
- B 라운드: `audit_title_swaps.mjs`, `extract_swap_suspicions.mjs`, `insert_b_round_poets.mjs`, `remap_b_round_swaps.mjs`, `build_b_round_chunks.mjs`, `apply_b_round_commentary.mjs`, `update_b_round_misbio.mjs`
- D 라운드: `scripts/migrations/2026-04-29-d-cycle1-sidebar-eras.sql`, `scripts/migrations/apply_d_cycle1_sidebar_eras.mjs`

### Archive
- `archive/local-ssr-round1/` (4/27 라운드 1 코드 격리: books, china, eras, korea, poems, poets, db.ts, eras.ts)
- `archive/design/river_scroll.psd` (32MB → 4.4MB 압축)

## DB 변경

### jinas:5433 (jds, 시·시인 데이터)
- A 라운드: poems 6 row UPDATE (commentary 정정)
- B 라운드: poets INSERT 9 + UPDATE 7 + poem_count 16, poems 41 row UPDATE (poet_id + commentary 재생성)

### Supabase (hanshinaru, 메뉴)
- site_menu UPDATE 2 + INSERT 12 (id 45~56)
- hansi section 8 → 20 row

## 참조
- `docs/handoff/2026-04-26-automatic-collection-final-index.md` (시제 색인)
- `docs/handoff/2026-04-28-9-poet-swap-via-web-verification.md` (어제 9 swap, B 라운드 base)
- `docs/handoff/2026-04-28-anjg-anchuk-remap-and-geunjaejip-recommentary.md` (그제 안축 정정)
- `docs/handoff/2026-04-27-site-rebuild-round1-complete.md` (4/27 SSR 라운드 1 — 본 세션에 폐기)

# 원래 계획과 달라진 점

## 1. A·B 라운드 (DB 정합화) → D 라운드 (UI 통합) 전환
- 원: opus-subagent 1,178수 정밀 sample 검수가 다음 우선순위였음 (어제·오전 핸드오프)
- 실제: 형 reframe ("production 노출이 본질") 후 D 라운드 우선 진입
- 영향: KR 정합화 추가는 보류, UI 통합으로 압축

## 2. 4/27 SSR 라운드 1 폐기
- 원: 4/27 SSR 라운드 1 결과를 base로 발전
- 실제: 운영 진실(origin/main 4/14 시점) 우선, 라운드 1 결과 archive 격리
- 영향: 작업 base 변경. 단 lib/db.ts 등 일부 도구는 archive에서 reference 가능

## 3. 운영 사고 발생 + 회복 (예상 외)
- 원: cycle 2 push 후 시대 페이지 + 메뉴 운영 노출 검증
- 실제: 'server' 모드 사고로 전체 404, 'static' 회복으로 해결
- 영향: 1 commit 추가 (821735cf), 다운 시간 ~5분
- 학습: 운영 환경(jinas SSR 미설치) 명확 인지 → 향후 모드 변경은 사전 검증 필수

## 4. SSR Node 살리기는 별 cycle
- 원: cycle 2에서 SSR 부활 검증
- 실제: jinas에 SSR Node 미설치 확인 → 'static' 모드 우회
- 영향: 시 본문·시인 상세(/poems/[id], /poets/[slug])는 다음 별 cycle (SSR 살리기 또는 정적 prerender 검토)

# 다음 세션의 첫 행동

## 부트 루틴

1. 본 핸드오프 + 오늘 A·B·D 핸드오프 + 어제 두 핸드오프 + `.rules/` + `git log -20`
2. `git status` — 미커밋 18 .html은 working tree 그대로 (D 라운드 후속)
3. 운영 응답 빠른 sanity check (`curl https://hanshinaru.kr/`)

## 우선 후속 (D 라운드 cycle 3+)

### Cycle 3a — 시대 페이지 콘텐츠 채우기 ★★★

10개 시대 페이지가 placeholder. 채울 콘텐츠:
1. **시대 배경** (큐레이션 텍스트, 1~3 단락)
2. **한시의 특징** (큐레이션, 형식·주제·대표 작가 개관)
3. **대표 시인** — DB의 `poets` 테이블에서 era_period 매칭으로 fetch + 큐레이션 (각 시대 6~8명)
4. **대표 작품** — DB의 `poems`에서 era 매칭 + 큐레이션 (각 시대 6~10수)

데이터 흐름:
- `eras.ts`의 `era_period_match` 배열로 poets.era_period 매칭
- 큐레이션은 `eras.ts`에 description·characteristics 필드 채우기 (한시나루 자체 콘텐츠) 또는 별 JSON

작업량: 큐레이션 콘텐츠 큼. 1차는 짧은 placeholder 텍스트 + DB 카드만.

### Cycle 3b — "오늘의 한시" 페이지 본격 ★★★

`/hansi/{c,k}/poets/` (placeholder 상태):
- 오늘의 한수 1수 (시 본문 + 번역 + 학술 해설 + 인용 풀이)
- 그 한수의 시인 상세 (간략)
- 시집별 입문 (당시삼백수, 全唐詩, 도은집, 근재집 등)

데이터 흐름:
- 시 큐레이션 ID list (예: tang_today_pool = [47322, 47326, 48214, ...]) → 일자 기반 회전
- 시인 정보 + 명구 fetch
- 시집 메타 (별 데이터)

### Cycle 4 — SSR Node 살리기 또는 정적 prerender 검토 ★★

시 본문(/poems/[id]) + 시인 상세(/hansi/{c,k}/poets/[slug])는 47,571 + 2,891 = ~50,000 페이지. 정적 prerender 시 빌드 시간 폭발.

옵션:
- A. **jinas에 SSR Node 살리기** — Synology Container Manager 또는 systemd
- B. **선택적 prerender** — 인기 시인·시만 정적 (예: 당시삼백수 300수 + 시인 100명), 나머지는 빌드 안 함 (404 또는 redirect)
- C. **외부 SSR (Vercel·Netlify)** — 무료 tier로 SSR Node 호스팅

권장: A (jinas Container Manager로 docker compose) — 통합 운영, 비용 0.

### Cycle 5 — 능동 탐색 (`/hansi/{c,k}/reading/`) ★★

A+B 결합 (사이드바 filter + 검색창). SSR 필수.

### Cycle 6 — 미커밋 18 .html 정리 ★

운영에 더 이상 필요 없는 정적 .html 22개 (A 그룹 5개는 이미 커밋, 18개 잔존):
- B 그룹 (SSR 대체): community·writing-helper 등 — archive 격리
- C 그룹 (운영 라우트 없음): auth·history·korean-poetry·poem·privacy·terms — SSR 페이지 작성 또는 archive
- E 그룹 (사용처 0): shared/template-* — 삭제

### Cycle 7 — 홈 분리·정제 ★

홈의 일일오수를 "감상용 서화 콜렉션"으로 차별화. 오늘의 시인 간략화.

# 다음 세션이 피해야 할 함정

## 운영

- **astro.config 'server'/'hybrid' 모드 변경 금지** — jinas SSR Node 미설치. 살린 후에만 변경.
- **deploy 스크립트 수정 신중** — `tar -czf - -C dist .` 가 dist 구조 가정. 모드 변경 시 client/server 분리 → 사고. 변경 전 로컬 build 후 dist 구조 확인.
- **push 전 로컬 build 검증** — npm run build 통과 + dist 구조 정상 (root에 index.html 있는지) 확인.

## DB

- **Supabase site_menu 직접 변경 가능 (service_role key)** — `~/.env.local` 'hanshinaru supabase service role' 라인. 변경 시 SQL/script 보존 필수.
- **build time fetch** — site_menu 변경은 build 후에 운영 반영. push trigger 또는 manual deploy 필요.
- **jinas:5433 (jds DB)와 Supabase는 별개**:
  - jds = 시·시인 데이터 (1,616 KR + 45,955 CN)
  - Supabase = 메뉴·articles·기타

## 코드

- **src/pages/hansi/{c,k}/poets·reading/* 는 placeholder** — 본격 콘텐츠는 다음 cycle.
- **archive/local-ssr-round1/** — 4/27 라운드 1 코드. 새 작업 시 reference로만 (직접 활용 X).
- **lib/db.ts (archive)** — Supabase 기반 DB fetch 함수. 시·시인 UI 구현 시 jds(jinas:5433) 연결 새로 작성 필요.

## 작업 흐름

- **AI 디테일 매몰 위험 큼** — 본 세션 형 reframe 2회. 큰 그림 자주 reflect.
- **production 노출이 본질** — DB 정합화·코드 작성 모두 운영 노출 후에 의미. 사이트 살린 후에 다음 작업.
- **모드/환경 변경 사고는 잠복 가능** — 4/27에 'server' 모드 변경했지만 push 안 돼서 4일간 무지. 본 push에서 폭발. 환경·구성 변경은 즉시 push + 검증.

# 후속 작업 (별도 spec/세션)

## D 라운드 후속
- Cycle 3a: 시대 페이지 콘텐츠 (큐레이션 + DB 연동)
- Cycle 3b: "오늘의 한시" 본격
- Cycle 4: SSR Node 살리기 (jinas Container Manager) 또는 hybrid mode
- Cycle 5: 능동 탐색 (`/hansi/{c,k}/reading/`)
- Cycle 6: 미커밋 18 .html 정리
- Cycle 7: 홈 분리·정제 (서화 콜렉션)
- Cycle 8: 시인 상세 (`/hansi/{c,k}/poets/[slug]`) + tang300 옛 자료(초상화·관계도·출생지) 활용

## 정합화 후속 (낮은 우선순위)
- C 옵션: opus-subagent 1,178수 정밀 sample 검수
- 자동 색인 잔여 swap 검사 (DB 단독 시제, 색인 다중 후보)
- 김창흡 잔여 18수 진짜 시 검증
- CN 45,955수 정합화 (장기, 형의 결정 후)
- 「松穆館燼餘稿」 이언진 진짜 시 적재 (poet#3348)
- 「獄中遺墨」 안중근 진짜 시 적재 (poet#3343)
- 18 신규 시인 slug 부여
- 자동 수집 파이프라인 한자 fuzzy 매칭 결함 수정 (jds 또는 색인 도구)

## 인프라
- jinas Synology에 SSR Node 서비스 설치 (Container Manager docker-compose)
- deploy-astro.yml 수정: client/server 분리 시 정상 처리
- CN era 정밀 분류
- Supabase service_role key 환경 분리 (.env로 이동, 코드에 하드코딩 금지)

# 본 세션 누적 commit (origin/main 모두 반영)

```
821735cf [Fix] astro.config 'server' → 'static' 회복 (운영 사고 복구)
22f4a658 [Feat] D 라운드 cycle 2: 시대 페이지 prerender + Supabase site_menu 적용
04cc48b6 [Feat] D 라운드 cycle 1: 시대별 페이지 + 사이드바 시대 메뉴 SQL
b03b830d [Refactor] 4/27 SSR 라운드 1 폐기 — origin/main 운영 진실로 정렬
b0222b51 [Chore] 사이트명 통일 + hero psd archive 이동
83c2da7e [Feat] B 라운드 — 시제 단위 swap 41수 정정
4cd4f314 [Feat] sonnet 30수 검수 + MINOR 6 정정
```

(추가로 어제·그제 commit + 4/27 + 4/14 이전 잔여 모두 origin/main 반영됨 — 4/14 이후 deploy 0이었던 상태에서 한 번에 정리)

# 누적 정합화 (그제~오늘)

| 라운드 | 분량 | 일자 |
|---|---|---|
| 도은집 | 252 | 4/27 |
| 근재집 | 127 | 4/28 오전 |
| 9 한자성씨 swap | 120 | 4/28 오후 |
| sonnet 30수 검수 + MINOR 6 | 6 | 4/29 오전 (A) |
| B 시제 단위 swap | 41 | 4/29 오후 (B) |
| **누적** | **546수** (전체 1,615의 **34%**) | — |

# 사이트 회복 검증 (운영)

| 페이지 | 응답 |
|---|---|
| `/` | 200 (Hero + 일일오수 + 오늘의 시인 + 소식) |
| `/community/`, `/hanja/`, `/hansi/`, `/hansi/chinese/reading/`, `/hansi/korean/poets/` | 200 |
| `/hansi/chinese/eras/{tang,song,qing,...}` (CN 7) | 200 (placeholder 콘텐츠) |
| `/hansi/korean/eras/{silla,goryeo,joseon}` (KR 3) | 200 (placeholder) |
| `/admin/`, `/tools/poetry_editor.html` | 200 |
| `/poets/`, `/poems/[id]`, `/eras/[slug]`, `/books`, `/china` (SSR 동적) | 404 (다음 cycle) |
| 사이드바 "오늘의 한시" + "시대" + 시대별 항목 | 운영 노출 |
