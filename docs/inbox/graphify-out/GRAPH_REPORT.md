---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/inbox  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3 nodes · 3 edges · 1 communities detected
- Extraction: 33% EXTRACTED · 67% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]

## God Nodes (most connected - your core abstractions)
1. `📬 AI 메시지 큐 (Inbox Protocol)` - 2 edges
2. `Sprint Contract SC-001: app.js / board.js 모듈 분리` - 2 edges
3. `Sprint Contract SC-002: 페이지 구조 통일 + CMS화` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Sprint Contract SC-001: app.js / board.js 모듈 분리` --implements--> `📬 AI 메시지 큐 (Inbox Protocol)`  [INFERRED]
  hanshinaru/docs/inbox/to-claude/001-from-roy-module-split.md → hanshinaru/docs/inbox/README.md
- `Sprint Contract SC-002: 페이지 구조 통일 + CMS화` --implements--> `📬 AI 메시지 큐 (Inbox Protocol)`  [INFERRED]
  hanshinaru/docs/inbox/to-claude/002-from-roy-page-structure.md → hanshinaru/docs/inbox/README.md
- `Sprint Contract SC-002: 페이지 구조 통일 + CMS화` --references--> `Sprint Contract SC-001: app.js / board.js 모듈 분리`  [EXTRACTED]
  hanshinaru/docs/inbox/to-claude/002-from-roy-page-structure.md → hanshinaru/docs/inbox/to-claude/001-from-roy-module-split.md

## Communities

### Community 0 - "Community 0"
Cohesion: 1.0
Nodes (3): Sprint Contract SC-001: app.js / board.js 모듈 분리, Sprint Contract SC-002: 페이지 구조 통일 + CMS화, 📬 AI 메시지 큐 (Inbox Protocol)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `📬 AI 메시지 큐 (Inbox Protocol)` (e.g. with `Sprint Contract SC-001: app.js / board.js 모듈 분리` and `Sprint Contract SC-002: 페이지 구조 통일 + CMS화`) actually correct?**
  _`📬 AI 메시지 큐 (Inbox Protocol)` has 2 INFERRED edges - model-reasoned connections that need verification._