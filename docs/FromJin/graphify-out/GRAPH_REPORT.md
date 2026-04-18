---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/FromJin  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 22 nodes · 31 edges · 4 communities detected
- Extraction: 58% EXTRACTED · 42% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `# 지시사항 :  아래 내용은 내가 GPT랑 웹에서 주고 받은 대화 내용이야. 읽어보면 뭘 하려고 하는지 알 수 있을거야.다 읽어보고, 전체 프레임워크 설계, 로직 설계 (엔진,AI)나눠서, UI기획 까지 해서 지금 이 문서가 있는 같은 폴더에 넘버링하고 MD문서로 저장해줘. UI나 로직은 꼭 아래대로 하라는거 아니니까, 살펴보고 네 아이디어까지 추가해서 제안해줘.` - 6 edges
2. `근체시 작성 도우미 전체 프레임워크 설계안 (v1)` - 6 edges
3. `근체시 작성 도우미 UI 기획안 (화면/플로우 중심)` - 6 edges
4. `#` - 6 edges
5. `남은사항 작업계획서` - 6 edges
6. `근체시 작성 도우미 로직 설계안 (엔진/AI 분리)` - 5 edges
7. `지훈 작업계획서` - 5 edges
8. `시 모달 UI 개선 종합 제안서` - 2 edges
9. `1. 모달폭 920px로 복귀 확정(더 줄여도 됨. 800정도라도 가독성 나쁘지 않을듯)` - 2 edges
10. `시 모달 UI 수정 실행 계획서` - 2 edges

## Surprising Connections (you probably didn't know these)
- `# 앱구동 시뮬레이션` --semantically_similar_to--> `근체시 작성 도우미 UI 기획안 (화면/플로우 중심)`  [INFERRED] [semantically similar]
  hanshinaru/docs/FromJin/14_한시작성도우미_UI아이디어.md → hanshinaru/docs/FromJin/09_시작성도우미_UI기획_260216_Codex.md
- `UI 관리툴작업지시` --semantically_similar_to--> `1. 현재 타임라인 인터페이스 확인해서 추가/수정 할수 있는 항목 체크 (아마 몇개 없을 것임)`  [INFERRED] [semantically similar]
  hanshinaru/docs/FromJin/11.UI관리툴작업지시_민철에게.md → hanshinaru/docs/FromJin/10_관리자툴_역사관리탭작업지시서_toCL.md
- `당시삼백수에서 사이트개편안` --conceptually_related_to--> `#`  [INFERRED]
  hanshinaru/docs/FromJin/15_당시삼백수_사이트개편안.md → hanshinaru/docs/FromJin/12_남은사항들_민철에게.md
- `시인 모달 및 시인 관리툴 UI 개선 방향` --rationale_for--> `시 모달 UI 개선 종합 제안서`  [INFERRED]
  hanshinaru/docs/FromJin/UI_developing_brainstorming.md → hanshinaru/docs/FromJin/02_UI_improvement_synthesis_260215_CL.md
- `시 모달 UI 개선 종합 제안서` --rationale_for--> `1. 모달폭 920px로 복귀 확정(더 줄여도 됨. 800정도라도 가독성 나쁘지 않을듯)`  [INFERRED]
  hanshinaru/docs/FromJin/02_UI_improvement_synthesis_260215_CL.md → hanshinaru/docs/FromJin/03_Jin_answer.md

## Communities

### Community 0 - "Community 0"
Cohesion: 0.58
Nodes (9): # 지시사항 :  아래 내용은 내가 GPT랑 웹에서 주고 받은 대화 내용이야. 읽어보면 뭘 하려고 하는지 알 수 있을거야.다 읽어보고, 전체 프레임워크 설계, 로직 설계 (엔진,AI)나눠서, UI기획 까지 해서 지금 이 문서가 있는 같은 폴더에 넘버링하고 MD문서로 저장해줘. UI나 로직은 꼭 아래대로 하라는거 아니니까, 살펴보고 네 아이디어까지 추가해서 제안해줘., 근체시 작성 도우미 전체 프레임워크 설계안 (v1), 근체시 작성 도우미 로직 설계안 (엔진/AI 분리), 근체시 작성 도우미 UI 기획안 (화면/플로우 중심), #, 남은사항 작업계획서, 지훈 작업계획서, # 앱구동 시뮬레이션 (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.4
Nodes (5): 시 모달 UI 개선 종합 제안서, 1. 모달폭 920px로 복귀 확정(더 줄여도 됨. 800정도라도 가독성 나쁘지 않을듯), 시 모달 UI 수정 실행 계획서, 고생했네. 훨씬 보기 좋음. 몇가지 수정사항., 시인 모달 및 시인 관리툴 UI 개선 방향

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (5): 1.  모든 상세 페이지 가로폭 1300pixel로 통일 (히어로 하단, 가운데 정렬, 양쪽 콘텐츠 없는 부분은 흰색 백그라운드), 1. 공통사항 :, 사이트브랜드명 변경 한시의모든것 -> 온고 (온고이지신에서 따온 말, 영어 ongo.kr 도메인등록완료), 한시나루 (한시를 통해 역사의나루를 건너다 라는 의미.hanshinaru.kr 도메인등록완료) 둘중의 하나로, 1. boardContainer 가로폭 750으로 확대, 커뮤니티 페이지 구성안

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (3): 1. 현재 타임라인 인터페이스 확인해서 추가/수정 할수 있는 항목 체크 (아마 몇개 없을 것임), UI 관리툴작업지시, poem-edit-pane 에서 poem-batch-panel 모두 히든처리

## Knowledge Gaps
- **8 isolated node(s):** `고생했네. 훨씬 보기 좋음. 몇가지 수정사항.`, `UI 관리툴작업지시`, `# 앱구동 시뮬레이션`, `당시삼백수에서 사이트개편안`, `1.  모든 상세 페이지 가로폭 1300pixel로 통일 (히어로 하단, 가운데 정렬, 양쪽 콘텐츠 없는 부분은 흰색 백그라운드)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `근체시 작성 도우미 전체 프레임워크 설계안 (v1)` (e.g. with `근체시 작성 도우미 로직 설계안 (엔진/AI 분리)` and `근체시 작성 도우미 UI 기획안 (화면/플로우 중심)`) actually correct?**
  _`근체시 작성 도우미 전체 프레임워크 설계안 (v1)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `근체시 작성 도우미 UI 기획안 (화면/플로우 중심)` (e.g. with `근체시 작성 도우미 전체 프레임워크 설계안 (v1)` and `# 앱구동 시뮬레이션`) actually correct?**
  _`근체시 작성 도우미 UI 기획안 (화면/플로우 중심)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `고생했네. 훨씬 보기 좋음. 몇가지 수정사항.`, `UI 관리툴작업지시`, `# 앱구동 시뮬레이션` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._