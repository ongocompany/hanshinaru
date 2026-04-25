---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 동경잡기(東京雜記) 검수 대기열 해소
date: 2026-04-24
author: 태훈
---

# 이번 세션에서 완료한 작업

- 최신 handoff, `.rules/`, project wiki, 최근 커밋, PR 상태를 확인했다.
- 문헌명 표기는 `동경잡기(東京雜記) / Donggyeong Japgi`가 맞고, `donggyeong-japgi`는 내부 canonical slug로만 취급한다.
- 공개 소스 표면에서 잘못된 지명 음역이 보이지 않도록 기존 오류 slug의 파일명/스크립트명/JSON ID를 `donggyeong-japgi`로 전면 rename했다.
- `七詠佔畢齋金宗直詩`를 `新增東國輿地勝覽 卷021` 대조로 7개 하위 곡명 작품 후보로 분리했다.
- `悅朴嶺`의 `金克己詩`, `李石亨詩`를 같은 대조 문헌 기준으로 행 분할 확정했다.
- 전권 산출물을 재생성해 `94`작품, attached context `8`, 정리 저자 `48`, review queue `0`건 상태로 맞췄다.
- 관련 spec 문서와 JSON manifest를 현재 수량에 맞게 갱신했다.

# 어디서 멈췄는지

- 본문 복원/저자 표기 review queue는 비어 있다.
- 다음 작업은 `동경잡기(東京雜記)` 전권 bundle에서 `정식 작품 후보`와 `문헌 맥락 자산`을 분리해 승격하는 단계다.

# 핵심 판단과 이유

- `七詠`은 단일 장문 블록으로 두면 저자별 보기와 작품 후보 수량이 왜곡되므로, 대조 문헌에서 확인되는 하위 곡명 단위로 분리했다.
- `悅朴嶺` 보정은 외부 문헌 글자로 치환하지 않고, `동경잡기(東京雜記)` 원문 계열의 글자를 유지하면서 구두점과 행 분할 판단만 대조했다.
- 대조 문헌은 `新增東國輿地勝覽 卷021`이며, 산출물의 `harvestPolicy.collationSource`에 남겼다.

# 생성/수정/참조한 문서

- 수정: `docs/spec/2026-04-23-korean-hansi-donggyeong-japgi-vol2-poem-harvest.md`
- 수정: `docs/spec/2026-04-23-korean-hansi-donggyeong-japgi-vol3-poem-harvest.md`
- 수정: `docs/spec/2026-04-23-korean-classics-donggyeong-japgi-collection-bundle.md`
- 수정: `docs/spec/2026-04-24-korean-classics-donggyeong-japgi-author-view.md`
- 수정: `docs/spec/2026-04-24-korean-classics-donggyeong-japgi-review-queue.md`
- 수정: `package.json`
- 수정: `scripts/build_korean_hansi_donggyeong_japgi_volume_harvest.js`
- 수정: `scripts/build_korean_classics_donggyeong_japgi_collection_bundle.js`
- 수정: `scripts/build_korean_classics_donggyeong_japgi_author_view.js`
- 수정: `scripts/build_korean_classics_donggyeong_japgi_review_queue.js`
- 생성: `docs/handoff/2026-04-24-donggyeong-japgi-review-queue-cleared.md`
- 참조: `新增東國輿地勝覽 卷021`

# 원래 계획과 달라진 점

- handoff의 첫 행동은 `七詠` 검토였지만, 이어서 남은 `悅朴嶺` 2건까지 같은 대조 문헌으로 해결해 대기열을 완전히 비웠다.
- 이후 공개 가능성을 고려해 잘못된 영문 slug를 호환 별칭으로도 남기지 않고 canonical slug 자체를 `donggyeong-japgi`로 바꿨다.

# 다음 세션의 첫 행동

1. `docs/spec/korean-classics-donggyeong-japgi-collection-bundle.v1.json`에서 승격 후보 기준을 정한다.
2. 작품 후보와 설명문/기문 맥락 자산을 분리하는 canonical promotion 스크립트 초안을 만든다.
3. 상위 시인(`魚世謙`, `金克己`, `徐居正`, `金宗直`)부터 중복/이칭 정리 결과를 확인한다.

# 다음 세션이 피해야 할 함정

- `新增東國輿地勝覽` 대조 결과를 `동경잡기(東京雜記)` 본문 글자 자체로 덮어쓰지 말 것.
- `七詠` 하위 곡명 일부는 `authorZh`가 아니라 `titleHintZh`로 잡히므로, 저자별 묶음은 bundle normalization 결과를 기준으로 볼 것.
- `npm run build`는 현재 Node `v20.20.1`에서 Astro 6의 `>=22.12.0` 요구 때문에 실패한다.
- `npx tsc --noEmit`은 기존 JSX/React/astro tsconfig 문제로 실패하므로, 이번 데이터 변경의 회귀 신호로 해석하지 말 것.
