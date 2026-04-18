# Graph Report - shared  (2026-04-18)

## Corpus Check
- Corpus is ~16,015 words - fits in a single context window. You may not need a graph.

## Summary
- 92 nodes · 183 edges · 12 communities detected
- Extraction: 66% EXTRACTED · 34% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Shared|Shared]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]
- [[_COMMUNITY_Board|Board]]

## God Nodes (most connected - your core abstractions)
1. `handleClick()` - 21 edges
2. `renderPostCard()` - 12 edges
3. `showPoemModal()` - 12 edges
4. `escapeHTML()` - 11 edges
5. `findPostById()` - 7 edges
6. `nl2br()` - 6 edges
7. `renderCommentItem()` - 6 edges
8. `renderShowcaseCard()` - 6 edges
9. `renderListItem()` - 5 edges
10. `appendCards()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `loadBgTemplates()` --calls--> `escapeHTML()`  [INFERRED]
  shared/board/write.js → shared/board/core.js
- `renderListItem()` --calls--> `escapeHTML()`  [INFERRED]
  shared/board/feed.js → shared/board/core.js
- `renderListItem()` --calls--> `getProfileNickname()`  [INFERRED]
  shared/board/feed.js → shared/board/core.js
- `renderListItem()` --calls--> `timeAgo()`  [INFERRED]
  shared/board/feed.js → shared/board/core.js
- `renderPostCard()` --calls--> `escapeHTML()`  [INFERRED]
  shared/board/feed.js → shared/board/core.js

## Communities

### Community 0 - "Shared"
Cohesion: 0.17
Nodes (8): getUser(), isLoggedIn(), init(), Footer, Nav, 한시나루, 한시나루, 한시나루

### Community 1 - "Board"
Cohesion: 0.23
Nodes (14): handleCancelWrite(), handleClick(), handleCollapse(), handleDelete(), handleExpand(), handleReply(), handleSavePost(), handleShareFacebook() (+6 more)

### Community 2 - "Board"
Cohesion: 0.31
Nodes (9): appendCards(), checkExpandButtons(), removeCard(), renderListItem(), renderListItems(), renderPostCards(), setupScrollObserver(), updateLoadMoreButton() (+1 more)

### Community 3 - "Board"
Cohesion: 0.38
Nodes (7): getProfileNickname(), isPostOwner(), timeAgo(), prependCard(), renderPostCard(), replaceCard(), showPoemModal()

### Community 4 - "Board"
Cohesion: 0.43
Nodes (6): buildAiPrompt(), callGeminiImageApi(), initAiBgGenerate(), initAiGenModalControls(), uploadAiBgToStorage(), getSB()

### Community 5 - "Board"
Cohesion: 0.4
Nodes (2): getDisplayBgUrl(), toBlobUrl()

### Community 6 - "Board"
Cohesion: 0.4
Nodes (5): findPostById(), handleDeleteComment(), handleEdit(), handleLike(), handleShareTwitter()

### Community 7 - "Board"
Cohesion: 0.5
Nodes (3): initFileAttach(), loadBgTemplates(), renderAttachList()

### Community 8 - "Board"
Cohesion: 0.5
Nodes (3): renderCommentItem(), isAdmin(), isCommentOwner()

### Community 9 - "Board"
Cohesion: 0.67
Nodes (3): escapeHTML(), renderShowcaseCard(), renderShowcaseCards()

### Community 10 - "Board"
Cohesion: 0.5
Nodes (4): handleFormSubmits(), submitCommentForm(), submitReplyForm(), submitWriteForm()

### Community 11 - "Board"
Cohesion: 0.67
Nodes (3): nl2br(), renderBodyContent(), sanitizeHTML()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `escapeHTML()` connect `Board` to `Board`, `Board`, `Board`, `Board`, `Board`, `Board`, `Board`, `Board`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `handleClick()` connect `Board` to `Board`, `Board`, `Board`, `Board`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `showPoemModal()` connect `Board` to `Board`, `Board`, `Board`, `Board`, `Board`, `Board`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `handleClick()` (e.g. with `showPoemModal()` and `renderAttachList()`) actually correct?**
  _`handleClick()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `renderPostCard()` (e.g. with `escapeHTML()` and `getProfileNickname()`) actually correct?**
  _`renderPostCard()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `showPoemModal()` (e.g. with `handleClick()` and `escapeHTML()`) actually correct?**
  _`showPoemModal()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `escapeHTML()` (e.g. with `renderListItem()` and `renderPostCard()`) actually correct?**
  _`escapeHTML()` has 9 INFERRED edges - model-reasoned connections that need verification._