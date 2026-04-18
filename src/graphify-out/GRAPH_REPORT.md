# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/src  (2026-04-18)

## Corpus Check
- 2 files · ~486 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7 nodes · 8 edges · 2 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]

## God Nodes (most connected - your core abstractions)
1. `fetchAllMenus()` - 4 edges
2. `getTopMenu()` - 2 edges
3. `getSidebar()` - 2 edges
4. `sbFetch()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `fetchAllMenus()` --calls--> `sbFetch()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/src/lib/menu.ts → /Users/jinwoo/Documents/development/hanshinaru/src/lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.6
Nodes (3): fetchAllMenus(), getSidebar(), getTopMenu()

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (1): sbFetch()

## Knowledge Gaps
- **Thin community `Community 1`** (2 nodes): `sbFetch()`, `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetchAllMenus()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.567) - this node is a cross-community bridge._
- **Why does `sbFetch()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.333) - this node is a cross-community bridge._