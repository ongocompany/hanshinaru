---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: YGC source policy and source-located direct-text review
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `412c1716 [지훈][Feat] Start Korean poet worker collection`과 handoff `docs/handoff/2026-04-25-korean-poet-worker-collection-start.md`를 확인했다.
- `source-located` 13건을 YGC 6건, Wikisource 7건으로 분리해 검토했다.
- `docs/spec/korean-hansi-source-policies.v1.json`에 `SRC-YGC-ORIGINAL-TEXT`를 추가했다.
- YGC 6건은 해당 source policy만 연결하고 `source-located`로 유지했다.
- Wikisource 7건 중 단편으로 안전하게 확정 가능한 김종직 2건을 `direct-text-collected`로 승격했다.
  - `七夕。邀春塘。`
  - `答金郭二秀才`
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json`을 재생성했다.

# 핵심 판단과 이유

- YGC 사이트는 본문을 HTML과 meta description으로 노출하지만, 하단 `저작권 정책`과 `홈페이지 이용약관` 링크가 실제 문서 URL이 아니라 `#a`로 되어 있다.
- 따라서 YGC는 고전 원문 위치 확인과 내부 대조에는 쓸 수 있지만, 제공 디지털 본문 자체를 공개 JSON에 넣는 것은 아직 보류한다.
- Wikisource는 기존 `SRC-WIKISOURCE-TEXT` 정책상 공개/상업 표시가 허용되는 경로라, 원문 경계가 짧고 분명한 2건만 승격했다.

# 13건 검토 결과

- 즉시 승격 완료: 김종직 `七夕。邀春塘。`, 김종직 `答金郭二秀才`
- 정책 연결만 완료, 본문 승격 보류: 이제현 `小樂府`, `題長安逆旅`, `寄題白花禪院觀空樓次韻`, 정도전 `關山月`, `秋夜`, `文德曲`
- 구조 판단 후 처리: 이규보 `東明王篇 幷序`, 김종직 `七詠`, 허난설헌 `春雨`, `貧女吟`, `遣興`

# 현재 catalog 상태

- direct-text 확보: 60건
- source-located: 11건
- blocked: 1건
- candidate-only: 154건
- totalWorks: 226건

# 검증

- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`

# 다음 세션의 첫 행동

1. `東明王篇 幷序`를 장편 작품 카드로 둘지, 서문과 본문을 나눌지 결정한다.
2. `七詠`은 Donggyeong Japgi 때처럼 7개 하위 작품으로 분할하는 방향이 유력하다.
3. 허난설헌 `春雨`, `貧女吟`, `遣興`은 기존 catalog 중복과 seed title 불일치를 먼저 정리한다.
4. YGC 6건은 공개 본문 승격 전 별도 권리 근거 또는 대체 공개 판본을 찾는다.

# 다음 세션이 피해야 할 함정

- YGC에 본문이 보인다는 이유만으로 `commercial_allowed`나 `direct-text-collected`로 올리지 말 것.
- `貧女吟`은 이미 기존 catalog에 관련 direct-text가 있으므로 worker 항목을 그대로 승격하면 중복될 수 있다.
- `七詠`은 단일 카드보다 하위 7수 분할이 기존 compound split 원칙과 더 잘 맞는다.
