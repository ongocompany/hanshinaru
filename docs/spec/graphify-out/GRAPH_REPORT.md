---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/spec  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 6 nodes · 9 edges · 2 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]

## God Nodes (most connected - your core abstractions)
1. `AI Writer Design Spec` - 5 edges
2. `AI Writer Editor Modes` - 4 edges
3. `AI Writer Prompt System` - 3 edges
4. `AI Writer Content Type Model` - 2 edges
5. `AI Writer Multi Provider Abstraction` - 2 edges
6. `AI Writer DB Save Routing` - 2 edges

## Surprising Connections (you probably didn't know these)
- `AI Writer Design Spec` --references--> `AI Writer Multi Provider Abstraction`  [EXTRACTED]
  hanshinaru/docs/spec/2026-04-13-ai-writer-design.md → hanshinaru/docs/spec/2026-04-13-ai-writer-design.md  _Bridges community 0 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.83
Nodes (4): AI Writer Content Type Model, AI Writer DB Save Routing, AI Writer Design Spec, AI Writer Editor Modes

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (2): AI Writer Prompt System, AI Writer Multi Provider Abstraction

## Knowledge Gaps
- **Thin community `Community 1`** (2 nodes): `AI Writer Prompt System`, `AI Writer Multi Provider Abstraction`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Writer Design Spec` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.400) - this node is a cross-community bridge._
- **Why does `AI Writer Editor Modes` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `AI Writer Prompt System` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._