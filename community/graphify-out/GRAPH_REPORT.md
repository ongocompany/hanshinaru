# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/community  (2026-04-18)

## Corpus Check
- 1 files · ~2,904 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 11 nodes · 16 edges · 2 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]

## God Nodes (most connected - your core abstractions)
1. `initCommunity()` - 7 edges
2. `fetchPreview()` - 2 edges
3. `fetchShowcasePreview()` - 2 edges
4. `renderPreviewTable()` - 2 edges
5. `renderShowcasePreview()` - 2 edges
6. `fetchNewsPreview()` - 2 edges
7. `renderNewsPreview()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `initCommunity()` --calls--> `renderShowcasePreview()`  [EXTRACTED]
  /Users/jinwoo/Documents/development/hanshinaru/community/community.js → /Users/jinwoo/Documents/development/hanshinaru/community/community.js  _Bridges community 0 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.33
Nodes (2): renderNewsPreview(), renderShowcasePreview()

### Community 1 - "Community 1"
Cohesion: 0.4
Nodes (5): fetchNewsPreview(), fetchPreview(), fetchShowcasePreview(), initCommunity(), renderPreviewTable()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initCommunity()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._