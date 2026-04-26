---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: Kim Byeong-yeon and royal author seed gap patch
date: 2026-04-26
author: 지훈
---

# 이번 세션에서 완료한 작업

- 진우 형이 지적한 김병연 누락과 왕실 작가군 누락을 확인했다.
- `public/index/korean_timeline.json`에는 `김병연(金炳淵)`, `유리왕(琉璃王)`, `서동`, `세종` 등이 있었지만, 시 수집용 chronology seed에는 김병연과 대부분의 왕실 후보가 빠져 있었다.
- `docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md`에 다음 6명을 추가했다.
  - `유리왕(琉璃王)`
  - `서동(薯童)`
  - `세종(世宗)`
  - `김병연(金炳淵)`
  - `정조(正祖)`
  - `효명세자(孝明世子)`
- `scripts/build_korean_poet_chronology_catalog.js`에 새 인물 slug와 `黃鳥歌`, `薯童謠`, `月印千江之曲`, `龍飛御天歌`의 고대/왕실 시가 장르 힌트를 추가했다.
- catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- authors: 138명
- direct-text 확보: 702건
- source-located: 0건
- blocked: 0건
- candidate-only: 149건
- totalWorks: 851건
- workerResultWorks: 594건

# 새 후보 반영 내역

- 유리왕: `黃鳥歌`
- 서동: `薯童謠`
- 세종: `月印千江之曲`, `龍飛御天歌`
- 김병연: 김삿갓 한시, 방랑시, 풍자시, 파격시
- 정조: `弘齋全書` 수록 한시, 어제시
- 효명세자: 왕실 악장, 궁중 정재 관련 시문, 개인 한시 후보

# 핵심 판단과 이유

- 김병연은 조선 후기 방랑·풍자 한시 축에서 빠지면 안 되는 인물이므로 A급 후보로 넣었다.
- 왕실 후보는 바로 direct-text로 승격하지 않았다. 왕의 직접 창작, 왕명 편찬, 궁중 악장·정재 텍스트가 섞일 수 있어 후보 상태에서 출처와 귀속을 먼저 확인해야 한다.
- 왕비·왕실 여성 쪽은 이번 patch에서 무리하게 넣지 않았다. `한중록`, `내훈`, 왕실 편지처럼 문학사적으로 중요하지만 시 본편인지 산문/교훈서/서간인지 갈라야 하는 항목이 많아서 별도 검토가 낫다.

# 검증

- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `node scripts/validate_korean_poet_worker_results.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `git diff --check -- scripts/build_korean_poet_chronology_catalog.js docs/research/2026-04-25-korean-poet-chronology-seed-catalog.md docs/spec/korean-poets-chronology.v1.json docs/spec/korean-poems-chronology.v1.json public/index/korean_poets_chronology.v1.json public/index/korean_poems_chronology.v1.json`

# 다음 세션의 첫 행동

1. 김병연은 `蘭皐集`, `金笠詩集` 계열 또는 공개 선집에서 실제 원문 후보를 찾는다.
2. 왕실 작가군은 `유리왕/서동` 같은 고대 전승 시가와 `세종/정조/효명세자` 같은 조선 왕실 시문을 서로 다른 수집 lane으로 나눈다.
3. 왕비·왕실 여성 인물은 시 본편 후보와 산문·서간·교훈서 후보를 분리한 뒤 추가한다.

# 다음 세션이 피해야 할 함정

- `龍飛御天歌`를 세종 개인 창작시처럼 단순 처리하지 말 것. 왕실 악장·왕명 편찬 맥락으로 다뤄야 한다.
- 김병연 작품은 후대 선집 전승이 많으므로 제목·작자 귀속·원문 출처를 함께 확인할 것.
- 왕비·왕실 여성 문헌은 중요도만 보고 시 catalog에 바로 넣지 말고, 갈래를 먼저 확인할 것.
