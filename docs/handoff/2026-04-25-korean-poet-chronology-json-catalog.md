---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 한국 시인 연대기 JSON catalog와 GPT-5.4 병렬 수집 지시서
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 이전 세션 최신 커밋 `0fd500df [지훈][Docs] Add Korean poet chronology seed catalog`를 확인했다.
- 현재 사이트의 기존 시인/작품 처리 방식을 확인했다.
  - 중국 한시 본편은 `public/index/db_author.with_ko.json`의 `authors`와 `public/index/poems.full.json`/`poems.compact.json` 계열을 사용한다.
  - 한국 시인 화면은 현재 `public/index/korean_timeline.json` 기반의 시대별 시인/작품 묶음 구조를 쓴다.
  - 한국 한시 수집 작업은 `docs/spec/korean-hansi-*.json`에 권리·원문·번역 상태를 분리해 쌓는 방식이다.
- `scripts/build_korean_poet_chronology_catalog.js`를 추가했다.
- 시인과 작품을 별도 JSON으로 분리해 생성했다.
  - 기준본: `docs/spec/korean-poets-chronology.v1.json`
  - 기준본: `docs/spec/korean-poems-chronology.v1.json`
  - 사이트 fetch용 mirror: `public/index/korean_poets_chronology.v1.json`
  - 사이트 fetch용 mirror: `public/index/korean_poems_chronology.v1.json`
- 기존 direct-text 수집본을 새 작품 catalog에 매핑했다.
  - 최치원 `孤雲集 卷一`
  - 정지상 `東文選`/`新增東國輿地勝覽` tranche
- 정지상 tranche 내부 중복 제목은 `sourceVariants`로 병합해 같은 작품 카드가 중복 생성되지 않도록 했다.

# 산출물 요약

- 시인 catalog: 97명
- V1 우선 작가: 28명
- 등급 분포: C 8명, A 34명, B 55명
- 작품 catalog: 213건
  - direct-text 확보: 45건
  - 후보만 존재: 168건

# 핵심 판단과 이유

- 지금 단계에서는 worker 병렬 수집보다 순차 기준 고정이 먼저다.
- 이유는 시인 ID, 작품 ID, 장르 구분, 권리 기본값, `direct-text-collected`와 `candidate-only` 상태가 먼저 안정되어야 이후 병렬 worker 산출물을 안전하게 합칠 수 있기 때문이다.
- 다음 단계부터는 작가별 tranche가 서로 독립적이므로 병렬 처리해도 된다.
- 특히 `이규보`, `이색`, `이제현`, `정도전`, `김종직`, `허난설헌`은 서로 충돌 가능성이 낮아 worker 분할에 적합하다.

# 검증

- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- JSON 파싱 검증: 시인/작품 기준본과 public mirror 4개 모두 통과
- 참조 검증: 작품 catalog의 모든 `authorId`가 시인 catalog에 존재
- 중복 검증: `authorId + title + readiness` 중복 0건
- 기존 한시 레코드 검증:
  - `node scripts/validate_korean_hansi_records.js --input docs/spec/korean-hansi-choe-chiwon-tranche1.records.v1.json`
  - `node scripts/validate_korean_hansi_records.js --input docs/spec/korean-hansi-jeong-jisang-tranche1.records.v1.json`
  - `node scripts/validate_korean_hansi_records.js --input docs/spec/korean-hansi-jeong-jisang-tranche2.records.v1.json`

# 검증 중 발견한 기존 문제

- `npx tsc --noEmit`은 기존 `scripts/build_general_page.js:469`의 닫히지 않은 template literal 오류로 실패했다.
- 이번 세션에서 만든 파일과 직접 관련된 오류는 아니다.
- `npm run hansi:validate`는 원래 `--input` 인자가 필요한 스크립트라 그대로 실행하면 실패한다. 개별 records 파일을 지정해 검증했다.

# 다음 세션의 첫 행동

1. 이번 handoff의 `GPT-5.4 병렬 worker 작업지시서`를 그대로 사용해 worker를 4개 띄운다.
2. worker 결과는 바로 본 catalog에 합치지 말고 `docs/spec/korean-poet-worker-results/` 아래 개별 JSON으로 먼저 받는다.
3. 본 세션이 worker 결과를 검수해 `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`에 병합한다.
4. 병합 전에는 후보 작품의 `sourceUrl`, `sourcePolicyId`, `text.poemZh`, `rights`, `ingest.readiness`를 확인한다.
5. 공개용 번역은 계속 `ownedTranslationNeeded=true` queue로 유지하고, 기존 번역 복제는 피한다.

# GPT-5.4 병렬 worker 작업지시서

## 공통 지시

- 모델: 가능하면 `gpt-5.4` worker로 실행한다.
- 목적: 한국 시인 연대기 catalog의 `candidate-only` 작품을 실제 원문 확보 후보로 승격할 수 있는지 조사한다.
- 작업 단위: 작가/문집 단위로 나눈다. worker끼리 같은 파일을 수정하지 않는다.
- 직접 수정 허용 범위:
  - `docs/spec/korean-poet-worker-results/worker-{번호}-{slug}.v1.json`
  - 필요 시 같은 경로의 `.md` 조사 메모
- 직접 수정 금지:
  - `docs/spec/korean-poets-chronology.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poets_chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
- 반드시 참조할 기준 파일:
  - `docs/spec/korean-poets-chronology.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `docs/spec/korean-hansi-source-policies.v1.json`
  - `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`
- 원문 수집 우선순위:
  1. 위키문헌처럼 raw/direct text가 안정적으로 열리는 공개 원문
  2. 한국고전종합DB/한국문집총간은 원문 위치와 메타데이터 확인용
  3. KORCIS는 판본/소장처/문집 locator 확인용
  4. direct text가 막히면 OCR 후보로만 표시하고 무리해서 추출하지 않는다.
- 번역/주석 원칙:
  - 한국고전종합DB 번역, 백과 문장, 현대 주석을 그대로 복제하지 않는다.
  - worker 결과의 번역 필드는 비워 두거나 `ownedTranslationNeeded=true`로 둔다.
  - 원문과 출처 URL, 판본 단서, 권리 위험 표시가 최우선이다.
- 결과 JSON 필수 형태:

```json
{
  "workerId": "worker-1-yi-gyubo",
  "modelRecommendation": "gpt-5.4",
  "status": "completed|partial|blocked",
  "targetAuthors": ["이규보"],
  "summary": {
    "candidateWorksChecked": 0,
    "directTextWorksFound": 0,
    "ocrCandidates": 0,
    "blockedWorks": 0
  },
  "poems": [
    {
      "authorKo": "이규보",
      "authorHanja": "李奎報",
      "candidateTitle": "江上曉雨",
      "matchedTitle": "江上曉雨",
      "sourceWork": {
        "collectionTitle": "東國李相國集",
        "juan": null,
        "entryTitle": "江上曉雨",
        "sourceUrl": null,
        "rawUrl": null,
        "sourcePolicyId": null,
        "locatorConfidence": "high|medium|low"
      },
      "text": {
        "poemZh": null,
        "poemKoReading": null,
        "poemKoGloss": null
      },
      "rights": {
        "originalTextUsage": "commercial_allowed|noncommercial_only|permission_required|unknown",
        "translationUsage": "owned_translation_needed"
      },
      "ingest": {
        "recommendedReadiness": "direct-text-collected|source-located|ocr-candidate|blocked",
        "notes": null
      }
    }
  ],
  "blockers": [],
  "sourcesConsulted": []
}
```

## Worker 1: 이규보

- output: `docs/spec/korean-poet-worker-results/worker-1-yi-gyubo.v1.json`
- target author: 이규보(李奎報)
- primary collection: `東國李相國集`
- seed candidates: `江上曉雨`, `夏日卽事`, `東明王篇`, `詠井中月`, 제야시 계열
- 목표:
  - 공개 direct text가 열리는 권차/작품 위치를 찾는다.
  - 장편 `東明王篇`은 전체 수록 여부와 분량만 먼저 확인하고, 즉시 전체 ingest하지 않아도 된다.
  - 최소 5건의 `source-located` 또는 `direct-text-collected` 후보를 만든다.

## Worker 2: 이색

- output: `docs/spec/korean-poet-worker-results/worker-2-yi-saek.v1.json`
- target author: 이색(李穡)
- primary collection: `牧隱藁`
- seed candidates: `浮碧樓`, 제야시, 사행·회고시, `牧隱藁` 수록시
- 목표:
  - `牧隱藁` 공개 원문 접근 경로를 찾는다.
  - `浮碧樓` 계열 제목은 동명이작 가능성이 있으므로 저자와 권차를 반드시 확인한다.
  - 최소 5건의 `source-located` 또는 `direct-text-collected` 후보를 만든다.

## Worker 3: 이제현, 정도전, 김종직

- output: `docs/spec/korean-poet-worker-results/worker-3-lee-jehyeon-jeong-dojeon-kim-jongjik.v1.json`
- target authors:
  - 이제현(李齊賢), `益齋亂藁`, `櫟翁稗說`, `小樂府`
  - 정도전(鄭道傳), `三峰集`
  - 김종직(金宗直), `佔畢齋集`, `七詠`
- 목표:
  - 세 작가 모두 깊게 수집하지 말고, 각 작가당 가장 안정적인 문집 locator와 대표 작품 2~3건씩만 찾는다.
  - `七詠`은 이미 Donggyeong Japgi 쪽에서 compound work 분할 경험이 있으므로, 같은 제목 묶음인지 확인한다.
  - 총 6~9건의 `source-located` 후보를 만든다.

## Worker 4: 허난설헌

- output: `docs/spec/korean-poet-worker-results/worker-4-heo-nanseolheon.v1.json`
- target author: 허난설헌(許蘭雪軒)
- primary collection: `蘭雪軒集`
- seed candidates: `春雨`, `貧女吟`, `哭子`, `遣興`, `送荷谷謫甲山`
- 목표:
  - 공개 원문 direct text가 있는지 우선 확인한다.
  - 여성 문인 작품은 전승·편찬·후대 간행 문제가 있으므로 `locatorConfidence`와 출처 메모를 보수적으로 적는다.
  - 최소 4건의 `source-located` 또는 `direct-text-collected` 후보를 만든다.

# 본 세션 병합 지시

- worker 결과가 오면 먼저 JSON 파싱과 스키마 형태를 확인한다.
- 같은 작가/같은 제목이 이미 `direct-text-collected`로 있으면 새 항목을 만들지 말고 `sourceVariants` 후보로 검토한다.
- `source-located`는 원문 전문이 없으면 `text.poemZh=null` 상태로 유지한다.
- `direct-text-collected`만 `text.poemZh`를 채운다.
- 병합 후 `node scripts/build_korean_poet_chronology_catalog.js`를 다시 실행하면 worker 결과가 지워질 수 있으므로, worker 결과 병합 전에는 build script 확장 여부를 먼저 결정한다.

# 다음 세션이 피해야 할 함정

- `candidate-only` 작품을 본문 확보 작품처럼 표시하지 말 것.
- `한국고전종합DB` 번역을 그대로 공개 JSON에 넣지 말 것.
- 향가·고려가요·시조를 한시 스키마에 억지로 끼워 넣지 말고 `genre.track = native-form`으로 별도 처리할 것.
- 이미 dirty한 작업트리의 기존 변경을 정리하거나 되돌리지 말 것.
