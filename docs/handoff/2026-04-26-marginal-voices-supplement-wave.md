---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Marginal voices supplement wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 직전 후보 exhaustion wave를 커밋했다.
  - commit: `e58ebcf6 [지훈][Feat] Exhaust Korean poem candidate residuals`
- 남성 관료 문인 중심 wave에서 빠지기 쉬운 보충 후보군을 추가했다.
  - 여성 시인: 이옥봉, 김호연재, 삼의당 김씨, 서영수합, 김금원, 김부용
  - 작자 미상 작품군: 고려가요 무명씨, 조선 궁중가요 무명씨
  - 왕족/종친: 안평대군, 월산대군
- 새 worker 결과를 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json`
- 공개 raw에서 바로 확인된 13건을 direct-text로 수집했다.
  - 고려가요 무명씨: `가시리`, `사모곡`, `상저가`
  - 이옥봉: `近來安否問如何`, `魯陵 감상시`, `別恨`, `閨情`
  - 김금원: `龍山泛舟`, `堤川義林池`
  - 삼의당 김씨: `寄在京夫子`
  - 월산대군: `奉賡御製五言排律十韻`, `進喜雨詩一首`, `題畫蘭竹`
- 긴 고려가요 4건은 source-located로 위치를 먼저 고정했다.
  - `청산별곡`, `서경별곡`, `동동`, `쌍화점`

# 현재 catalog 상태

- authors: 148명
- direct-text 확보: 1364건
- source-located: 4건
- blocked: 65건
- candidate-only: 27건
- totalWorks: 1395건
- workerResultWorks: 1328건

# 새 candidate-only 27건의 의미

- 후보목록은 다시 생겼지만, 이전처럼 막연한 잔여물이 아니라 보충 목적이 분명한 목록이다.
- 남은 후보는 다음과 같이 나뉜다.
  - 안평대군: `夢遊桃源圖詩` 관련, `匪懈堂集` 수록시, 서화 제영시
  - 월산대군: `滕王閣序集字八首`
  - 이옥봉: `離怨`, `秋恨`
  - 김호연재: `浩然齋遺稿` 수록시, 수양시, 생활시
  - 삼의당 김씨: `花月夜`, `黃鳥`, `月`, `燕子`
  - 서영수합: `令壽閣詩稿` 수록시, 규방시, 교유시
  - 김금원: `龍山三湖亭`, `統軍亭觀開市擧火`, `金剛山楡帖寺`
  - 김부용: 운초 한시, 교유시, 이별시, 평양 기생 문학 후보
  - 조선 궁중가요 무명씨: `城隍飯`, `內堂`, `大國`, 궁중 악장·무속가요 후보

# 핵심 판단과 이유

- 이번 보충은 "대표 남성 문집을 더 파는" 방향이 아니라, 빠져 있던 작가층을 보완하는 wave다.
- 작자 미상 고려가요는 개인 작가 catalog에 잘 잡히지 않지만, 한국 시문학 연대기에서는 반드시 필요한 층이다.
- 이옥봉, 김금원, 삼의당 김씨는 ko Wikisource에서 원시를 바로 대조할 수 있어 direct-text로 먼저 올렸다.
- 월산대군은 zh Wikisource `風月亭集/卷之一` raw가 안정적으로 열려 종친 문학 수집의 좋은 출발점이다.
- 청산별곡, 동동, 쌍화점은 raw 위치는 확인했지만 길이와 주석 처리 때문에 다음 pass에서 원문 정제 후 direct-text로 올리는 편이 낫다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json`
- `node scripts/validate_korean_poet_worker_results.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 repo-wide React/JSX 설정 문제로 실패한다.
  - 첫 오류: `history/history.tsx(2,35): Cannot find module 'react'`
  - 이어서 `../home/components/Navigation`, `../home/components/Footer` 누락과 JSX intrinsic element 타입 오류가 대량으로 이어진다.
  - 이번 JSON/catalog 보강과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-23-marginal-voices-supplement-wave.v1.json`
  - `docs/handoff/2026-04-26-marginal-voices-supplement-wave.md`
- 수정:
  - `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`
  - `scripts/build_korean_poet_chronology_catalog.js`
  - `docs/spec/korean-poets-chronology.v1.json`
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poets_chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`

# 다음 세션의 첫 행동

1. 긴 고려가요 source-located 4건을 direct-text로 정제한다.
   - `청산별곡`, `서경별곡`, `동동`, `쌍화점`
2. `風月亭集/卷之一`에서 월산대군 작품을 몇십 건 단위로 더 뽑을 수 있는지 확인한다.
3. 여성 한시 쪽은 다음 순서가 좋다.
   - 이옥봉 남은 2건
   - 김금원 남은 3건
   - 삼의당 김씨 `조선여류한시선집` 페이지들
   - 김호연재/서영수합/김부용은 원문 위치부터 확정

# 다음 세션이 피해야 할 함정

- 여성 시인 후보를 `해동염사` 설명문 그대로 bio에 복제하지 말 것. 원문 locator로는 쓰되, bio는 별도 확인과 자체 문장화가 필요하다.
- `조선여류한시선집`에는 김억 번역이 함께 있으므로, 공개 catalog에는 원시만 쓰고 번역은 자체 번역으로 처리한다.
- 고려가요는 옛한글, 주석, 후렴, 한자 병기 처리가 섞이므로 긴 작품은 `textParts` 분리를 고려한다.
- 궁중가요 무명씨 후보는 무속가요·악장·정재 텍스트가 섞이기 쉬우므로 작품별 장르를 먼저 분리한다.
