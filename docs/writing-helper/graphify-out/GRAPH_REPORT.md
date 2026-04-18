---
title: Graph Report
type: reference
doc_type: reference
status: active
epic_id: eb50495d-28a3-4001-8fdd-e7f3d3a3e36b
date: 2026-04-18
---
# Graph Report - docs/writing-helper  (2026-04-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3 nodes · 3 edges · 1 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]

## God Nodes (most connected - your core abstractions)
1. `Design Review Report` - 2 edges
2. `Technical Review Report` - 2 edges
3. `Development Roadmap And Task Assignment` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Technical Review Report` --references--> `Design Review Report`  [EXTRACTED]
  hanshinaru/docs/writing-helper/02_기술검토보고서_260217_CL.md → hanshinaru/docs/writing-helper/01_설계검토보고서_260217_CL.md
- `Development Roadmap And Task Assignment` --references--> `Design Review Report`  [EXTRACTED]
  hanshinaru/docs/writing-helper/03_개발로드맵_260217_CL.md → hanshinaru/docs/writing-helper/01_설계검토보고서_260217_CL.md
- `Development Roadmap And Task Assignment` --references--> `Technical Review Report`  [EXTRACTED]
  hanshinaru/docs/writing-helper/03_개발로드맵_260217_CL.md → hanshinaru/docs/writing-helper/02_기술검토보고서_260217_CL.md

## Communities

### Community 0 - "Community 0"
Cohesion: 1.0
Nodes (3): Design Review Report, Development Roadmap And Task Assignment, Technical Review Report

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._