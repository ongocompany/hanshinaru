---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 동경잡기 DB 병합 전략과 이이 seed 해소 closeout
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 빠져 있던 동경잡기 rename 산출물 묶음을 회수해 커밋했다.
  - 커밋: `de07b28f [지훈][Fix] Keep Donggyeong Japgi corpus rename`
  - 기존 `tokyo-zakki` 파일명/스크립트명/JSON ID는 `donggyeong-japgi`로 옮겼다.
  - `build_korean_hansi_donggyeong_japgi_volume_harvest.js`가 명령행 권차 인자를 받도록 보정했다.
- 동경잡기 산출물 상태를 다시 확인했다.
  - 3권
  - 문헌 section 50개
  - 문헌 entry 913개
  - 작품 block 94편
  - attached context 8건
  - 정리 저자 48명
  - review queue 0건
- 이이(李珥) 남은 seed candidate 2종을 direct-text로 해소했다.
  - 금강산시: `楓嶽贈小菴老僧`, `萬瀑洞`, `楓嶽登九井看日出`
  - 학문·수양시: `燈下看書`, `至夜書懷`
- `docs/spec/korean-poet-worker-results/worker-6-yi-i-jeong-cheol.v1.json`을 15편 direct-text 결과로 확장했다.
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`을 재생성했다.

# 현재 catalog 상태

- direct-text 확보: 115건
- source-located: 8건
- blocked: 1건
- candidate-only: 143건
- totalWorks: 267건
- workerResultWorks: 79건
- 이이: direct-text 10건, 남은 seed candidate 0건

# 동경잡기 본 DB 포함 판단

- 동경잡기 전권 작품 94편 중 현재 `korean-poets-chronology`의 기존 시인 한자명과 바로 매칭되는 것은 13명 44편이다.
- 현재 본 DB와 같은 저자+본문 기준으로 완전 중복되는 것은 0건이다.
- 미등록 시인 쪽은 35명 50편이다.
- 따라서 전량 즉시 병합보다 2단계 병합이 안전하다.
  1. 기존 시인과 매칭되는 13명 44편을 먼저 `korean-poems-chronology` 빌드 입력으로 승격한다.
  2. 魚世謙, 李安訥, 柳成龍 등 미등록 시인 35명은 seed author row를 만든 뒤 50편을 2차 승격한다.
- 특히 김종직 `七詠`처럼 이미 `新增東國輿地勝覽`/`佔畢齋集` 기준으로 들어온 작품과 동경잡기 수록본이 겹치는 경우가 있다.
  - 단순 중복 삭제가 아니라 source variant 또는 collection witness로 표시하는 필드가 필요하다.
  - 다음 세션에서는 `sourceVariants` 또는 `collectionWitnesses` 같은 보조 필드를 먼저 설계한 뒤 병합하는 편이 안전하다.

# 다음 세션의 첫 행동

1. `scripts/build_korean_poet_chronology_catalog.js`에 동경잡기 bundle import 단계를 추가한다.
2. import는 `docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json`을 읽고, 기존 시인 한자명과 매칭되는 44편만 먼저 생성한다.
3. 기존 본문과 같은 작품은 중복 생성하지 말고 source variant로 붙이는 규칙을 넣는다.
4. 그 뒤 미등록 시인 35명에 대해 seed catalog 확장안을 따로 만든다.

# 검증

- `node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 1`
- `node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 2`
- `node scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js 3`
- `node scripts/build_korean_classics_donggyeong_japgi_collection_bundle.js`
- `node scripts/build_korean_classics_donggyeong_japgi_author_view.js`
- `node scripts/build_korean_classics_donggyeong_japgi_review_queue.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- <touched paths>`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류로 실패한다.
  - `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.`
  - 이번 동경잡기/이이 수집 변경과 직접 관련 없는 기존 문제로 보인다.

# 다음 세션이 피해야 할 함정

- 동경잡기 94편을 한 번에 본 DB에 밀어 넣지 말 것. 미등록 저자 row가 먼저 필요하다.
- `tokyo-zakki` 명칭을 호환 별칭으로 되살리지 말 것. 공개 표면은 `동경잡기(東京雜記) / Donggyeong Japgi`, 내부 slug는 `donggyeong-japgi`가 맞다.
- `七詠` 계열은 동일 작품의 다른 기준본일 수 있으므로, 본문 차이를 무시하고 덮어쓰지 말 것.
- 기존 dirty worktree의 unrelated 변경은 되돌리지 말 것.
