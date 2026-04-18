# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/archive  (2026-04-18)

## Corpus Check
- 3 files · ~60,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 11 nodes · 11 edges · 4 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `ensureCustomMap()` - 3 edges
2. `readJson()` - 2 edges
3. `writeJson()` - 2 edges
4. `extractZhName()` - 2 edges
5. `injectKoName()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.67
Nodes (2): extractZhName(), injectKoName()

### Community 1 - "Community 1"
Cohesion: 0.67
Nodes (3): ensureCustomMap(), readJson(), writeJson()

### Community 2 - "Community 2"
Cohesion: 1.0
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 2`** (2 nodes): `clean_zh()`, `fill_author_ko.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (2 nodes): `updateNavState()`, `readdy_like.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ensureCustomMap()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._