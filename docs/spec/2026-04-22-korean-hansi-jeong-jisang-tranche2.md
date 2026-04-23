---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 한시 정지상 tranche 2
date: 2026-04-22
author: 태훈
---

# 목적

- 정지상 wave-1 seed 5건 중 tranche 1에서 남았던 `鄕宴致語`, `栢律寺` direct-text locator를 공개 원문으로 보강한다.
- `西樓`는 오인 후보를 재확인하고 계속 미해결로 남긴다.

# 기준 원문

- `東文選 卷一百四`
  - `冊王太子御宴致語` → board seed `鄕宴致語`
- `新增東國輿地勝覽 卷021`
  - `柏栗寺` → board seed `栢律寺`

# 이번 tranche 운영 판단

- `鄕宴致語`는 `東文選` 공개 권차본에서 직접 열린다.
- `栢律寺`는 현재 공개 direct-text 기준으로 `新增東國輿地勝覽 卷021`의 `柏栗寺`를 채택한다.
- `栢律寺`/`柏栗寺`는 이체자 표기로 보고 동일 seed로 취급한다.
- `西樓`는 `東文選 卷十九`의 `西樓觀雪`, `西樓晚望`가 `金克己` 블록이라 채택하지 않는다.

# 산출물

- [korean-hansi-jeong-jisang-tranche2.input.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-jeong-jisang-tranche2.input.v1.json:1)
- [korean-hansi-jeong-jisang-tranche2.records.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-jeong-jisang-tranche2.records.v1.json:1)
- [korean-hansi-jeong-jisang-tranche2.report.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-jeong-jisang-tranche2.report.v1.json:1)
- [korean-hansi-jeong-jisang-tranche2.source-urls.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-jeong-jisang-tranche2.source-urls.tsv:1)
- [korean-hansi-jeong-jisang-tranche2.rights-sheet.tsv](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-jeong-jisang-tranche2.rights-sheet.tsv:1)

# 다음 단계

1. `西樓`의 exact-title direct-text locator를 계속 찾는다.
2. 정지상 4건 direct-text seed에 대해 rights review를 batch 단위로 마무리한다.
3. `정사간집` direct bib는 별도 메타데이터 탐색 lane으로 남긴다.
