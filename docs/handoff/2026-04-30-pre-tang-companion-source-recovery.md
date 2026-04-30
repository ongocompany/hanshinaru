---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 先秦漢 first tranche companion source recovery
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

`古詩源` second-pass 뒤에 남은 unresolved 16건을 대상으로 `樂府詩集`, `玉臺新詠`, `昭明文選` 권차 페이지를 zhwikisource dump에서 추가 확인했다.

생성/수정 파일:

- `scripts/build_cn_pre_tang_companion_source_targets.mjs`
- `scripts/build_cn_pre_tang_first_tranche_from_cached_sources.mjs`
- `docs/spec/cn-pre-tang-companion-source-targets.v1.json`
- `docs/spec/cn-pre-tang-companion-source-pages.dump.raw.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.db-dry-run.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.jds-upsert.sql`
- `docs/spec/cn-pre-tang-first-tranche-volume-count-audit.v1.md`

# 현재 결과

- companion volume probe: 179
- dump fetched: 170
- 추가 추출: 8편
- 최종 source witness records: 95편
- DB dry-run: 18 poets / 95 poems
- SQL dry-run: 18 poets / 95 poems, 마지막은 `ROLLBACK`

시대별:

| 시대 | 추출 편수 |
|---|---:|
| 先秦 | 26 |
| 漢 | 69 |
| 합계 | 95 |

이번에 추가된 8편:

| 작품 | witness |
|---|---|
| 有所思 | 樂府詩集/016卷 |
| 東門行 | 樂府詩集/037卷 |
| 西門行 | 樂府詩集/037卷 |
| 陌上桑 | 樂府詩集/028卷 |
| 相逢行 | 樂府詩集/034卷 |
| 隴西行 | 樂府詩集/037卷 |
| 梁甫吟 | 樂府詩集/041卷 |
| 悲歌 | 樂府詩集/062卷, heading은 `悲歌行（古辭）` |

# 어디서 멈췄는지

아직 멈춘 것이 아니라, 안전 추출 가능한 항목 8개를 먼저 반영한 상태다. 남은 8건은 제목/저자 대응이 불안해서 자동 DB record로 넣지 않았다.

남은 8건:

| 작품 | 힌트 저자 | 보류 이유 |
|---|---|---|
| 雜詩 | 孔融 | companion source에서 같은 제목 다수, 孔融 시 본문 확정 실패 |
| 怨詩 | 王昭君 | `怨詩`는 班婕妤 등 동명이의어가 강함 |
| 樂府 | 樂府歌辭 | 작품명이라기보다 범주/heading 가능성 |
| 琴歌 | 蔡邕 | `樂府詩集`의 안전 heading은 百里奚妻/霍去病 등으로 갈림 |
| 猛虎行 | 樂府歌辭 | 잡힌 안전 heading은 `魏·文帝`, 힌트와 불일치 |
| 古歌 | 樂府歌辭 | 안전 heading 미확정 |
| 古歌 | 佚名 | 안전 heading 미확정 |
| 落葉哀蟬曲 | 武帝 | companion volume probe에서 exact hit 없음 |

# 핵심 판단과 이유

- `樂府詩集`은 당/오대까지 섞여 있으므로 제목만 보고 전량 회수하지 않았다.
- `昭明文選`은 시 외 장르와 주석이 많아 안전 heading 없이는 DB record로 승격하지 않았다.
- `玉臺新詠`은 transclusion index가 많아 본문 페이지가 따로 잡힐 때만 다음 단계에서 쓰는 편이 안전하다.
- `悲歌`는 source heading이 `悲歌行（古辭）`라 title variant가 있지만, 漢樂府 고사 본문으로 판단해 witness로 반영했다.

# 다음 세션의 첫 행동

1. 남은 8건만 대상으로 title/author-safe lookup을 별도 진행한다.
2. 특히 `落葉哀蟬曲`은 `武帝`가 梁武帝인지 漢武帝인지 먼저 판정한다.
3. `雜詩/孔融`, `怨詩/王昭君`, `琴歌/蔡邕`은 작품명 단독 검색이 아니라 author block 기준으로 확인한다.
4. 권별 총 시편수는 여전히 미확정이므로, `先秦漢魏晉南北朝詩` 원 source의 목차/OCR 확보를 별도 작업으로 둔다.

# 다음 세션이 피해야 할 함정

- `樂府`, `古歌` 같은 범용 제목을 작품으로 바로 넣지 않는다.
- `猛虎行`은 `魏·文帝` witness를 `樂府歌辭`로 둔갑시키지 않는다.
- `怨詩`는 班婕妤 witness가 이미 안전하더라도 王昭君 unresolved와 섞지 않는다.
- exact source volume 19권은 여전히 실제 권수 범위일 뿐, 권별 총 시편수 확인 완료가 아니다.
