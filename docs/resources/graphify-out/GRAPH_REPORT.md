---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/resources  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 13 nodes · 18 edges · 4 communities detected
- Extraction: 56% EXTRACTED · 44% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.96)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `Hanshi General Overview` - 8 edges
2. `Han Dynasty Poetry` - 3 edges
3. `Wei Jin Northern and Southern Dynasties Poetry` - 3 edges
4. `Song Dynasty Poetry` - 3 edges
5. `Yuan Dynasty Poetry` - 3 edges
6. `Ming Dynasty Poetry` - 3 edges
7. `Chinese Poetry Reading Map` - 2 edges
8. `Representative Authors and Works Commentary` - 2 edges
9. `Pre-Qin Poetry` - 2 edges
10. `Tang Dynasty Poetry` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Hanshi General Overview` --references--> `Qing Dynasty Poetry`  [EXTRACTED]
  hanshinaru/docs/resources/중국한시페이지용문서들/2-1한시일반론.md → hanshinaru/docs/resources/중국한시페이지용문서들/2-2-8청대의 시문학.md
- `Chinese Poetry Reading Map` --conceptually_related_to--> `Hanshi General Overview`  [EXTRACTED]
  hanshinaru/docs/resources/중국한시페이지용문서들/2-1-1 중국시문학통사.md → hanshinaru/docs/resources/중국한시페이지용문서들/2-1한시일반론.md
- `Wei Jin Northern and Southern Dynasties Poetry` --conceptually_related_to--> `Tang Dynasty Poetry`  [INFERRED]
  hanshinaru/docs/resources/중국한시페이지용문서들/2-2-3위진남북조 시대의 시.md → hanshinaru/docs/resources/중국한시페이지용문서들/2-2-4唐代 의 詩.md
- `Yuan Dynasty Poetry` --conceptually_related_to--> `Ming Dynasty Poetry`  [INFERRED]
  hanshinaru/docs/resources/중국한시페이지용문서들/2-2-7원대의 시문학.md → hanshinaru/docs/resources/중국한시페이지용문서들/2-2-8명대의 시문학.md
- `Hanshi General Overview` --references--> `Pre-Qin Poetry`  [EXTRACTED]
  hanshinaru/docs/resources/중국한시페이지용문서들/2-1한시일반론.md → hanshinaru/docs/resources/중국한시페이지용문서들/2-2-1 춘추전국시대의 시.md

## Communities

### Community 0 - "Community 0"
Cohesion: 0.83
Nodes (4): Han Dynasty Poetry, Hanshi General Overview, Pre-Qin Poetry, Wei Jin Northern and Southern Dynasties Poetry

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (4): Five Dynasties Poetry, Song Dynasty Poetry, Tang Dynasty Poetry, Yuan Dynasty Poetry

### Community 2 - "Community 2"
Cohesion: 0.67
Nodes (3): Chinese Poetry Reading Map, Period Poets and Works Catalog, Representative Authors and Works Commentary

### Community 3 - "Community 3"
Cohesion: 1.0
Nodes (2): Ming Dynasty Poetry, Qing Dynasty Poetry

## Knowledge Gaps
- **1 isolated node(s):** `Period Poets and Works Catalog`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 3`** (2 nodes): `Ming Dynasty Poetry`, `Qing Dynasty Poetry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Hanshi General Overview` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.720) - this node is a cross-community bridge._
- **Why does `Chinese Poetry Reading Map` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.303) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Han Dynasty Poetry` (e.g. with `Pre-Qin Poetry` and `Wei Jin Northern and Southern Dynasties Poetry`) actually correct?**
  _`Han Dynasty Poetry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Wei Jin Northern and Southern Dynasties Poetry` (e.g. with `Han Dynasty Poetry` and `Tang Dynasty Poetry`) actually correct?**
  _`Wei Jin Northern and Southern Dynasties Poetry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Song Dynasty Poetry` (e.g. with `Five Dynasties Poetry` and `Yuan Dynasty Poetry`) actually correct?**
  _`Song Dynasty Poetry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Yuan Dynasty Poetry` (e.g. with `Song Dynasty Poetry` and `Ming Dynasty Poetry`) actually correct?**
  _`Yuan Dynasty Poetry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Period Poets and Works Catalog` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._