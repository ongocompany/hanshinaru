# Graph Report - korean-poetry  (2026-04-18)

## Corpus Check
- Corpus is ~4,412 words - fits in a single context window. You may not need a graph.

## Summary
- 12 nodes · 16 edges · 3 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Poets|Poets]]
- [[_COMMUNITY_General|General]]
- [[_COMMUNITY_Poets|Poets]]

## God Nodes (most connected - your core abstractions)
1. `escapeHTML()` - 3 edges
2. `loadTimeline()` - 3 edges
3. `renderPoetCard()` - 3 edges
4. `renderPoemFull()` - 3 edges
5. `한시나루` - 3 edges
6. `renderTimeline()` - 2 edges
7. `initNavigation()` - 2 edges
8. `한시나루` - 2 edges
9. `한시나루` - 1 edges
10. `한시나루` - 1 edges

## Surprising Connections (you probably didn't know these)
- `한시나루` --references--> `한시나루`  [INFERRED]
  korean-poetry/index.html → korean-poetry/poets/index.html
- `한시나루` --references--> `한시나루`  [INFERRED]
  korean-poetry/index.html → korean-poetry/general/index.html
- `한시나루` --references--> `한시나루`  [INFERRED]
  korean-poetry/index.html → korean-poetry/great-poets/index.html

## Communities

### Community 0 - "Poets"
Cohesion: 0.6
Nodes (3): initNavigation(), loadTimeline(), renderTimeline()

### Community 1 - "General"
Cohesion: 0.5
Nodes (4): 한시나루, 한시나루, 한시나루, 한시나루

### Community 2 - "Poets"
Cohesion: 1.0
Nodes (3): escapeHTML(), renderPoemFull(), renderPoetCard()

## Knowledge Gaps
- **2 isolated node(s):** `한시나루`, `한시나루`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `한시나루` connect `General` to `Poets`?**
  _High betweenness centrality (0.436) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `한시나루` (e.g. with `한시나루` and `한시나루`) actually correct?**
  _`한시나루` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `한시나루`, `한시나루` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._