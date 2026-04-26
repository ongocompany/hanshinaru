---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 이덕무 靑莊館全書 direct-text wave
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `b899e71f [지훈][Feat] Clear source-located hansi wave`와 최신 handoff `docs/handoff/2026-04-25-source-located-clear-and-hwang-hyeon-wave.md`를 확인했다.
- 세션 시작 규칙에 따라 environment/session log, project wiki, `.rules/`, 최근 커밋, inbox 경로를 확인했다.
  - `docs/activity-log.md`와 `docs/inbox/to-codex/`는 현재 checkout에 없었다.
  - 열린 PR 확인은 로컬 GitHub 원격/PR 문맥이 없어 이번 세션에서는 수행하지 않았다.
- 최신 handoff의 첫 추천 작업이던 황현 `medium` 대응 2건을 재확인했다.
  - `上元雜詠` ↔ `元宵`
  - `우국시` ↔ `孤雲吹笛臺有感`
  - 둘 다 exact title 대응이 아니라 대표 대응이라 `locatorConfidence: medium` 유지가 맞다.
- 다음 wave 후보 중 공개 원문이 가장 안정적으로 잡힌 이덕무 `靑莊館全書`를 선택했다.
  - 신위 `紫霞詩集` 검색은 다른 중국 시집으로 새는 결과가 많았다.
  - 김정희 `阮堂集`은 `晚晴簃詩匯`에 일부만 보여, 이번 wave의 주 수집원으로는 좁았다.
- 새 worker 파일을 추가했다.
  - `docs/spec/korean-poet-worker-results/worker-9-yi-deokmu-cheongjanggwan.v1.json`
  - zh Wikisource `靑莊館全書/卷九`, `靑莊館全書/卷十二` raw에서 8건 direct-text 수집:
    - `讀莊`
    - `論詩`
    - `紅蜻蜓戱影`
    - `觀軒盆竹`
    - `秋雁`
    - `題畵 二首`
    - `校內閣毛詩講義`
    - `題閣吏金德亨畵扇`
- catalog와 public mirror를 재생성했다.
- 이후 검증 중 발견된 `scripts/build_general_page.js` 끝부분의 불필요한 백틱 한 줄을 삭제했다.
  - 기존 `npx tsc --noEmit`의 첫 오류였던 `TS1160: Unterminated template literal`은 이 수정으로 해소됐다.

# 현재 catalog 상태

- authors: 132명
- direct-text 확보: 203건
- source-located: 0건
- blocked: 0건
- candidate-only: 149건
- totalWorks: 352건
- workerResultWorks: 94건
- donggyeongJapgiMatchedBlocks: 94건
- donggyeongJapgiImportedWorks: 64건
- donggyeongJapgiSourceVariants: 30건

# 핵심 판단과 이유

- 이덕무 seed의 `독서시`, `사물시`는 exact title이 아니라 범주형 후보라, `靑莊館全書` 안에서 제목과 원문이 분명한 작품을 대표 direct-text로 수집했다.
- `秋雁`, `題畵 二首`, `校內閣毛詩講義`는 한 heading 아래 여러 수가 묶인 구조다. 이번 wave에서는 기존 황현/이제현 처리와 맞춰 하나의 작품 row 안에 줄바꿈으로 보존했다.
- `校內閣毛詩講義` raw의 `詩{{*|脫一字}}微茫` 주석은 본문에는 `詩微茫`으로 정리했다. 후속 정밀 교감 단계에서 결자 주석을 별도 metadata로 보존할 수 있다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js --input docs/spec/korean-poet-worker-results/worker-9-yi-deokmu-cheongjanggwan.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `jq '.summary' docs/spec/korean-poems-chronology.v1.json`
- `jq` spot check
  - 이덕무 direct-text 8건이 모두 `worker-9-yi-deokmu-cheongjanggwan`으로 반영됨
- `node --check scripts/build_general_page.js`
- `git diff --check -- docs/spec/korean-poet-worker-results/worker-9-yi-deokmu-cheongjanggwan.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json scripts/build_general_page.js`

# 남은 검증 이슈

- `npx tsc --noEmit`의 `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.` 오류는 수정 완료했다.
- 그 다음 단계에서 `history/history.tsx`, `tang300/tang300.tsx` 등 React/TSX 계열 파일의 별도 타입 오류가 대량으로 드러난다.
  - 대표 오류: `Cannot find module 'react'`, `Cannot find module '../home/components/Navigation'`, `JSX.IntrinsicElements` 없음.
  - 이번 한시 catalog 변경과 직접 관련된 오류는 아니다.

# 생성/수정/참조한 문서

- 생성:
  - `docs/spec/korean-poet-worker-results/worker-9-yi-deokmu-cheongjanggwan.v1.json`
  - `docs/handoff/2026-04-26-yi-deokmu-cheongjanggwan-wave.md`
- 수정:
  - `docs/spec/korean-poems-chronology.v1.json`
  - `public/index/korean_poems_chronology.v1.json`
  - `scripts/build_general_page.js`
- 참조:
  - `docs/handoff/2026-04-25-source-located-clear-and-hwang-hyeon-wave.md`
  - `.rules/`
  - `llmwiki/wiki/projects/hanshinaru.md`

# 원래 계획과 달라진 점

- 최신 handoff의 후보는 이덕무, 신위, 김정희였다.
- 실제 공개 원문 검색 결과 이덕무 `靑莊館全書`가 가장 안정적이라 이번 wave는 이덕무 단독으로 진행했다.

# 다음 세션의 첫 행동

1. 이번 변경 범위를 먼저 확인한다.
   - `git diff --stat -- docs/spec/korean-poet-worker-results/worker-9-yi-deokmu-cheongjanggwan.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json docs/handoff/2026-04-26-yi-deokmu-cheongjanggwan-wave.md`
2. `校內閣毛詩講義`의 결자 주석(`脫一字`)을 metadata로 남길지 판단한다.
3. 다음 수집 wave는 김정희보다 신위 재검색 또는 이덕무 추가 권을 먼저 검토한다.
   - 신위는 `紫霞詩集` exact page를 찾기 전까지 보류한다.
   - 김정희는 `晚晴簃詩匯`의 단편만으로는 `阮堂集` tranche라고 부르기 어렵다.
4. 묶음 작품 분할 기준을 별도 작은 규칙으로 정한다.
   - `秋雁`, `題畵 二首`, `校內閣毛詩講義`, `絶命詩 四首`, `小樂府` 등이 대상이다.

# 다음 세션이 피해야 할 함정

- 신위 `紫霞詩集`은 검색어만으로는 다른 중국 시집이 많이 잡히므로 exact source page 없이 수집하지 말 것.
- 김정희는 `金正喜`가 중국 시선집 안에 일부 수록된 상태와 `阮堂集` 원문 확보를 구분할 것.
- 이미 더러운 worktree의 unrelated 변경을 되돌리지 말 것.
- YGC나 검색 snippet만으로 공개 본문 승격하지 말고 raw 원문을 확인할 것.
