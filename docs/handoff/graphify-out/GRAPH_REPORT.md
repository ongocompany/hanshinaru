---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/handoff  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8 nodes · 3 edges · 5 communities detected
- Extraction: 0% EXTRACTED · 100% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `Claude Handoff (민철 전달용)` - 1 edges
2. `Gemini Onboarding (태훈)` - 1 edges
3. `민철이가 할일` - 1 edges
4. `시인 출생지 & 교유관계 데이터 조사 요청서` - 1 edges
5. `Qwen-TTS 작업 핸드오프` - 1 edges
6. `TTS 음성 배정 작업 지시서` - 1 edges
7. `민철(Claude) → 태훈(Gemini) 작업 핸드오프` - 0 edges
8. `심층집필 배치 파이프라인 핸드오프` - 0 edges

## Surprising Connections (you probably didn't know these)
- `Claude Handoff (민철 전달용)` --semantically_similar_to--> `Gemini Onboarding (태훈)`  [INFERRED] [semantically similar]
  hanshinaru/docs/handoff/01_클로드_핸드오프_250212_JINtoCL.md → hanshinaru/docs/handoff/02_제미니_온보딩_250212_CLtoGE.md
- `시인 출생지 & 교유관계 데이터 조사 요청서` --rationale_for--> `민철이가 할일`  [INFERRED]
  hanshinaru/docs/handoff/05_시인출생지_관계데이터_조사요청_250214_CLtoGE.md → hanshinaru/docs/handoff/04_시인모달_지도관계도_작업지시서_250213_JINtoCL.md
- `Qwen-TTS 작업 핸드오프` --conceptually_related_to--> `TTS 음성 배정 작업 지시서`  [INFERRED]
  hanshinaru/docs/handoff/06_QwenTTS_작업핸드오프_260216_CHtoALL.md → hanshinaru/docs/handoff/07_TTS_음성배정_작업지시서_260216_CLtoALL.md

## Communities

### Community 0 - "Community 0"
Cohesion: 1.0
Nodes (2): Claude Handoff (민철 전달용), Gemini Onboarding (태훈)

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (2): 민철이가 할일, 시인 출생지 & 교유관계 데이터 조사 요청서

### Community 2 - "Community 2"
Cohesion: 1.0
Nodes (2): Qwen-TTS 작업 핸드오프, TTS 음성 배정 작업 지시서

### Community 3 - "Community 3"
Cohesion: 1.0
Nodes (1): 민철(Claude) → 태훈(Gemini) 작업 핸드오프

### Community 4 - "Community 4"
Cohesion: 1.0
Nodes (1): 심층집필 배치 파이프라인 핸드오프

## Knowledge Gaps
- **8 isolated node(s):** `Claude Handoff (민철 전달용)`, `Gemini Onboarding (태훈)`, `민철(Claude) → 태훈(Gemini) 작업 핸드오프`, `민철이가 할일`, `시인 출생지 & 교유관계 데이터 조사 요청서` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (2 nodes): `Claude Handoff (민철 전달용)`, `Gemini Onboarding (태훈)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 1`** (2 nodes): `민철이가 할일`, `시인 출생지 & 교유관계 데이터 조사 요청서`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (2 nodes): `Qwen-TTS 작업 핸드오프`, `TTS 음성 배정 작업 지시서`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (1 nodes): `민철(Claude) → 태훈(Gemini) 작업 핸드오프`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (1 nodes): `심층집필 배치 파이프라인 핸드오프`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Claude Handoff (민철 전달용)`, `Gemini Onboarding (태훈)`, `민철(Claude) → 태훈(Gemini) 작업 핸드오프` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._