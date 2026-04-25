---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 김시습·서거정·정약용 worker wave direct-text 수집
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `db2b3120 [지훈][Feat] Split compound Korean poem series`와 최신 handoff `docs/handoff/2026-04-25-kim-jongjik-qiyeong-compound-split.md`를 확인했다.
- project wiki, `.rules/`, 최근 commit, 기존 worker 결과 구조를 확인했다.
- `docs/spec/korean-poet-worker-results/worker-5-kim-siseup-seo-geojeong-jeong-yagyong.v1.json`을 추가했다.
- 새 worker wave에서 공개 원문이 확인된 단편 15건을 direct-text로 수집했다.
  - 김시습 5건: `宿山村`, `早行`, `淸平山`, `昭陽江`, `感懷`
  - 서거정 5건: `松都懷古`, `田家書事`, `早朝`, `春日卽事`, `客從山中來`
  - 정약용 5건: `過野人村居`, `客中書懷`, `打麥行`, `快雨行`, `贈惠藏上人`
- `scripts/build_korean_poet_chronology_catalog.js`를 재실행해 기준 catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- direct-text 확보: 93건
- source-located: 8건
- blocked: 1건
- candidate-only: 148건
- totalWorks: 250건
- workerResultWorks: 57건

# 핵심 판단과 이유

- 이번 wave는 장편/연작보다 단편 direct-text를 우선했다.
- 이유는 `東明王篇`, `耽津村謠`, `長鬐農歌`, `山居雜興`처럼 길거나 여러 수가 묶인 항목은 별도 compound split 판단이 필요하기 때문이다.
- 이황 `退溪集`/`陶山雜詠`은 검색 결과가 주변 인물 문집으로 계속 새서 이번에는 수집하지 않았다. locator를 먼저 안정화해야 한다.
- `田家書事`는 2수이지만 제목 단위가 짧고 같은 entry 아래 붙어 있어 이번에는 한 카드에 보존했다. 다음 정규화 때 분할 여부를 다시 판단할 수 있다.

# 검증

- `node -e "JSON.parse(require('fs').readFileSync('docs/spec/korean-poet-worker-results/worker-5-kim-siseup-seo-geojeong-jeong-yagyong.v1.json','utf8')); console.log('worker5 json ok')"`
- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- `docs/spec/korean-poems-chronology.v1.json`과 `public/index/korean_poems_chronology.v1.json` 일치 확인
- `docs/spec/korean-poets-chronology.v1.json`과 `public/index/korean_poets_chronology.v1.json` 일치 확인

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류 `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.` 때문에 실패한다.
- 이 오류는 이번 worker wave와 무관한 기존 문제다.

# 다음 세션의 첫 행동

1. `田家書事` 2수 분할 여부를 compound split 기준으로 판단한다.
2. 정약용 `耽津村謠十五首`, `長鬐農歌十章`, `山居雜興二十首`는 연작 분할 대상으로 처리한다.
3. 이황 `退溪集`/`陶山雜詠` locator를 KORCIS/ITKC/위키문헌 제목 체계로 먼저 고정한다.
4. 이이·정철·권필·허균 중 Wikisource 공개 문집이 안정적인 작가를 다음 worker wave로 잡는다.

# 다음 세션이 피해야 할 함정

- 이황은 제목만 보고 바로 붙이지 말 것. 이번 검색에서는 주변 문집 hit가 많아 직접 원문 locator가 안정적이지 않았다.
- `與猶堂全書`의 `耽津村謠`와 `長鬐農歌`는 긴 묶음 그대로 direct-text 한 카드로 넣지 말고, 가능하면 하위 수 단위로 쪼갤 것.
- YGC 6건은 여전히 공개 본문 승격 금지다. 별도 권리 근거 또는 대체 공개 판본이 필요하다.
- 기존 dirty worktree의 unrelated 변경은 되돌리지 말 것.
