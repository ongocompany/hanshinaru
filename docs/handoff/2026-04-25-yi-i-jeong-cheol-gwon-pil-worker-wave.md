---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 이이·정철·권필 worker wave direct-text 수집
date: 2026-04-25
author: 지훈
---

# 이번 세션에서 완료한 작업

- 최신 커밋 `6980ba33 [지훈][Feat] Add Korean poet worker wave`와 최신 handoff `docs/handoff/2026-04-25-kim-siseup-seo-geojeong-jeong-yagyong-wave.md`를 확인했다.
- `田家書事`를 2수로 분할했다.
  - `田家書事 其一`
  - `田家書事 其二`
- `docs/spec/korean-poet-worker-results/worker-6-yi-i-jeong-cheol.v1.json`을 추가했다.
  - 이이 5건: `花石亭`, `偶興 其一`, `偶興 其二`, `望寶蓋山`, `山中`
  - 정철 5건: `秋日作`, `平湖堂 其一`, `平湖堂 其二`, `別退陶先生`, `祝堯樓`
- `docs/spec/korean-poet-worker-results/worker-7-gwon-pil.v1.json`을 추가했다.
  - 권필 6건: `感懷 其一`, `感懷 其二`, `感懷 其三`, `述懷`, `切切何切切`, `貧`
- `scripts/build_korean_poet_chronology_catalog.js`를 재실행해 기준 catalog와 public mirror를 재생성했다.

# 현재 catalog 상태

- direct-text 확보: 110건
- source-located: 8건
- blocked: 1건
- candidate-only: 145건
- totalWorks: 264건
- workerResultWorks: 74건

# 핵심 판단과 이유

- `田家書事`는 같은 제목 아래 붙어 있지만 각 수가 벼 베기와 누에/비단 조세를 따로 다루므로 서비스 카드에서는 2수 분할이 더 안전하다고 판단했다.
- 이이·정철은 seed 후보를 완전히 대체했다고 보기 어려워 일부 broad candidate를 남겼다.
  - 이이: `금강산시`, `학문·수양시` candidate가 아직 남아 있다.
  - 정철: `관동 관련 한시` candidate가 아직 남아 있다.
- 권필은 이번 wave로 `풍자시`, `사회시` 성격 direct-text를 확보했지만, `애도시` candidate는 아직 남겨 두었다.
- 이번 wave는 모두 Wikisource 공개 권차본 raw view를 기준으로 했고 `SRC-WIKISOURCE-TEXT` 정책을 적용했다.

# 검증

- `node scripts/validate_korean_poet_worker_results.js`
- `node scripts/build_korean_poet_chronology_catalog.js`
- `cmp -s docs/spec/korean-poems-chronology.v1.json public/index/korean_poems_chronology.v1.json`
- `cmp -s docs/spec/korean-poets-chronology.v1.json public/index/korean_poets_chronology.v1.json`
- `node --check scripts/build_korean_poet_chronology_catalog.js`
- `node --check scripts/validate_korean_poet_worker_results.js`
- `git diff --check -- <touched paths>`

# 남은 검증 이슈

- `npx tsc --noEmit`은 기존 오류 `scripts/build_general_page.js(469,1): error TS1160: Unterminated template literal.` 때문에 실패한다.
- 이 오류는 이번 수집 JSON 변경과 무관한 기존 문제다.

# 다음 세션의 첫 행동

1. 이이 `栗谷先生全書/卷一`에서 실제 금강산 관련 시와 학문·수양 성격 시를 더 정확히 골라 남은 seed candidate를 해소한다.
2. 정철 `松江集`에서 관동 관련 한시 또는 국문 가사 맥락 자료의 처리 방식을 정한다.
3. 권필 `石洲集`에서 애도시 계열 direct-text를 찾아 `애도시` candidate를 해소한다.
4. 허균 `惺所覆瓿藁`은 Wikisource 검색이 아직 안정적이지 않으므로 KORCIS/ITKC locator를 먼저 고정한다.

# 다음 세션이 피해야 할 함정

- seed candidate를 줄이려고 작품 성격과 맞지 않는 broad candidateTitle을 억지로 붙이지 말 것.
- `關東別曲`, `思美人曲` 같은 국문 가사는 한시 direct-text와 같은 카드에 섞지 말고 별도 genre 처리 기준을 먼저 세울 것.
- `石洲集`은 권차가 잘 열리지만 장편 고시가 많으므로, 무조건 긴 본문을 한 카드로 넣지 말고 제목 아래 하위 수가 있는지 확인할 것.
- 기존 dirty worktree의 unrelated 변경은 되돌리지 말 것.
