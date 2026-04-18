# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/tools  (2026-04-18)

## Corpus Check
- 13 files · ~34,260 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 312 nodes · 728 edges · 14 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `setCenterStatus()` - 24 edges
2. `renderSelectionSummary()` - 19 edges
3. `restoreSessionState()` - 18 edges
4. `normalizeAspectRatio()` - 16 edges
5. `main()` - 13 edges
6. `setStatus()` - 13 edges
7. `toast()` - 13 edges
8. `renderWorkList()` - 11 edges
9. `enforcePromptStyle()` - 11 edges
10. `saveImageToActiveQueue()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `updateAuthUI()` --calls--> `isLoggedIn()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/app.js → /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/db.js
- `_toast()` --calls--> `toast()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/settings.js → /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/app.js
- `clearAll()` --calls--> `clear()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/tools/author_image_collector.js → /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/editor.js
- `loadFromJsonText()` --calls--> `clear()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/tools/author_image_collector.js → /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/editor.js
- `getConfig()` --calls--> `getSupabaseConfig()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/db.js → /Users/jinwoo/Documents/development/hanshinaru/tools/ai-writer/js/settings.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (32): addCustomChip(), bindEvents(), getActiveContentType(), getContentTypes(), getStructuresForMode(), getStylePresets(), handleChipClick(), handleGenerate() (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (35): buildDryRunPrompt(), buildOpenAIInput(), buildSearchHaystack(), chunkArray(), cleanText(), composePromptBodyWithStylePrefix(), dedupePromptParts(), enforcePromptStyle() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (26): chat(), getBaseUrl(), getHeaders(), streamChat(), testConnection(), addSection(), _aiPopupClose(), _aiPopupInsert() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (20): BaseModel, api_generate(), api_poems(), api_upload_ref_audio(), GenerateRequest, get_model(), load_hyeonto(), load_poems() (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (23): buildOpenAIInput(), buildSerializableResults(), buildSessionSnapshot(), cleanText(), composePromptBodyWithStylePrefix(), dedupePromptParts(), extractChatContent(), getStoredApiKey() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (25): advanceToNextUncollected(), applyUrlInput(), bindEvents(), buildSearchQuery(), clearAll(), confirmCrop(), currentAuthor(), destroyCropper() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (26): clear(), applyCatalogRowsByIds(), applyFilters(), bindEvents(), clearImageCollectionData(), clearImages(), clearQueue(), clearResults() (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (17): addContentType(), addStylePreset(), _escHtml(), _genId(), getApiConfig(), getContentTypes(), getStylePresets(), getSupabaseConfig() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (17): applyAspectRatioToPrompt(), buildDryRunPrompt(), buildDryRunPromptKo(), confirmKoreanToEnglish(), enforcePromptStyle(), extractAspectRatioFromPrompt(), inferVisualCues(), mergeResults() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (16): applyCatalogToSelection(), buildQueueFromSelection(), copyAllPrompts(), copyText(), downloadImageZip(), exportResultsJson(), generatePrompts(), getSelectedWorks() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (14): _buildTree(), fetchArticlesBySection(), fetchMenuTree(), getConfig(), headers(), isLoggedIn(), list(), load() (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (11): compressImageBlob(), exportImageManifest(), getWorkById(), handleExistingImagesDirInput(), handlePaste(), handleQueueFileInput(), importExistingImageFiles(), moveToNextPendingQueue() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.36
Nodes (7): build(), _buildOutputFormat(), _buildSystem(), _buildUser(), parseSections(), _resolveStructure(), _resolveStyleDesc()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (2): init(), renderGrid()

## Knowledge Gaps
- **6 isolated node(s):** `Qwen3-TTS 테스트 스튜디오 서버 로컬 테스트 전용 — 시 선택 + 화자/스타일 조절 + 생성 + 재생 + 한국어 지원 + Voice Cl`, `librosa.load 대체: soundfile로 로드 + scipy로 리샘플.`, `librosa.resample 대체: scipy resample_poly 사용.`, `librosa.filters.mel 대체: numpy로 멜 필터뱅크 생성 (slaney norm).`, `TTS 입력용 텍스트 생성 (간체자 우선, 주석 제거).` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clear()` connect `Community 6` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.429) - this node is a cross-community bridge._
- **Why does `toast()` connect `Community 0` to `Community 2`, `Community 7`?**
  _High betweenness centrality (0.301) - this node is a cross-community bridge._
- **Why does `load()` connect `Community 0` to `Community 10`, `Community 3`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **What connects `Qwen3-TTS 테스트 스튜디오 서버 로컬 테스트 전용 — 시 선택 + 화자/스타일 조절 + 생성 + 재생 + 한국어 지원 + Voice Cl`, `librosa.load 대체: soundfile로 로드 + scipy로 리샘플.`, `librosa.resample 대체: scipy resample_poly 사용.` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._