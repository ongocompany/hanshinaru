---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/reference  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 14 nodes · 14 edges · 3 communities detected
- Extraction: 21% EXTRACTED · 50% INFERRED · 29% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]

## God Nodes (most connected - your core abstractions)
1. `Main page hero reference video (unsupported media)` - 5 edges
2. `Frontend structure audit report` - 4 edges
3. `Project context and collaboration posture` - 4 edges
4. `Data management tool overview` - 3 edges
5. `Hero frame sequence (RGB)` - 2 edges
6. `Hero frame sequence (alpha)` - 2 edges
7. `GitHub multi-environment workflow guide` - 1 edges
8. `Poet list for layout simulation` - 1 edges
9. `Phased data management tool plan` - 1 edges
10. `Qwen3-TTS article summary` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Hero frame sequence (RGB)` --conceptually_related_to--> `Main page hero reference video (unsupported media)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/frames/frame_0001.png → hanshinaru/docs/reference/메인페이지히어로섹션/rawingboat_1.webm
- `Hero frame sequence (alpha)` --conceptually_related_to--> `Main page hero reference video (unsupported media)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/frames_alpha/frame_0001.png → hanshinaru/docs/reference/메인페이지히어로섹션/rawingboat_1.webm
- `River scroll panorama image` --conceptually_related_to--> `Main page hero reference video (unsupported media)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/river_scroll.jpg → hanshinaru/docs/reference/메인페이지히어로섹션/rawingboat_1.webm
- `Samusa graphic asset` --conceptually_related_to--> `Main page hero reference video (unsupported media)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/samusa.png → hanshinaru/docs/reference/메인페이지히어로섹션/rawingboat_1.webm
- `Frontend structure audit report` --conceptually_related_to--> `Project context and collaboration posture`  [INFERRED]
  hanshinaru/docs/reference/01_프론트구조_점검보고서_250211_CL.md → hanshinaru/docs/reference/02_프로젝트_컨텍스트_250212_CL.md

## Communities

### Community 0 - "Community 0"
Cohesion: 0.4
Nodes (6): Hero frame sequence (alpha), Hero frame sequence (RGB), Main page hero reference video (unsupported media), Hero video sidecar metadata, River scroll panorama image, Samusa graphic asset

### Community 1 - "Community 1"
Cohesion: 0.4
Nodes (5): Project context and collaboration posture, GitHub multi-environment workflow guide, Data management tool overview, Phased data management tool plan, Qwen3-TTS article summary

### Community 2 - "Community 2"
Cohesion: 0.67
Nodes (3): Frontend structure audit report, Poet list for layout simulation, Typography style guide

## Ambiguous Edges - Review These
- `Main page hero reference video (unsupported media)` → `Hero frame sequence (RGB)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/frames/frame_0001.png · relation: conceptually_related_to
- `Main page hero reference video (unsupported media)` → `Hero frame sequence (alpha)`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/frames_alpha/frame_0001.png · relation: conceptually_related_to
- `Main page hero reference video (unsupported media)` → `River scroll panorama image`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/river_scroll.jpg · relation: conceptually_related_to
- `Main page hero reference video (unsupported media)` → `Samusa graphic asset`  [AMBIGUOUS]
  hanshinaru/docs/reference/메인페이지히어로섹션/samusa.png · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `GitHub multi-environment workflow guide`, `Poet list for layout simulation`, `Phased data management tool plan`, `Qwen3-TTS article summary`, `Typography style guide` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **High ambiguity: 29% of edges are AMBIGUOUS.** Review the Ambiguous Edges section above.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Main page hero reference video (unsupported media)` and `Hero frame sequence (RGB)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Main page hero reference video (unsupported media)` and `Hero frame sequence (alpha)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Main page hero reference video (unsupported media)` and `River scroll panorama image`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Main page hero reference video (unsupported media)` and `Samusa graphic asset`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Frontend structure audit report` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `Project context and collaboration posture` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Frontend structure audit report` (e.g. with `Project context and collaboration posture` and `Poet list for layout simulation`) actually correct?**
  _`Frontend structure audit report` has 4 INFERRED edges - model-reasoned connections that need verification._