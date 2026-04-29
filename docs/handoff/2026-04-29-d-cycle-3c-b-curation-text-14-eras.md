---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: D 라운드 cycle 3c-B — 14시대 큐레이션 텍스트 전체 작성 (description + characteristics)
date: 2026-04-29
author: 민철
---

# 이번 세션에서 완료한 작업

cycle 3b 핸드오프의 4갈래 분기(A/B/C/D) 중 **B(14시대 큐레이션 텍스트)** 진행. 시범 2시대(성당·조선 후기)에 이어 남은 **14시대 description + characteristics 풍부판** 일괄 작성. 16시대 페이지 전체에 시대 배경·문학 사조 본문이 노출되는 상태로 만듦.

## 1. 작업 범위 결정 (3개 옵션 중)

| 옵션 | 결정 |
|---|---|
| A. 14시대 전부 작성 | ★ 채택 |
| B. 데이터 있는 8시대만 | 기각 (CN data_pending 6도 시대 배경 텍스트 의미 있음) |
| C. data_pending 풀고 + 텍스트 | 기각 (별 spec 침범, 한 cycle 과적재) |

## 2. 검수 단위 결정

권역별 4묶음으로 끊어서 진행 — 톤 교정 빠르고 컨텍스트 유지에 유리.

| 묶음 | 시대 | 결과 |
|---|---|---|
| 1 | CN 당대 3개 (초당·중당·만당) | 첫 검수에서 "더 풍부히" 피드백 → 분량 약 2배로 풀이 |
| 2 | KR 5개 (국가형성기~신라말기·고려 초중기·여말선초·조선 중기·근대) | 통과 |
| 3 | CN 한·위진남북조 (data_pending 2) | 통과 |
| 4 | CN 송·원·명·청 (data_pending 4) | 통과 |

## 3. 분량·톤 기준

- description ~350자: 정치·제도·사회 컨텍스트 (왕조 흥망·주요 사건·사회 변동)
- characteristics 단락 3개 ~600자: 문학 사조 변동 흐름 (작가·작품·시론)
- `\n`로 단락 구분, EraContent.astro에서 `<br>` 변환
- 학술적 톤, 한자 병기, 작가 생몰년 명시

## 4. EraContent.astro 박스 문구 정리

description이 모든 시대에 채워지므로, `data_pending` 박스 문구를 description과 자연 공존하도록 수정.

```diff
- 이 시대 한시 콘텐츠는 자료 수집 중입니다.
- 대표 시인·작품 데이터가 준비되는 대로 공개됩니다.
+ 이 시대의 대표 시인·작품 자료는 수집 중입니다.
+ 시대 배경과 한시의 특징은 아래에서 먼저 만나보실 수 있습니다.
```

## 5. 운영 반영

- 로컬 build 39 페이지 정상 (16시대 모두 prerender)
- root `dist/index.html` 확인 (4/29 'server' 모드 사고 학습 적용)
- commit `43d59bdf` push → GitHub Actions deploy
- 75초 대기 후 16시대 페이지 200 검증 (별도 검증 출력 참조)

# 어디서 멈췄는지

cycle 3c-B 완료. **16시대 모두에 시대 배경·문학 사조 본문이 노출**되는 상태. 다음 cycle은 cycle 3b 핸드오프 권장 1순위였던 **A (UI 폴리싱)** 또는 C/D, 또는 data_pending 6시대 데이터 적재.

UI 폴리싱은 진우형 디자인 input 필수 (cycle 3b 핸드오프 명시). 한시·시인 카드보다 description·characteristics 본문 자체의 한자 폰트·라인 높이·단락 처리도 폴리싱 대상.

# 핵심 판단과 이유

## 1. data_pending 시대도 description 작성 (옵션 A 채택)

**판단**: 시인·시 데이터가 0인 6시대(전한·후한·위진남북조·송·원·명·청)도 description + characteristics 작성.

**이유**:
- 시대 배경·문학 사조 텍스트 자체가 사용자에게 의미 있음. 빈 페이지 placeholder보다 학술적 가치 높음.
- 데이터 적재가 별 spec(`docs/spec/2026-04-29-cn-eras-data-ingestion.md`)으로 이미 분리되어 있음. 텍스트 작성 cycle과 데이터 적재 cycle을 분리하는 것이 합리적.
- 박스 문구를 "시인·작품 자료는 수집 중"으로 명확화하면 description과 공존 가능.

## 2. 첫 검수 후 분량 약 2배로 풀이

**판단**: 묶음 1 첫 작성(description ~200자, characteristics 단락 2개 ~300자) → 진우형 피드백 "맛보기 느낌만 남" → 풍부판으로 일괄 재작성.

**이유**:
- 첫 분량은 시범 성당과 정량 정합만 신경 썼으나 사조 변동 흐름이 너무 압축됨.
- 한시 시대 페이지의 학술적 가치가 핵심 콘텐츠 중 하나이므로, 입체적 사조 변동 서술이 필수.
- 풍부판 결정 후 묶음 1을 재작성하고 그 톤을 묶음 2~4에 일관 적용. 권역별 묶음 검수 방식이 톤 정합 검증에 효과적.

## 3. 권역별 4묶음 검수 (시대별 1:1 아님)

**판단**: 16시대를 한 번에 일괄 검수하지 않고 권역별 4묶음으로 끊어 검수.

**이유**:
- 시대별 1:1 검수는 진우형 시간 부담 큼 (14턴).
- 일괄 검수는 톤 드리프트·피로 누적 위험.
- 권역(당대 3 / KR 5 / CN 한·위진 2 / CN 송이후 4)별 묶음이 톤 일관성과 효율의 균형점.

## 4. 박스 문구만 다듬고 분기 로직은 유지

**판단**: data_pending 분기 로직(시인·시 카드 노출 안 함)은 그대로 두고 박스 문구만 수정.

**이유**:
- 시인·시 데이터가 실제로 0이므로 카드 영역은 노출하지 않는 것이 정합.
- 데이터가 들어오면 `data_pending: true`만 제거 → 박스 사라지고 카드 노출. 이행 비용 최소.
- description placeholder fallback 코드는 dead path가 됐지만 안전 차원에서 유지.

## 5. 시범 2시대(성당·조선 후기)는 그대로 유지

**판단**: cycle 3b에서 시범 작성된 성당·조선 후기는 손대지 않고, 묶음 2~4의 톤·분량을 그것과 정합시킴.

**이유**:
- 시범 톤이 이미 진우형 검수 통과한 기준점. 이를 흔들면 16시대 전체 톤 일관성이 무너짐.
- 분량은 풍부판이 시범보다 다소 길지만, 시범 텍스트도 충분히 학술적이라 함께 노출되어도 위계 깨지지 않음.

# 생성/수정/참조한 문서

## 생성

### 핸드오프
- `docs/handoff/2026-04-29-d-cycle-3c-b-curation-text-14-eras.md` (본 문서)

## 수정

### 코드
- `src/data/eras.ts`: 14시대 description + characteristics 추가
  - CN: 전한·후한 / 위진남북조 / 초당 / 중당 / 만당 / 송 / 원 / 명 / 청 (9개)
  - KR: 국가형성기~신라말기 / 고려 초중기 / 여말선초 / 조선 중기 / 근대 (5개)
- `src/components/EraContent.astro`: data_pending 박스 문구 정리

## 참조

- `docs/handoff/2026-04-29-d-cycle-3b-supabase-curated-and-era-page-fetch.md` (시범 톤·분량 기준)
- `docs/spec/2026-04-29-era-page-ui-polishing.md` (다음 cycle 후보 A)
- `docs/spec/2026-04-29-cn-eras-data-ingestion.md` (data_pending 6시대 데이터 적재 별 spec)

# 원래 계획과 달라진 점

## 1. 분량 2배로 풀이 (한 차례 재작성)

- 원: 시범 성당 톤·분량 그대로 (description ~200자, characteristics 단락 2개)
- 실제: 첫 검수 후 진우형 피드백 → 분량 2배 풍부판으로 묶음 1 재작성, 묶음 2~4에 일관 적용
- 영향: 작업 시간 약 1.5배. 그러나 한시 시대 페이지의 학술적 깊이가 본 사이트 정체성과 정합.

## 2. data_pending 6시대도 함께 작성

- 원: cycle 3b 핸드오프에서 "데이터 채우면 description 작성" 식으로 데이터 적재 cycle에 묶일 가능성
- 실제: 텍스트 작성 cycle에서 모두 처리. 박스 문구 다듬어 description과 공존.
- 영향: 데이터 적재 cycle은 description은 손대지 않고 시인·시 적재만 집중하면 됨.

# 다음 세션의 첫 행동

## 부트 루틴

1. 본 핸드오프 + cycle 3b 핸드오프 (시범 톤 기준 + UI 폴리싱 미완)
2. `git log --oneline -5` (commit 43d59bdf 확인)
3. 운영 sanity:
   - https://hanshinaru.kr/hansi/chinese/eras/qing/ (data_pending 풍부판)
   - https://hanshinaru.kr/hansi/korean/eras/ancient-silla/ (KR 한시 출발점)
4. 다음 cycle 결정:
   - **cycle 3c-A (UI 폴리싱)** ← 권장 1순위 (cycle 3b 핸드오프 70%)
   - cycle 3d (오늘의 한시)
   - cycle 3e (reading 검색)
   - cycle 4 (data_pending 6시대 데이터 적재)

## 다음 cycle 권장 (지분%)

| 순서 | 근거 |
|---|---|
| **1차: A (UI 폴리싱)** | 70% — 16시대 본문이 모두 들어왔으니 톤 정합·반응형·한자 미감이 가장 시급. 다른 페이지 만들 때마다 같은 임시 CSS 누적 위험 |
| 2차: 4 (data_pending 데이터 적재) | 시인·작품 풀이 들어오면 6시대 박스가 사라지고 카드 노출. 사이트 완성도 큰 전환 |
| 3차: C (오늘의 한시) | UI 폴리싱 후 적용 가능 |
| 4차: D (reading 검색) | SSR 결정 영향 |

# 다음 세션이 피해야 할 함정

## 1. 시범 2시대 톤 흔들지 말 것

성당·조선 후기 텍스트는 cycle 3b에서 시범 합의된 기준점. UI 폴리싱이나 추가 작성 시 이것의 톤·분량을 변경하지 말 것. 다른 14시대도 이것에 맞춰져 있으므로 흔들면 16시대 전체 톤 일관성 깨짐.

## 2. characteristics 단락 구분(`\n`) 보존

EraContent.astro에서 `\n` → `<br>` 변환. 단락 구분 없으면 600자 한 덩어리로 노출되어 가독성 무너짐. 텍스트 추가·수정 시 단락 위치 재검토.

## 3. data_pending 풀 때 description 보존

데이터 적재 cycle에서 `data_pending: true`만 제거하면 됨. description·characteristics 텍스트는 손대지 말 것 (이미 풍부판). 데이터에 맞춰 description 재작성하는 것은 불필요.

## 4. UI 폴리싱 시 본문 한자 처리

description·characteristics에 한자 병기 다수. 한자 폰트(Noto Serif SC) + 한글 폰트(본문) 위계 처리가 폴리싱의 핵심 과제. cycle 3b 핸드오프 spec(`era-page-ui-polishing.md`)의 "2. 한자 본문 표시"는 시 본문뿐 아니라 description 본문에도 해당.

# 후속 작업 (별도 spec/세션)

## D 라운드 후속

- **cycle 3c-A: UI 폴리싱** (`docs/spec/2026-04-29-era-page-ui-polishing.md`) ← 권장 1순위
- cycle 3d: "오늘의 한시" 페이지
- cycle 3e: reading 검색 페이지

## 데이터 수집 별 세션

- `docs/spec/2026-04-29-cn-eras-data-ingestion.md` (CN 6시대 + 미분류 당)
- `docs/spec/2026-04-29-kr-geundae-poets-ingestion.md` (KR 근대 6명)

이번 cycle에서 description·characteristics가 모두 들어왔으므로, 데이터 적재 cycle은 시인·시 큐레이션 풀 산출 + Supabase 적재에만 집중하면 됨.

# 본 세션 누적 commit (origin/main 반영)

```
43d59bdf [민철][Feat] D 라운드 cycle 3c-B: 14시대 큐레이션 텍스트 전체 작성
```

# 운영 노출 (오늘 변화)

## 시대 페이지 (16개 prerender)

- **풍부판 본문 노출 14시대 신규**:
  - CN: 초당·중당·만당 (큐레이션 데이터 + 본문)
  - CN: 전한·후한·위진남북조·송·원·명·청 (본문 + data_pending 박스)
  - KR: 국가형성기~신라말기·고려 초중기·여말선초·조선 중기·근대 (큐레이션 데이터 + 본문)
- **풍부판 본문 노출 시범 2시대 유지**: 성당·조선 후기 (cycle 3b 작성분 그대로)

## data_pending 박스 문구 정리

- 6시대(한·위진남북조·송·원·명·청) 박스: description과 자연 공존하는 문구로 변경

## 형 직접 확인 추천 URL

### 풍부판 신규 (큐레이션 데이터 있음)
- https://hanshinaru.kr/hansi/chinese/eras/chu-tang/ (초당)
- https://hanshinaru.kr/hansi/chinese/eras/wan-tang/ (만당)
- https://hanshinaru.kr/hansi/korean/eras/ancient-silla/ (국가형성기~신라말기)
- https://hanshinaru.kr/hansi/korean/eras/joseon-jung/ (조선 중기 — 백악시단 등장)

### data_pending + 풍부판 본문
- https://hanshinaru.kr/hansi/chinese/eras/song/ (송 — 박스 문구 + 풍부판)
- https://hanshinaru.kr/hansi/chinese/eras/qing/ (청 — 한시사 마지막 왕조)
