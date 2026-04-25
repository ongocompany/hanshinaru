---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 동경잡기 보충 author seed와 2차 import
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `bd249538 [지훈][Feat] Import Donggyeong and long-form hansi texts`와 handoff `docs/handoff/2026-04-25-donggyeong-db-import-phase1.md`를 확인했다.
- 세션 시작 규칙에 따라 environment/session log, project wiki, `.rules/`, 최근 커밋, 열린 PR 상태를 확인했다.
- `textParts` 사용처를 점검했다.
  - `東明王篇 幷序`는 catalog 안에 `text.textParts` 9구간으로 들어가 있다.
  - 현재 사이트 화면은 새 `korean_poems_chronology` JSON을 직접 읽는 흐름이 거의 없고, 기존 화면은 주로 `poemZh` 계열만 쓴다.
  - 따라서 장편 구조 표시/번역/현토는 후속 UI 또는 생성 파이프라인에서 `textParts` 우선 사용 규칙을 별도로 붙여야 한다.
- 동경잡기 bundle 기준 미등록 author를 다시 계산했다.
  - 기존 seed에 없는 author: 35명
  - 해당 작품 block: 50편
- `docs/spec/korean-poet-donggyeong-author-seed.v1.json`을 추가했다.
  - 한글 독음과 생애 정보는 추측하지 않고 `authorKo: null`, `needsNameReadingVerification: true`로 남겼다.
  - 한자명, raw label, 수록작 표지, 수록작 수만 동경잡기 bundle에서 기계적으로 추출했다.
- `scripts/build_korean_poet_chronology_catalog.js`가 보충 seed를 읽어 author row를 추가하도록 확장했다.
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 132명
- baseSeedAuthors: 97명
- donggyeongSupplementAuthors: 35명
- direct-text 확보: 182건
- source-located: 6건
- blocked: 0건
- candidate-only: 154건
- totalWorks: 342건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건
- 동경잡기 bundle author 중 catalog author row가 없는 경우: 0건

# 핵심 판단과 이유

- 미등록 동경잡기 시인을 바로 한글명으로 확정하지 않았다. 일부는 유명 인물이지만, 35명을 한 번에 독음·생몰까지 채우면 추측이 섞일 위험이 커서 보충 seed를 `검증 필요` 상태로 만들었다.
- 작품 50편은 author row 없이 바로 넣지 않는다는 이전 handoff 원칙을 지켰다.
- 동경잡기 94편 전체가 이제 author row와 연결된다. 다만 같은 제목이나 같은 본문으로 판단되는 것은 중복 작품이 아니라 기존 작품의 `sourceVariants`로 붙는다.

# 검증

- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `node -e` spot check
  - authors 132
  - supplementAuthors 35
  - missingDonggyeongAuthors 0
  - 동경잡기 summary counts 확인
- `git diff --check -- scripts/build_korean_poet_chronology_catalog.js docs/spec/korean-poet-donggyeong-author-seed.v1.json docs/spec/korean-poems-chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poems_chronology.v1.json public/index/korean_poets_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류로 실패한다.
  - `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.`
  - 이번 변경 파일과 직접 관련된 오류는 아니다.

# 다음 세션의 첫 행동

1. `docs/spec/korean-poet-donggyeong-author-seed.v1.json`의 35명 한글 독음과 생몰/시대 정보를 검증한다.
2. 검증된 인물부터 `authorKo`, `eraLabel`, `life`, `notes`를 채운다.
3. `textParts`를 화면/번역/현토 파이프라인에서 우선 사용하는 작은 helper를 설계한다.
4. YGC 6건은 계속 `source-located`로 두고, 공개 대체 판본을 별도로 찾는다.

# 추가 수집 방향 분석

현재 catalog 기준 전체 작품은 342건이다.

- 원문 확보: 182건
- 위치만 확인: 6건
- 후보: 154건

지금 파이프라인을 계속 이어가면 추가 수집 여지는 충분하다. 다만 동경잡기처럼 한 번에 큰 덩어리가 들어오는 구간은 한 차례 지나갔으므로, 다음부터는 작품명 개별 검색보다 문집 단위 tranche 수집이 더 효율적이다.

현실적인 추가 수집 예상치는 다음과 같다.

| 방식 | 예상 추가 원문 | 난이도 | 설명 |
|---|---:|---|---|
| 빠른 후속 wave | 20~40편 | 낮음~중간 | 이미 위키문헌 문집이 확인되는 작가 위주 |
| 2~3회 집중 수집 | 60~100편 | 중간 | 문집 권별 raw를 훑어 대표작과 후보작을 계속 승격 |
| OCR/이미지까지 포함 | 100편 이상 가능 | 높음 | KORCIS/고전DB 이미지 기반이라 비용과 검수 부담 큼 |

우선순위는 다음이 좋다.

1. 정도전 + 이제현 `source-located` 6건 해소
   - 이제현 3건, 정도전 3건은 이미 위치가 잡혀 있다.
   - YGC 본문은 그대로 공개 승격하지 말고, 위키문헌 같은 공개 대체 판본이 있으면 그쪽으로 승격한다.
   - 잘 풀리면 바로 3~6편을 direct-text로 올릴 수 있다.
2. 위키문헌 문집이 확인되는 A급 작가 tranche
   - 정도전 `三峯集`: 권별 문서가 확인됨.
   - 이제현 `益齋亂稿`: 권별 문서가 확인됨.
   - 박지원 `燕巖集`: 전17권 구조가 확인됨.
   - 황현 `梅泉集`: 권별 문서가 확인됨.
3. 원문이 이미 열린 작가의 추가 대표작 확장
   - 김종직, 정약용, 김극기, 이인로, 정몽주, 권근 등은 기존 source path를 재활용할 수 있다.
4. 후순위
   - 이황은 위키문헌 author page는 보이지만 큰 시문집 본체가 바로 잡힌 상태는 아니므로, 현 단계에서는 정도전/이제현/박지원/황현보다 한 단계 낮게 둔다.

다음 실작업 추천은 `정도전 + 이제현 source-located 해소 wave`다. 이미 catalog에 걸려 있는 후보를 공개 대체 판본으로 승격하는 작업이라 가장 깔끔하고, 성공하면 이후 문집 tranche 수집의 검증 패턴도 같이 잡힌다.

# 다음 세션이 피해야 할 함정

- 한글 독음과 생몰을 추측으로 한꺼번에 채우지 말 것.
- `authorKo: null`은 미완성이지만 의도된 안전장치다. 검증 전 임의 한글명으로 바꾸지 말 것.
- 동경잡기 작품을 중복 생성하지 말 것. 같은 제목/본문은 계속 `sourceVariants`로 붙여야 한다.
- `tokyo-zakki` 명칭을 되살리지 말 것. 공개 표면은 `동경잡기(東京雜記) / Donggyeong Japgi / donggyeong-japgi`가 맞다.
