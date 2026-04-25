---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 한시 동경잡기(東京雜記) 卷二 poem harvest
date: 2026-04-23
author: 태훈
---

# 목적

- `동경잡기(東京雜記) 卷二`를 `exact-title 1건 추적`이 아니라 `collection slice poem harvest` 대상으로 전환한다.
- 공개 raw 원문에서 시문 수록 블록을 먼저 최대한 많이 구조화해 다음 단계의 canonical record/번역 큐 입력으로 쓴다.

# 표기 원칙

- 문헌명은 `동경잡기(東京雜記)`로 쓴다.
- 영문 로마자 표기는 `Donggyeong Japgi`다.
- `donggyeong-japgi`는 내부 파일명/스크립트용 canonical slug이며, 화면 표기와 문서 설명에서는 `Donggyeong Japgi`를 쓴다.
- 여기서 `東京`은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.

# 기준 원문

- 공개 원문: `동경잡기(東京雜記) 卷二`
- source policy: `SRC-WIKISOURCE-TEXT`
- raw cache: [donggyeong-japgi-2.raw.txt](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-donggyeong-japgi-vol2-raw/donggyeong-japgi-2.raw.txt:1)
- harvest manifest: [korean-hansi-donggyeong-japgi-vol2-poem-harvest.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-donggyeong-japgi-vol2-poem-harvest.v1.json:1)

# 이번 harvest 결과

- 총 `21건`의 시문 블록을 구조화했다.
- 신뢰도 분포:
  - `high`: 21건
  - `medium`: 0건
- 시문이 확인된 section:
  - `佛宇`: 6건
  - `古蹟`: 15건
- 별도 attached context:
  - `全思敬西樓記` 1건

# 바로 활용 가능한 고신뢰 블록

- `芬皇寺` - `金克己詩`
- `佛國寺` - `佔畢齋金宗直詩`, `金時習詩`
- `祗林寺` - `李達哀詩`
- `栢栗寺` - `鄭知常詩`, `朴孝修詩`
- `鮑石亭` - `李仁老詩`, `梅溪曹偉詩`
- `瞻星臺` - `安軸詩`, `圃隱鄭先生詩`, `梅溪曹偉詩`
- `月明巷` - `李益齋詩`, `李詹詩`
- `月精橋` - `金克己詩`
- `天官寺` - `高麗李公升詩`
- `皇龍寺` - `金克己詩`
- `王家藪` - `金時習詩`
- `悅朴嶺` - `金克己詩`, `朴元亨詩`, `李石亨詩`

# 후속 보정

- `悅朴嶺`의 `金克己詩`, `李石亨詩`는 `新增東國輿地勝覽 卷021` 대조로 행 분할을 확정했다.
- `金克己詩`는 8구 육언율시, `李石亨詩`는 18구 잡언고시로 정리했다.
- 본문 글자는 `동경잡기(東京雜記)` 원문 계열을 유지하고, 구두점과 행 분할 판단만 대조 문헌을 참고했다.

# 운영 판단

- `동경잡기(東京雜記) 卷二`는 PDF 이미지를 전면 OCR로 다시 뜯기 전에, 공개 raw에서 이미 상당수 시문을 안정적으로 harvest 할 수 있다.
- 따라서 이 권차는 `image-first OCR lane`보다 `raw-first harvest lane`이 우선이다.
- PDF/이미지 판독은 raw에 없는 권차, 누락 구간, 손상 블록 보정에만 제한적으로 붙이는 편이 효율적이다.

# 다음 단계

1. harvest manifest의 고신뢰 21건부터 canonical record 승격 후보를 만든다.
2. `栢栗寺` 묶음은 `西樓` 연구 메모와 연결해 alias/entry context를 함께 보존한다.
3. `悅朴嶺` 보정 결과를 전권 검수 대기열과 canonical record 승격 후보에 반영한다.
4. 같은 방식으로 `동경잡기(東京雜記)` 다른 권차도 `raw-first harvest`로 확장한다.
