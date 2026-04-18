# Graph Report - /Users/jinwoo/Documents/development/hanshinaru/scripts  (2026-04-18)

## Corpus Check
- 30 files · ~35,356 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 292 nodes · 623 edges · 29 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `normalizeWhitespace()` - 36 edges
2. `normalizeArticleRecord()` - 19 edges
3. `applyArticleTypePolicy()` - 16 edges
4. `aiFilterAndRewrite()` - 15 edges
5. `clipText()` - 13 edges
6. `main()` - 12 edges
7. `cleanArticleText()` - 12 edges
8. `enforceNewsRewriteQuality()` - 11 edges
9. `main()` - 11 edges
10. `main()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `sleep()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/scripts/fix_jipyeong.py → /Users/jinwoo/Documents/development/hanshinaru/scripts/crawl_news.js
- `run()` --calls--> `curl_json()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/scripts/test_qwen_extract.js → /Users/jinwoo/Documents/development/hanshinaru/scripts/build_korean_poem_json.py
- `run()` --calls--> `curl_text()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/scripts/test_qwen_extract.js → /Users/jinwoo/Documents/development/hanshinaru/scripts/build_korean_poem_json.py
- `run()` --calls--> `run_curl()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/scripts/test_qwen_extract.js → /Users/jinwoo/Documents/development/hanshinaru/scripts/enrich_korean_poet_bio_detail.py
- `sleep()` --calls--> `main()`  [INFERRED]
  /Users/jinwoo/Documents/development/hanshinaru/scripts/crawl_news.js → /Users/jinwoo/Documents/development/hanshinaru/scripts/generate_qwen_translation.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (65): aggregateRecurringEventArticles(), aiFilterAndRewrite(), applyAiRewriteToExisting(), applyArticleTypePolicy(), areNearDuplicateArticles(), articleQualityScore(), buildAggregatedEventArticle(), buildAiReviewArticles() (+57 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (31): build_poem_entries(), build_query_titles(), clean_author(), curl_json(), curl_text(), decode_ddg_href(), extract_poem_blocks_from_wikitext(), extract_poem_body_from_extract() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (20): deduplicateArticles(), extractTag(), fetchUrl(), main(), printRunStats(), saveJsonAtomically(), searchGoogleNews(), searchNaver() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (15): build_ssl_context(), call_qwen(), get_api_key(), main(), ensure_ffmpeg(), find_local_snapshot_for_repo_id(), load_poems(), main() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (14): appendBlocksInChunks(), collectMarkdownFiles(), deleteAllBlocks(), fileHash(), getOrCreateFolderPage(), loadPageMap(), main(), makeCodeBlocks() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (14): build_ssl_context(), build_user_prompt(), call_gemini(), choose_poem_numbers(), extract_json(), get_api_key(), load_poems(), load_queue() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (12): build_ssl_context(), build_user_prompt(), call_qwen(), get_api_key(), load_poems(), main(), norm_no(), parse_args() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (12): buildJsonRepairPrompt(), callAiAndParseArray(), callAiProvider(), callClaude(), callOpenAI(), extractJsonArray(), extractJsonObject(), parseAiJsonArray() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.36
Nodes (11): buildUserPrompt(), callAI(), callAnthropic(), callGemini(), callOpenAI(), callQwen(), httpPost(), main() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (9): clean_poem_text(), get_pingze_line(), get_pinyin_line(), load_json(), process_poems(), 원문에서 주석번호 [숫자] 제거 → 순수 한자 텍스트, 한 행의 한자를 병음으로 변환 (성조부호, 공백 구분), 한 행의 한자에 대해 평(平)/측(仄) 판별 (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.42
Nodes (8): extractCommentary(), extractFixJipyeong(), extractJipyeongKo(), extractTranslation(), hasJipyeongWonmun(), main(), parseNotes(), stripMarkers()

### Community 11 - "Community 11"
Cohesion: 0.57
Nodes (7): buildPoetNameToIdMap(), main(), migrateHistory(), migratePoems(), migratePoets(), readJSON(), verify()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (7): build_detail(), clean_text(), decode_b64(), fallback_detail(), main(), pick_body(), works_line()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (5): extractCommentary(), extractFixJipyeong(), extractJipyeongKo(), extractTranslation(), main()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (3): extractContent(), insertArticle(), main()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (2): addEraField(), calculateEraFromBirth()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (2): main(), stripNotes()

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (2): analyze_poem(), main()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **5 isolated node(s):** `Build the user prompt providing poem data for Qwen to translate.`, `Call Qwen API and return (markdown_content, usage_dict).`, `원문에서 주석번호 [숫자] 제거 → 순수 한자 텍스트`, `한 행의 한자를 병음으로 변환 (성조부호, 공백 구분)`, `한 행의 한자에 대해 평(平)/측(仄) 판별`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (2 nodes): `updateEraFromTaehun()`, `update_era_from_taehun.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `cleanTitle()`, `extract_youtube_links.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `cnToNum()`, `build_pingshui_db.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `seed_forum_posts.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sleep()` connect `Community 2` to `Community 0`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `run()` connect `Community 3` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `run_curl()` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **What connects `Build the user prompt providing poem data for Qwen to translate.`, `Call Qwen API and return (markdown_content, usage_dict).`, `원문에서 주석번호 [숫자] 제거 → 순수 한자 텍스트` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._