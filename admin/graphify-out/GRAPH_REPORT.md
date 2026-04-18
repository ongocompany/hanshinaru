# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/admin  (2026-04-18)

## Corpus Check
- 11 files · ~25,881 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 246 nodes · 557 edges · 16 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `showToast()` - 39 edges
2. `checkChanges()` - 34 edges
3. `runValidation()` - 17 edges
4. `renderPoemList()` - 14 edges
5. `selectPoem()` - 13 edges
6. `renderAuthorList()` - 13 edges
7. `updatePoemFieldHighlights()` - 12 edges
8. `$()` - 12 edges
9. `selectAuthor()` - 10 edges
10. `renderPoemPreview()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `initAuthorManager()` --calls--> `initRelationEditor()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/admin/author-manager.js → /Users/jinwoo/Documents/development/hanshinaru/admin/relation-editor.js
- `checkChanges()` --calls--> `isUISettingsModified()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/admin/admin.js → /Users/jinwoo/Documents/development/hanshinaru/admin/ui-manager.js
- `copyBatchPromptOutput()` --calls--> `showToast()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/admin/poem-manager.js → /Users/jinwoo/Documents/development/hanshinaru/admin/articles.js
- `onBoxControlChange()` --calls--> `checkChanges()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/admin/poem-manager.js → /Users/jinwoo/Documents/development/hanshinaru/admin/admin.js
- `saveManifest()` --calls--> `showToast()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/admin/tool-manager.js → /Users/jinwoo/Documents/development/hanshinaru/admin/articles.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (30): $(), addMenuOption(), bindEvents(), closeMenuEdit(), closeMenuManager(), createArticle(), deleteArticle(), deleteMenu() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (28): checkChanges(), discardAll(), updateCount(), addNewAuthor(), bindAuthorEvents(), buildPoemCounts(), deleteCurrentAuthor(), escapeHTMLAdmin() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (25): showToast(), applyAvatarUrl(), bindAvatarEvents(), buildAvatarSearchQuery(), confirmAvatarCrop(), destroyAvatarCropper(), handleAvatarFile(), handleAvatarPaste() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (17): autoFixW03(), bindValidatorEvents(), checkE01(), checkE02(), checkE03(), checkE04(), checkE05(), checkInfos() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (15): applyPreviewScale(), bindPreviewNoteEvents(), cleanLegacyKoReferencesAdmin(), copyBatchPromptOutput(), hexToRgbAdmin(), initPvTextDrag(), injectNoteMarkersByHeadAdmin(), normalizeZhNameAdmin() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (10): dbHistoryToAdmin(), dbPoemsToAdmin(), dbPoetsToAdmin(), loadAllData(), loadJSON(), saveAll(), saveFile(), saveToSupabase() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.3
Nodes (13): addRelationRow(), deleteRelation(), finishAddRelation(), getTargetDisplay(), initRelationEditor(), loadRelations(), offerBidirectional(), onRelTableClick() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (12): addHistory(), bindHistoryEvents(), deleteHistory(), getHistoryEra(), hideHistoryEditForm(), initHistoryManager(), onHistoryFormChange(), renderHistoryAnnotations() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (11): deleteBgImage(), detectImageRatio(), getBgImageUrl(), getRandomBgFilename(), handleBgPaste(), playTts(), renderBgImage(), renderOwnedReadonlySection() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.36
Nodes (9): bindUIManagerEvents(), initUIManager(), isUISettingsModified(), onFontSettingChange(), renderEraColors(), renderFontSettings(), renderPreview(), renderSectionColors() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (9): addNote(), addYoutubeLink(), confirmCurrentPoem(), handleBgFileSelect(), removeNote(), removeYoutubeLink(), renderNotesList(), renderYoutubeList() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.28
Nodes (9): clearBatchSelection(), getPoetAuthorMap(), invalidateBatchPromptOutput(), renderPoemList(), selectAllBatchPoems(), setBatchSelection(), setBatchSelectionForVisible(), sortPoemList() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (7): bindPoemEvents(), buildBatchTranslationPrompt(), getBatchSelectedPoems(), initPoemBatchPanel(), initPoemManager(), initResizeHandles(), updateBatchSelectionSummary()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (6): generatePinyinPingze(), loadPingshuiCharMap(), normalizePoetNameForPoem(), onPoemFormChange(), searchYoutube(), tradToSimp()

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (5): applyEditorToPreview(), onEditorChange(), saveEditorToPoem(), setEditorAlign(), toggleEditorBtn()

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (4): findHyeontoForPoem(), renderHyeonto(), revertHyeontoForCurrentPoem(), saveHyeontoForCurrentPoem()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `showToast()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 15`?**
  _High betweenness centrality (0.510) - this node is a cross-community bridge._
- **Why does `checkChanges()` connect `Community 1` to `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`?**
  _High betweenness centrality (0.282) - this node is a cross-community bridge._
- **Why does `runValidation()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `showToast()` (e.g. with `addPoemCard()` and `saveManifest()`) actually correct?**
  _`showToast()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `checkChanges()` (e.g. with `autoFixW03()` and `offerBidirectional()`) actually correct?**
  _`checkChanges()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._