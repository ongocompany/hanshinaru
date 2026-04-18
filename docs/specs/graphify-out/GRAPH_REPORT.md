---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/specs  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 4 nodes · 4 edges · 2 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]

## God Nodes (most connected - your core abstractions)
1. `New Epic Design Spec` - 3 edges
2. `New Epic Task Breakdown Scaffold` - 2 edges
3. `Unlinked Plan Reference` - 2 edges
4. `New Epic Tech Stack` - 1 edges

## Surprising Connections (you probably didn't know these)
- `New Epic Design Spec` --references--> `New Epic Task Breakdown Scaffold`  [EXTRACTED]
  hanshinaru/docs/specs/2026-04-16-새-에픽.md → hanshinaru/docs/specs/2026-04-16-새-에픽.md  _Bridges community 0 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 1.0
Nodes (2): New Epic Design Spec, New Epic Tech Stack

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (2): New Epic Task Breakdown Scaffold, Unlinked Plan Reference

## Knowledge Gaps
- **1 isolated node(s):** `New Epic Tech Stack`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (2 nodes): `New Epic Design Spec`, `New Epic Tech Stack`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 1`** (2 nodes): `New Epic Task Breakdown Scaffold`, `Unlinked Plan Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `New Epic Design Spec` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.667) - this node is a cross-community bridge._
- **What connects `New Epic Tech Stack` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._