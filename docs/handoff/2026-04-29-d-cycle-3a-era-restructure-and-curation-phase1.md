---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: D 라운드 cycle 3a — 시대 재구조화 (사조/시기 분화) + Phase 1 큐레이션 풀 산출
date: 2026-04-29
author: 민철
---

# 이번 세션에서 완료한 작업

D 라운드 cycle 3a — **한시 페이지 육안 확인 가능화** 1단계 (큐레이션 데이터 기초 산출).
앞 cycle 1+2에서 시대 페이지 + 사이드바 메뉴 운영 노출 완료. 본 cycle은 시대 구조 자체를 사조/시기 기반으로 재설계 + DB ID 풀 추출.

## 1. 데이터 흐름 옵션 결정 (Supabase 큐레이션 subset)

운영 옵션 3가지 비교:
- A. Supabase 全 동기화 (178MB / 500MB cap, 5GB egress 위험)
- B. **Supabase 큐레이션 subset** ← 채택
- C. jinas SSR Node 살리기 (사고 위험, 4/29 학습)

**판단**: 본 세션 목표(육안 확인)에는 B 충분. D그룹(시 본문 47,571·시인 상세 2,873) 노출은 별 cycle에서 A 추가 또는 C 결정.

## 2. 시대 구조 재설계 (3·3 → 10·6)

### CN 7 → 10 (당 4분화)
| 슬러그 | 한글 | 한자 | 연대 |
|---|---|---|---|
| qian-han | 전한·후한 | 兩漢 | BCE 202~CE 220 |
| wei-jin | 위진남북조 | 魏晉南北朝 | 220~589 |
| **chu-tang** | 초당 | 初唐 | 618~712 |
| **sheng-tang** | 성당 | 盛唐 | 712~766 |
| **zhong-tang** | 중당 | 中唐 | 766~835 |
| **wan-tang** | 만당 | 晚唐 | 836~907 |
| song | 송 | 宋 | 960~1279 |
| yuan | 원 | 元 | 1271~1368 |
| ming | 명 | 明 | 1368~1644 |
| qing | 청 | 淸 | 1644~1912 |

### KR 3 → 6 (왕조 → 시기 분화)
| 슬러그 | 한글 | 한자 | 연대 |
|---|---|---|---|
| ancient-silla | 국가형성기~신라말기 | 古代~新羅末 | ?~935 |
| goryeo-early-mid | 고려 초중기 | 高麗 初中期 | 918~1259 |
| goryeo-mal-joseon-cho | 여말선초 | 麗末鮮初 | 1259~1567 |
| joseon-jung | 조선 중기 | 朝鮮 中期 | 1567~1724 |
| joseon-hu | 조선 후기 | 朝鮮 後期 | 1724~1864 |
| geundae | 근대 | 近代 | 1864~1950 |

설계 회차: 3단계(왕조) → 7단계(사조) 제안 → 형 reframe "사조 매핑 비용 큼, 시기 분화로 자동 매칭" → 6단계 시기 분화 확정.

## 3. 데이터 공백 발견 (CN 결정적)

| CN 시대 | jds 시인 | jds 시 |
|---|---|---|
| qian-han | **0** | **0** |
| wei-jin | **0** | **0** |
| chu/sheng/zhong/wan-tang (4분화) | 108 | 28,313 |
| **'당' 미분화** | **2,628** | **17,586** |
| song/yuan/ming/qing | **0/0/0/0** | **0/0/0/0** |

→ CN 10시대 중 **6시대 데이터 0**, 당대 96%(2,628명)가 미분류. 본 세션 큐레이션은 **당 4분화에만 가능**, 나머지는 page placeholder 유지.
→ spec stub 작성: `docs/spec/2026-04-29-cn-eras-data-ingestion.md`

| KR 시대 | jds 시인 | jds 시 (translated) |
|---|---|---|
| ancient-silla | 13 | 52 |
| goryeo-early-mid | 13 | 58 |
| goryeo-mal-joseon-cho | 46 | 982 |
| joseon-jung | 27 | 287 |
| joseon-hu | 27 | 224 |
| geundae | 7 | 7 (전부 황현) |

→ 근대 7수 빈약. spec stub 작성: `docs/spec/2026-04-29-kr-geundae-poets-ingestion.md` (안중근·강위·이건창·김택영·정인보·최송설당 적재)

## 4. Phase 1 큐레이션 풀 산출

### 4.1 raw 데이터 추출 (jds@jinas:5433)
- `data/curation/kr_poets_raw.json` (132명)
- `data/curation/cn_poets_raw.json` (108명, 당 4분화만)
- `data/curation/poems_raw.json` (translated 전체, 7 MB, era_slug 분류 + 우선순위 정렬)

### 4.2 큐레이션 빌더
- `scripts/curation/build_curation_pools.mjs`: 시대별 편차 적용 (`TARGETS`)
  - 시인: poem_count 상위 N명 (시대별 7~25명)
  - 시: notable + quality 우선, 시인당 cap (5~12, 시대별)
  - 일일풀: 각 시대 `daily` 분담 합산

### 4.3 산출물 (3 JSON)
| 파일 | 분량 | 용도 |
|---|---|---|
| `data/curation/eras-poets.json` | 시대별 시인 ID 풀 | 시대 페이지 "대표 시인" 섹션 |
| `data/curation/eras-poems.json` | 시대별 시 ID 풀 | 시대 페이지 "대표 작품" + reading 페이지 카탈로그 |
| `data/curation/daily-pool.json` | CN 200 / KR 100 | "오늘의 한시" 일일 회전 |

### 4.4 시대별 큐레이션 결과

```
시대 슬러그              | 시인 | 시  | 일일
─────────────────────────────────────────────
ancient-silla            |   13 |  25 |   12
goryeo-early-mid         |   13 |  30 |    8
goryeo-mal-joseon-cho    |   25 |  50 |   28
joseon-jung              |   20 |  40 |   22
joseon-hu                |   20 |  40 |   23
geundae                  |    7 |   7 |    7
chu-tang                 |   11 |  35 |   25
sheng-tang               |   20 |  60 |   60
zhong-tang               |   22 |  70 |   65
wan-tang                 |   22 |  60 |   50
qian-han / wei-jin / song / yuan / ming / qing |  0 (data_pending)
─────────────────────────────────────────────
일일풀: CN 200 / KR 100 ✓ (지정값 정확)
```

## 5. 코드·SQL 산출물

- `src/data/eras.ts`: 10 → 17 항목 (CN 10 + KR 6 + KR ancient-silla 1 별도). `data_pending: true` 플래그로 빈 시대 표시.
- `scripts/migrations/2026-04-29-d-cycle3a-era-restructure.sql`: site_menu 시대 자식 행 DELETE+INSERT (CN 7→10, KR 3→6, parent 45·46 유지)

## 6. 빌드 검증

- `npx tsc --noEmit` (src/) — 무결
- `npm run build` — 39 페이지 정적 생성, **시대 페이지 16개 모두 200 prerender**:
  - CN: qian-han, wei-jin, chu-tang, sheng-tang, zhong-tang, wan-tang, song, yuan, ming, qing
  - KR: ancient-silla, goryeo-early-mid, goryeo-mal-joseon-cho, joseon-jung, joseon-hu, geundae
- 운영 push 안 함 (UI 미연동 + site_menu SQL 미적용 → 다음 cycle에서 함께)

# 어디서 멈췄는지

Phase 1 산출물 완료. 형 합의 후 다음 cycle:

- **Phase 2**: 시대별 시대배경·한시특징 큐레이션 텍스트 작성 (16시대 × 2섹션 = 32 본문, 단 빈 6시대는 "콘텐츠 준비 중"). AI 초안 + 형 검수.
- **Phase 3**: Supabase 큐레이션 테이블 설계·적재 (`hansi_curated_poems`, `hansi_curated_poets`)
- **Phase 4**: UI 구현 (시대 페이지 4섹션 + 오늘의 한시 + reading 검색)
- **Phase 5**: 운영 검증 + push (site_menu SQL 함께 적용)

# 핵심 판단과 이유

## 1. 사조 매핑 → 시기 분화 (KR)

**판단**: 7단계 사조(나말여초·죽림고회·여말선초·삼당사림·사대가·백악·여항) 제안 → 6단계 시기(국가형성기·고려초중기·여말선초·조선중기·조선후기·근대)로 단순화.

**이유**: 사조 매핑은 era_period 단순 매칭 불가능 — "조선 후기" 27명에 백악시단·실학파·여항이 다 섞여 있어 시인 단위 수동 큐레이션 필수. 형 결정: "그 비용 안 가져가도 된다, 시기 분화는 era_period 자동 매칭됨". 학습 페이지 본질은 *시기 단위 한시 흐름* 보여주는 것이라 시기 분화로도 충분.

## 2. 당 4분화 채택 (CN)

**판단**: 학계 통설 4분화(초·성·중·만) — 3분화 안 함.

**이유**: 성당(이백·두보)과 중당(백거이·한유)이 미감 다름. 3분화는 두 시대 합쳐야 해서 부정확. jds 데이터도 4분화 분류된 시인 108명이 분리되어 있음.

## 3. 미분류 당 2,628명 별 세션

**판단**: 본 세션 큐레이션 대상 제외. 당 4분화에는 분화된 108명/28,313수만 사용.

**이유**: 2,628명 자동 재분류는 생몰 연도 기준 작업이 가능하지만 검증 비용 큼. 본 세션 목표(육안 확인)에는 분화된 108명만으로 4페이지 채우기 충분 (chu/sheng/zhong/wan = 11/20/22/22 시인).

## 4. CN 6시대 데이터 0 — page placeholder 유지

**판단**: 한·위진·송·원·명·청 6페이지는 `data_pending: true` 플래그. UI는 빌드되지만 콘텐츠는 "준비 중".

**이유**: jds에 0명/0수. 강제로 채우려면 데이터 수집 필요(시대당 며칠 작업). 본 세션 범위 밖. spec stub으로 별 세션 trigger.

## 5. 시인당 시 cap 시대별 차등

**판단**: 일률 cap 5 → 시대별 5~12.

**이유**: ancient-silla는 최치원 비중 압도적(40수), cap 5면 풀이 18수에 머묾. cap 12로 풀어 25수 확보. geundae는 황현 단독, cap 7로 7수 전부 노출. 다른 시대는 cap 5 유지(다양성).

## 6. 일일풀 분담 비율

**판단**: KR 100 = ancient 12 + goryeo-em 8 + goryeo-mjc 28 + jj 22 + jh 23 + 근대 7. CN 200 = chu 25 + sheng 60 + zhong 65 + wan 50.

**이유**:
- KR: 데이터 풍부 시대(여말선초 982수, 조선중기 287수, 조선후기 224수)에 비중. 신라·고려초중기는 가용성 한계.
- CN: 중당(12,692수)·만당(9,629수)이 데이터 풍부 → 비중 큼. 초당(1,113수)은 적음.

# 생성/수정/참조한 문서

## 생성 (본 세션)

### 핸드오프
- `docs/handoff/2026-04-29-d-cycle-3a-era-restructure-and-curation-phase1.md` (본 문서)

### 코드·데이터
- `src/data/eras.ts` (재작성, 10→17 시대 + `data_pending` 필드)
- `data/curation/kr_poets_raw.json` (132명 raw)
- `data/curation/cn_poets_raw.json` (108명 raw, 당 4분화)
- `data/curation/poems_raw.json` (translated 전체, 7 MB)
- `data/curation/eras-poets.json` (큐레이션 결과, 시인)
- `data/curation/eras-poems.json` (큐레이션 결과, 시)
- `data/curation/daily-pool.json` (CN 200 / KR 100)

### 도구·스크립트
- `scripts/curation/extract_era_poets.sql` (참조용)
- `scripts/curation/build_curation_pools.mjs` (큐레이션 빌더, 재실행 가능)

### 마이그레이션
- `scripts/migrations/2026-04-29-d-cycle3a-era-restructure.sql` (site_menu 시대 재구조화)

### Spec Stub (별 세션)
- `docs/spec/2026-04-29-cn-eras-data-ingestion.md` (CN 6시대 + 미분화 당 2,628명)
- `docs/spec/2026-04-29-kr-geundae-poets-ingestion.md` (안중근 등 6명 적재)

## 참조
- `docs/handoff/2026-04-29-d-cycle-1-2-ui-integration-with-incident.md` (cycle 1+2)
- `~/Documents/development/jds/` (CN 데이터 수집 시 파이프라인 참조)

# 원래 계획과 달라진 점

## 1. 시대 구조 결정 회차 4번
- 원: cycle 3a = 시대 페이지 콘텐츠 채우기 (cycle 1+2 핸드오프 line 244)
- 실제: 시대 구조 자체를 재설계 (왕조 → 사조 → 시기). 형 reframe 4회.
- 영향: 콘텐츠 채우기는 Phase 2로 분리. 본 세션은 데이터 기초 + 구조 정합화에 집중.

## 2. CN 데이터 공백 결정적 발견
- 원: CN 시대 페이지도 콘텐츠 채울 수 있다고 가정
- 실제: CN 6시대 jds 0명/0수 + 당 96% 미분류. 본 세션 큐레이션은 KR 132명 + CN 108명만.
- 영향: spec stub 2개 추가 (CN 6시대 + 미분류 당). cycle 3b도 KR 풍부, CN 빈약.

## 3. 사조 → 시기 단순화
- 원: 사조 7단계 (학계 통설 정확)
- 실제: 시기 6단계 (자동 매칭 가능)
- 영향: 시인 단위 수동 매핑 작업량 제거. 추후 사조 분화는 별도 spec 가능 (현재 보류).

# 다음 세션의 첫 행동

## 부트 루틴

1. 본 핸드오프 + cycle 1+2 핸드오프
2. `data/curation/*.json` 산출물 검토 (파일 크기·시대별 분포)
3. `git status` (미커밋 산출물 정상)

## 우선 후속 (D 라운드 cycle 3b — UI 통합)

### 3b-1. site_menu 마이그레이션 적용 + push
- `scripts/migrations/2026-04-29-d-cycle3a-era-restructure.sql` Supabase 적용
- src/data/eras.ts 새 슬러그가 메뉴와 정렬되어야 push 가능

### 3b-2. Supabase 큐레이션 테이블 적재 (Phase 3)
- 새 테이블: `hansi_curated_poems`, `hansi_curated_poets`
- jds → Supabase 동기화 스크립트 (재실행 가능)
- 적재 분량: 시인 ~240명 + 시 ~445수 + bio_ko + body_zh + translation_ko + commentary_ko

### 3b-3. 시대 페이지 4섹션 채우기 (Phase 4)
- 시대 배경·한시 특징: `eras.ts` description·characteristics 필드 (큐레이션 텍스트, AI 초안 → 형 검수)
- 대표 시인·대표 작품: Supabase fetch (`hansi_curated_*`)
- 빈 6 CN 시대(`data_pending`)는 "콘텐츠 준비 중" 일관 처리

### 3b-4. "오늘의 한시" 페이지 구현
- `/hansi/{c,k}/poets.astro` placeholder → 본격
- 일일 회전 풀 fetch + 시인 카드 + 시집 입문

### 3b-5. reading 검색 페이지
- `/hansi/{c,k}/reading.astro` placeholder → 본격
- 사이드바 필터 + 검색창 + 결과 페이지네이션

# 다음 세션이 피해야 할 함정

## 1. site_menu SQL 적용 + push 동기화
cycle 1 SQL이 이미 적용된 상태에서 cycle 3a SQL을 돌려야 함. 부모 행(45·46) 보존 + 자식 행만 DELETE/INSERT. 부모 ID가 다르면 SQL의 `parent_id IN (45, 46)` 조건 실패하니 **사전 부모 ID 확인** 필수.

## 2. eras.ts 슬러그 vs site_menu path 매칭
새 슬러그 16개가 site_menu path와 정확히 일치해야 사이드바 → 시대 페이지 링크 작동. 마이그레이션 적용 후 운영 sanity check (`/hansi/chinese/eras/chu-tang/` 등 16 URL 200 확인).

## 3. data_pending 빈 시대 일관 처리
CN 6시대는 큐레이션 0. UI에서 placeholder 분기 처리 안 하면 빈 카드/빈 리스트 노출. 시대 페이지 컴포넌트에 `era.data_pending` 분기 필수.

## 4. Supabase egress 모니터링
큐레이션 subset이라 분량 작지만(시 ~445수 × 3KB ≈ 1.3MB), reading 검색에서 클라이언트 fetch 패턴이 잘못되면 5GB egress 한도 압박. PostgREST 쿼리 페이지네이션·캐싱 필수.

## 5. 미분류 당 2,628명 검색 표시
현재 큐레이션은 4분화된 108명만. reading 검색에서 "당대 시인" 검색 시 2,628명도 노출돼야 함 (제거하면 데이터 손실). 검색 인덱스에 era_period='당' 미분류도 포함.

# 본 세션 누적 commit (예정 — 형 검토 후)

```
[민철][Feat] D 라운드 cycle 3a: 시대 재구조화 (CN 10 + KR 6) + Phase 1 큐레이션 풀 산출
[민철][Docs] CN/KR 데이터 수집 별 세션 spec stub 2개
```

# 후속 작업 (별도 spec/세션)

## D 라운드 후속 (계속)
- **cycle 3b**: UI 통합 (Phase 2~5)
- cycle 4: SSR Node 살리기 또는 D그룹 정적 prerender 검토
- cycle 5: reading 검색 풍부화
- cycle 6: 미커밋 18 .html 정리
- cycle 7: 홈 분리·정제

## 데이터 수집 별 세션
- `docs/spec/2026-04-29-cn-eras-data-ingestion.md` — CN 6시대 + 미분류 당 재분류
- `docs/spec/2026-04-29-kr-geundae-poets-ingestion.md` — KR 근대 6명 시인 적재

## 정합화 후속 (낮은 우선순위)
- C 옵션: opus-subagent 1,178수 정밀 sample 검수
- 자동 색인 잔여 swap 검사
- 김창흡 잔여 18수 진짜 시 검증
