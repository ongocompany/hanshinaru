---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: D 라운드 cycle 3b — Supabase 큐레이션 적재 + 시대 페이지 fetch + site_menu 재구조화 + 운영 반영
date: 2026-04-29
author: 민철
---

# 이번 세션에서 완료한 작업

D 라운드 cycle 3a (구조 설계 + 큐레이션 풀)에 이어 cycle 3b 진입. **Phase 3 (Supabase 적재) + Phase 4 (UI fetch 통합) + C (site_menu 적용 + 운영 반영)** 한 세션에 끝냄.

## 1. Phase 3 — Supabase 큐레이션 테이블

### DDL (form 손으로 SQL Editor 적용)
- `scripts/migrations/2026-04-29-d-cycle3b-curated-tables.sql`
- 신규 테이블 2개:
  - `hansi_curated_poets` (jds_id PK, country, era_slug, name_ko, name_zh, life, bio, sort_order)
  - `hansi_curated_poems` (jds_id PK, FK→poets, body_zh, translation_ko, commentary_ko, is_notable, in_daily_pool, sort_order)
- RLS anon read 정책
- DDL은 PostgREST 미지원 → form Supabase Dashboard SQL Editor에서 한 번만 실행

### 동기화 (jds → Supabase)
- `scripts/curation/sync_to_supabase.mjs` (재실행 가능, --apply 플래그)
- 흐름: ssh jinas + psql로 jds JSON 추출 → PostgREST upsert (배치 50)
- 결과:
  - `hansi_curated_poets`: 186행 (시인 풀 173 + 시 풀 보완 13)
  - `hansi_curated_poems`: 417행 (일일풀 300 포함)
- payload: 시인 67.6 KB + 시 459.7 KB ≈ 530 KB (Supabase 무료 한도 0.1%)

### 시행착오 (3 fix)
1. **NOT NULL name_ko 위반**: jds CN 일부 시인(貫休 등 24명) name_ko=null. 한자명 fallback (`name_ko ?? name_zh`)
2. **빈 응답 JSON.parse**: `Prefer: return=minimal` 시 status 200 빈 본문. text 길이 체크 후 parse
3. **FK 위반**: 시 풀 시인이 시인 풀에 없음 (예: 세종 — 조선 전기 poem_count=1, 시인 풀 25 cap에 밀림). 시 풀 시인을 자동 보완 (sort_order=999 후순위)

## 2. Phase 4 — 시대 페이지 fetch 통합

### 신규
- `src/lib/curated.ts`: `getEraPoets`, `getEraPoems` (publishable key + RLS)
- `src/components/EraContent.astro`: CN/KR 공용 본문 컴포넌트
  - 4섹션: 시대 배경·한시 특징·대표 시인·대표 작품
  - `data_pending` 분기: "자료 수집 중" 박스
  - 시 카드: title_zh + poet_name + body_zh 미리보기 2줄 + translation 2줄

### 시범 큐레이션 텍스트 (2시대)
- `src/data/eras.ts` 보강:
  - **성당** (CN sheng-tang): 당 현종 개원·천보 연간, 안사의 난 분기점, 이백·두보·왕유·맹호연·고적·잠삼 풍격 정점
  - **조선 후기** (KR joseon-hu): 백악시단 진경시 + 실학파, 김창협·김창흡·이병연·정약용·박지원, "조선풍" 자기 표현 매체로 성숙

### 시대 페이지 단순화
- `[slug].astro` (CN, KR) 모두 EraContent 호출만 — 로직 컴포넌트로 이동

## 3. C — site_menu 재구조화 (cycle 3a SQL 자동화)

### 변경
- `scripts/migrations/apply_d_cycle3a_era_restructure.mjs` (PostgREST DELETE+INSERT)
- 기존 자식 10행 (id 47~56) DELETE → 새 16행 (id 57~72) INSERT
- 부모 ID 45·46 보존 (cycle 1 결과)

### 결과
- CN 10 시대 메뉴: 전한·후한 / 위진남북조 / 초당 / 성당 / 중당 / 만당 / 송 / 원 / 명 / 청
- KR 6 시대 메뉴: 국가형성기~신라말기 / 고려 초중기 / 여말선초 / 조선 중기 / 조선 후기 / 근대
- site_menu hansi section: 20행 → 26행 (부모 6 + 자식 20)

## 4. 운영 반영 + 검증

### 빌드·푸시
- `astro.config.mjs` `output: 'static'` 유지 (4/29 사고 학습)
- 로컬 build: 39 페이지 정적 prerender (시대 16 모두 포함)
- push (commit `9f547e44`) → GitHub Actions deploy 49초

### 사고 미발생 ✓
- 4/29 cycle 1+2의 'server' 모드 사고 학습 → 사전 dist 구조 확인 (root index.html ✓)
- site_menu SQL은 push 직전에 적용 (build time fetch 정합)

### 운영 검증 (모두 200)
| 페이지 | 응답 | 비고 |
|---|---|---|
| `/`, `/hansi/`, `/hansi/general/` | 200 | 기존 페이지 유지 |
| **CN 10 시대 페이지** | 200 (10/10) | sheng-tang 시인·시 노출 ✓ |
| **KR 6 시대 페이지** | 200 (6/6) | joseon-hu 시인·시 노출 ✓ |
| 사이드바 새 메뉴 (초당·성당·중당·만당·국가형성기·여말선초·근대 등) | 노출 ✓ | build time site_menu fetch 반영 |

# 어디서 멈췄는지

cycle 3b 완료. 운영 반영 정상. 다음 cycle 후보는 4갈래로 분기:

- **A. UI 폴리싱** ← 권장 우선 (form input 필수)
- B. 남은 14시대 큐레이션 텍스트 작성 (description/characteristics)
- C. "오늘의 한시" 페이지 본격 (`/hansi/{c,k}/poets/`)
- D. reading 검색 페이지

본 세션 산출 페이지는 **기능·데이터·운영 노출 완료**이지만 **디자인 폴리싱 미완**:
- EraContent.astro CSS는 임시(인라인 placeholder 수준)
- 한자 본문 폰트·간격·줄바꿈 미정합
- 모바일 반응형 미검증
- 사이트 홈 톤(서화 콜렉션·동양적 미감)과 단절

→ spec stub: `docs/spec/2026-04-29-era-page-ui-polishing.md`

# 핵심 판단과 이유

## 1. Supabase 큐레이션 subset (옵션 B 채택)

**판단**: jds 全 동기화(178MB) 대신 큐레이션 subset(530KB)만 Supabase 적재.

**이유**:
- Supabase 무료 500MB 용량은 들어가지만 **egress 5GB/월** 진짜 위험. 클라이언트 raw fetch 시 30~50회 카탈로그 다운로드면 cap.
- 본 세션 목표(육안 확인)에 큐레이션 173+417로 충분.
- D그룹(시 본문 47k·시인 상세 2.8k)은 별 cycle에서 A(전량 동기화) 또는 C(jinas SSR 살리기) 결정.

## 2. DDL은 form 손, DML은 PostgREST 자동화

**판단**: DDL(테이블 생성, RLS, 인덱스)은 Supabase Dashboard SQL Editor 1회 실행. 데이터 적재(INSERT/UPDATE/DELETE)는 PostgREST + service_role.

**이유**:
- Supabase는 DDL을 PostgREST·RPC로 노출 안 함 (관리 API 별도 토큰 필요).
- DDL은 1회만 필요하고 SQL 파일로 보존 → form 손이 안전.
- DML 자동화는 sync 재실행·마이그레이션 적용에 필수.

## 3. site_menu 자식 재생성 방식 (UPDATE 대신 DELETE+INSERT)

**판단**: 기존 자식 10행 모두 DELETE → 새 16행 INSERT (id 47~56 → 57~72).

**이유**:
- UPDATE 방식이면 매 행 매 컬럼 정확히 갱신 필요 (label·path·sort_order 모두 바뀜).
- DELETE+INSERT가 단순·검증 명확. 부모 ID(45·46)·section은 변하지 않으므로 안전.
- 단점: id 번호 변경. 단 site_menu id를 외부 참조하는 코드 없음 (path가 ID 역할).

## 4. data_pending 플래그로 빈 시대 통합 처리

**판단**: CN 6시대(한·위진·송·원·명·청) `data_pending: true`, EraContent에 분기.

**이유**:
- 빈 데이터로 카드 노출하면 "데이터 준비 중" 빈 리스트 → 사용자 혼란.
- 안내 박스로 명시 → 의도된 placeholder. spec과 연결됨을 사용자에게도 신호.
- KR `근대`(7수)는 분량 적지만 황현 절명시 등 의미 있어 정상 노출 (data_pending 안 씀).

## 5. 시 풀 시인 자동 보완 (FK 위반 fix)

**판단**: 시인 풀에 없지만 시 풀에 있는 시인을 자동 추가 (sort_order=999).

**이유**:
- 큐레이션 빌더가 시인 풀(poem_count 상위)과 시 풀(notable+quality)을 독립 계산해서 발생.
- 빌더 수정보다 sync 시 보완이 단순. sort_order=999로 시인 grid 끝에 노출.
- 13명 보완(173 → 186). 세종(조선 전기 시 1수) 같은 단발 시인이 시 큐레이션에 들어옴.

## 6. CSS 폴리싱은 별 세션 (AI 단독 위험)

**판단**: EraContent.astro CSS는 임시 인라인 박스(border-radius 4px, gap 12px). 폴리싱은 별 cycle.

**이유**:
- AI가 디자인 톤 추론으로 폴리싱하면 사이트 정체성과 단절 위험 큼.
- 형이 운영 보면서 "여기 이렇게" 식 input 흐름이 정합적.
- 본 세션 목표는 *육안 확인 가능* — 기능 노출이 우선, 폴리싱은 다음.

# 생성/수정/참조한 문서

## 생성

### 핸드오프
- `docs/handoff/2026-04-29-d-cycle-3b-supabase-curated-and-era-page-fetch.md` (본 문서)

### 코드
- `src/lib/curated.ts` (Supabase 큐레이션 fetch 헬퍼)
- `src/components/EraContent.astro` (CN/KR 공용 시대 페이지 본문)

### 마이그레이션·스크립트
- `scripts/migrations/2026-04-29-d-cycle3b-curated-tables.sql` (DDL, form 적용)
- `scripts/migrations/apply_d_cycle3a_era_restructure.mjs` (site_menu DELETE+INSERT, PostgREST)
- `scripts/curation/sync_to_supabase.mjs` (jds → Supabase 동기화, 재실행 가능)

### Spec Stub
- `docs/spec/2026-04-29-era-page-ui-polishing.md` (UI 폴리싱 별 세션)

## 수정
- `src/data/eras.ts`: 성당·조선 후기 description·characteristics 보강
- `src/pages/hansi/chinese/eras/[slug].astro`: EraContent 호출로 단순화
- `src/pages/hansi/korean/eras/[slug].astro`: 동일

## DB 변경

### Supabase
- DDL: `hansi_curated_poets` + `hansi_curated_poems` 신규 + RLS
- DML (sync): poets 186행 / poems 417행 INSERT
- DML (site_menu): 자식 10행 DELETE + 16행 INSERT (id 57~72)

# 원래 계획과 달라진 점

## 1. 한 세션에 D(A+B) + C 모두 끝냄
- 원: 본 세션은 cycle 3a 큐레이션 풀까지. 적재·UI·push는 다음 cycle.
- 실제: 형 결정 "이어서 진행", D + C 한 번에. 약 60~70분.
- 영향: 본 세션 산출 commit 2개 (cycle 3a + cycle 3b). 다음 세션은 UI 폴리싱 또는 콘텐츠 작성에 집중 가능.

## 2. DDL form 손 적용 (1회)
- 원: 모든 마이그레이션 PostgREST 자동화
- 실제: DDL은 PostgREST 미지원, Supabase Dashboard 사용
- 영향: 1회 form 개입. 이후 마이그레이션은 SQL 파일 보존 + DML 자동화

## 3. 시 풀 시인 보완 로직 추가
- 원: 시인 풀 = 시인 큐레이션 결과 그대로
- 실제: 시 풀 시인 합집합 (FK 보장)
- 영향: 시인 186명 (큐레이션 173 + 보완 13). sync_to_supabase.mjs에 자동 처리

## 4. 운영 반영 시 first sleep 35초 부족
- 원: GitHub Actions deploy 후 즉시 검증
- 실제: 첫 검증 시 nginx 캐시 갱신 미반영 → 재시도 후 200
- 영향: 사고 아님. 단 deploy 검증 sleep 50초 권장 (본 세션 학습)

# 다음 세션의 첫 행동

## 부트 루틴

1. 본 핸드오프 + cycle 3a 핸드오프 + cycle 1+2 핸드오프
2. `git log --oneline -5` (commit d4fc842c, 9f547e44 확인)
3. 운영 sanity (https://hanshinaru.kr/hansi/chinese/eras/sheng-tang/)
4. 다음 cycle 결정 (A/B/C/D 중 하나):
   - A. UI 폴리싱 (`docs/spec/2026-04-29-era-page-ui-polishing.md`)
   - B. 14시대 큐레이션 텍스트 작성
   - C. "오늘의 한시" 페이지
   - D. reading 검색 페이지

## 다음 cycle 권장 순서 (지분%)

| 순서 | 근거 |
|---|---|
| **1차: A (UI 폴리싱)** | 70% — 형 input 필요, 운영 톤 정합성 우선. 빠르게 못 미루면 다른 페이지 만들 때마다 같은 임시 CSS 누적 위험 |
| 2차: B (큐레이션 텍스트) | 분량 큰 작업, 한 시대당 200~400자 × 14 = 2,800~5,600자 학술 텍스트. AI 초안 + form 검수 |
| 3차: C (오늘의 한시) | 일일 풀 데이터(daily-pool.json) 이미 있음. UI 폴리싱 결과 적용 가능 |
| 4차: D (reading 검색) | 시 카탈로그 fetch 패턴 확립 후. SSR 결정 영향 |

# 다음 세션이 피해야 할 함정

## 1. UI 폴리싱 AI 단독 위험
- EraContent.astro CSS는 placeholder. 다른 페이지 만들 때 그대로 복사하지 말 것.
- 형의 디자인 input 받기 전까지는 새 페이지에도 임시 CSS 명시(// TODO: polish)

## 2. Supabase egress 모니터링 시작
- 큐레이션 적재 분량 작지만(530KB), 시 본문 한자+번역 매번 fetch면 누적
- reading 검색 페이지 구현 시 페이지네이션·캐싱 필수
- Supabase Dashboard에서 egress 주간 모니터 권장

## 3. site_menu id 변경 영향
- cycle 3b에서 자식 행 id 47~56 → 57~72로 변경
- 외부 코드에서 id 참조하는 곳 없는 걸 확인했지만, 향후 menu 코드 변경 시 path 기반으로만 라우팅

## 4. data_pending 시대 별 세션 진입 시점
- CN 6시대 + KR 근대 보강은 별 spec (이미 stub 있음)
- 데이터 채우면 `eras.ts`의 `data_pending: true` 플래그 제거 + sync 재실행

## 5. PostgREST DDL 한계
- 향후 hansi_curated_* 스키마 변경 (컬럼 추가 등) 시 form 개입 또 필요
- Supabase Migration CLI 도입 검토 (장기)

# 후속 작업 (별도 spec/세션)

## D 라운드 후속
- **cycle 3c-A: UI 폴리싱** (`docs/spec/2026-04-29-era-page-ui-polishing.md`)
- cycle 3c-B: 14시대 큐레이션 텍스트
- cycle 3d: "오늘의 한시" 페이지
- cycle 3e: reading 검색 페이지
- cycle 4: SSR 결정 (시 본문·시인 상세)

## 데이터 수집 별 세션 (기존)
- `docs/spec/2026-04-29-cn-eras-data-ingestion.md` (CN 6시대 + 미분류 당)
- `docs/spec/2026-04-29-kr-geundae-poets-ingestion.md` (KR 근대 6명)

# 본 세션 누적 commit (origin/main 반영)

```
9f547e44 [Feat] D 라운드 cycle 3b: Supabase 큐레이션 적재 + 시대 페이지 fetch + site_menu 재구조화
d4fc842c [Feat] D 라운드 cycle 3a: 시대 재구조화 (CN 10 + KR 6) + Phase 1 큐레이션 풀 산출
```

# 운영 노출 (오늘 변화)

## 사이드바 (build time site_menu fetch)
- "오늘의 한시" (cycle 1) 유지
- "시대" (cycle 1) 부모 유지
- **시대 자식 16개 (CN 10 + KR 6) 새 슬러그 노출** ← cycle 3b

## 시대 페이지 (16개 prerender)
- 시범 콘텐츠: 성당·조선 후기 (description + characteristics + 시인·시)
- placeholder: 다른 14시대 (description·characteristics 비어있음, 시인·시는 fetch 결과 노출)
- data_pending 6 CN 시대: 안내 박스만 노출

## 형 직접 확인 추천 URL
- https://hanshinaru.kr/hansi/chinese/eras/sheng-tang/ (성당, 풍부 시범)
- https://hanshinaru.kr/hansi/korean/eras/joseon-hu/ (조선 후기, 풍부 시범)
- https://hanshinaru.kr/hansi/chinese/eras/qian-han/ (data_pending 시범)
- https://hanshinaru.kr/hansi/korean/eras/geundae/ (근대 황현 7수, 미니멀)
