# Graph Report - timeline  (2026-04-18)

## Corpus Check
- Corpus is ~6,183 words - fits in a single context window. You may not need a graph.

## Summary
- 73 nodes · 152 edges · 6 communities detected
- Extraction: 52% EXTRACTED · 48% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Timeline|Timeline]]
- [[_COMMUNITY_Timeline|Timeline]]
- [[_COMMUNITY_Timeline|Timeline]]
- [[_COMMUNITY_Timeline|Timeline]]
- [[_COMMUNITY_Timeline|Timeline]]
- [[_COMMUNITY_Timeline|Timeline]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 19 edges
2. `escapeHTML()` - 13 edges
3. `openAuthorModal()` - 11 edges
4. `el()` - 9 edges
5. `renderMainHistoryCard()` - 8 edges
6. `renderFeaturedEvent()` - 8 edges
7. `한시나루` - 7 edges
8. `normalizeZhName()` - 6 edges
9. `renderPoetMiniCards()` - 5 edges
10. `buildPoetPopupHTML()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `bindHoverPopups()`  [INFERRED]
  timeline/app.js → timeline/tooltip.js
- `main()` --calls--> `loadJSON()`  [INFERRED]
  timeline/app.js → timeline/data.js
- `main()` --calls--> `applyUISettings()`  [INFERRED]
  timeline/app.js → timeline/data.js
- `main()` --calls--> `bindModalOpeners()`  [INFERRED]
  timeline/app.js → timeline/author-modal.js
- `buildPoetPopupHTML()` --calls--> `getAuthorAvatar()`  [INFERRED]
  timeline/tooltip.js → timeline/timeline-render.js

## Communities

### Community 0 - "Timeline"
Cohesion: 0.24
Nodes (14): main(), bindAccordions(), bindFeaturedToggle(), bindModalUI(), distributeIrregularRows(), renderBookend(), renderEraSection(), renderEraSection_v3() (+6 more)

### Community 1 - "Timeline"
Cohesion: 0.2
Nodes (12): bindModalOpeners(), initBirthplaceMap(), initRelationGraph(), openAuthorModal(), bindPoemSections(), handleTtsPlay(), stopTtsPlayback(), 한시나루 (+4 more)

### Community 2 - "Timeline"
Cohesion: 0.2
Nodes (13): applyUISettings(), buildAuthorEvents(), buildAuthorPoemIndex(), dbHistoryToJSON(), dbPoemsToJSON(), dbPoetsToJSON(), loadFromSupabase(), loadJSON() (+5 more)

### Community 3 - "Timeline"
Cohesion: 0.25
Nodes (7): renderPoemSection(), cleanLegacyKoReferences(), getHistoryEra(), groupHistoryByEra(), injectNoteMarkersByHead(), parseTextWithNotes(), stripInlineNoteMarkers()

### Community 4 - "Timeline"
Cohesion: 0.31
Nodes (6): bindHoverPopups(), getOrCreatePopup(), getOrCreateTooltip(), positionTooltipAtCursor(), showAnnotationTooltip(), showPopup()

### Community 5 - "Timeline"
Cohesion: 0.32
Nodes (8): renderFeaturedEvent(), renderMainHistoryCard(), buildHistoryPopupHTML(), formatEventLife(), getHistoryTagList(), hideDaggers(), renderTagChips(), splitParagraphs()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `한시나루` connect `Timeline` to `Timeline`, `Timeline`, `Timeline`, `Timeline`?**
  _High betweenness centrality (0.271) - this node is a cross-community bridge._
- **Why does `main()` connect `Timeline` to `Timeline`, `Timeline`, `Timeline`, `Timeline`, `Timeline`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `escapeHTML()` connect `Timeline` to `Timeline`, `Timeline`, `Timeline`, `Timeline`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `main()` (e.g. with `loadFromSupabase()` and `loadJSON()`) actually correct?**
  _`main()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `escapeHTML()` (e.g. with `renderMainHistoryCard()` and `renderMinorHistoryDot()`) actually correct?**
  _`escapeHTML()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `openAuthorModal()` (e.g. with `formatLife()` and `normalizeZhName()`) actually correct?**
  _`openAuthorModal()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `el()` (e.g. with `renderPoetNames()` and `renderMainHistoryCard()`) actually correct?**
  _`el()` has 8 INFERRED edges - model-reasoned connections that need verification._