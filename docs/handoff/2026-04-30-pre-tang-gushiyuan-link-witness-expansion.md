---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 당 이전 중국 한시 古詩源 漢 링크 witness 확장
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

지난 커밋 `c45d3f21 [지훈][Data] 당 이전 first tranche 추출 시작`과 최신 handoff `docs/handoff/2026-04-30-pre-tang-first-extraction-macmini.md`를 읽고 이어서 작업했다.

핵심 문제는 `古詩源`의 `卷二/卷三/卷四 漢詩`가 `<div class="poem">` 본문이 아니라 개별 작품 링크 목록이라는 점이었다. 그래서 기존 추출기는 `卷一古逸` 26건만 안정적으로 잡고, 漢은 이미 캐시된 standalone 3건만 가져오고 있었다.

이번에는 `古詩源` 漢 권의 파란 위키문헌 링크만 후보화하고, macmini의 zhwikisource dump에서 exact title로 개별 작품 페이지를 회수했다.

# 생성/수정한 파일

- `scripts/build_cn_pre_tang_gushiyuan_link_candidates.mjs`
- `scripts/extract_cn_wikisource_dump_pages.py`
- `scripts/build_cn_pre_tang_first_tranche_from_cached_sources.mjs`
- `package.json`
- `docs/spec/cn-pre-tang-gushiyuan-link-candidates.v1.json`
- `docs/spec/cn-pre-tang-gushiyuan-link-pages.dump.raw.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json`

# 결과

`npm run cn:pre-tang-gushiyuan-links`:

- selected: 58
- bySection: `卷二漢詩 15`, `卷三漢詩 39`, `卷四漢詩 4`
- byEra: `han 58`

macmini dump extraction:

- selected: 58
- fetchedOk: 58
- missing: 0

`npm run cn:pre-tang-cached-first-tranche`:

- extractedRecords: 57
- byEra: `pre-qin 26`, `han 31`
- bySourceKind: `anthology-section 26`, `standalone-page 3`, `gushiyuan-linked-dump-page 28`
- gushiYuanLinkedDumpPages: `inputPages 58`, `fetchedOk 58`, `extractedRecords 29`, `skippedWithoutBody 29`

기존 29건에서 57건으로 늘었다. 漢 쪽은 3건에서 31건으로 늘었다.

# 핵심 판단과 이유

- `古詩源` 漢 권은 본문 추출 대상이 아니라 링크 색인으로 취급해야 한다.
- 덤프에는 링크된 58개 제목이 모두 있지만, 절반가량은 동음이의/목록/본문 없는 페이지다. 이 페이지들은 자동 승격하지 않았다.
- `<poem>`이 없는 경우도 전부 열지 않고 `柏梁詩`, `盤中詩`, `古絕句`처럼 구조가 단순하고 본문성이 뚜렷한 일부만 보수적으로 fallback 추출했다.
- `高帝`, `武帝`, `烏孫公主`, `樂府歌辭` 같은 `古詩源` 소제목은 record author로 부정확할 수 있어 `劉邦`, `劉徹`, `劉細君`, `無名氏/漢樂府`로 안전한 범위만 정규화했다.

# 검증

- `npm run cn:pre-tang-gushiyuan-links`: 통과
- `npm run cn:pre-tang-cached-first-tranche`: 통과
- `node --check scripts/build_cn_pre_tang_gushiyuan_link_candidates.mjs`: 통과
- `node --check scripts/build_cn_pre_tang_first_tranche_from_cached_sources.mjs`: 통과
- `PYTHONPYCACHEPREFIX=/tmp/hanshinaru-pycache python3 -m py_compile scripts/extract_cn_wikisource_dump_pages.py`: 통과
- `git diff --check`: 통과
- `npx tsc --noEmit`: 실패. 기존 archive React/JSX 타입 문제와 `poets/poets.tsx` JSX 타입 문제로 대량 실패한다. 이번 데이터 파이프라인 변경의 신규 오류로 보지는 않는다.

# 어디서 멈췄는지

57건은 아직 DB upsert 대상이 아니라 source witness record다. 다음 단계는 이 57건을 review queue 또는 normalized record로 한 단계 더 승격하는 것이다.

특히 `skippedWithoutBody 29` 안에는 동음이의 페이지가 많지만, `四愁詩`처럼 서문과 본문이 섞여 자동 추출을 일부러 보류한 항목도 있다. 이쪽은 개별 parser를 추가할지, review queue에서 수동 승격할지 정해야 한다.

# 다음 세션 첫 행동

1. `docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json`의 57건 요약을 확인한다.
2. `docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json`에서 `review.reasons`와 `lineCount`가 극단적인 항목을 먼저 본다. 특히 `古詩為焦仲卿妻作`은 184행 장편이라 별도 처리 후보다.
3. source witness 57건을 normalized review queue로 변환하는 작은 script를 추가한다.
4. `四愁詩`와 동음이의 페이지들은 자동 추출보다 개별 title 후보 재매핑으로 푼다.

# 다음 세션이 피해야 할 함정

- `fetchedOk 58`을 곧바로 `extractedRecords 58`로 해석하지 않는다. 실제 본문 추출은 29건이고, dedupe 후 first tranche 반영은 28건이다.
- 동음이의 페이지(`白頭吟`, `怨詩`, `長歌行`, `陌上桑` 등)를 원문으로 착각하지 않는다.
- 기존 HTML/PSD 변경분은 이번 데이터 작업과 무관하므로 stage/commit에 섞지 않는다.
- 커밋은 `.rules/commit-rules.md` 기준으로 요청 시에만 한다.
