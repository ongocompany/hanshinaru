---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 한국 한시 동경잡기(東京雜記) 卷一 poem harvest
date: 2026-04-23
author: 태훈
---

# 목적

- `동경잡기(東京雜記) 卷一`을 `권차 단위 시문 수확` 대상으로 처리한다.
- `동경잡기(東京雜記)`가 전권 기준으로 `raw-first harvest`에 적합한지 판단하기 위한 첫 권차 검증이다.

# 표기 원칙

- 문헌명은 `동경잡기(東京雜記)`로 쓴다.
- 영문 로마자 표기는 `Donggyeong Japgi`다.
- `donggyeong-japgi`는 내부 파일명/스크립트용 canonical slug이며, 화면 표기와 문서 설명에서는 `Donggyeong Japgi`를 쓴다.
- 여기서 `東京`은 일본 東京/도쿄가 아니라 신라·고려 문맥의 경주를 가리키는 별칭이다.

# 기준 원문

- 공개 원문: `동경잡기(東京雜記) 卷一`
- source policy: `SRC-WIKISOURCE-TEXT`
- raw cache: [donggyeong-japgi-1.raw.txt](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-donggyeong-japgi-vol1-raw/donggyeong-japgi-1.raw.txt:1)
- harvest manifest: [korean-hansi-donggyeong-japgi-vol1-poem-harvest.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-donggyeong-japgi-vol1-poem-harvest.v1.json:1)

# 이번 harvest 결과

- 총 `28건`의 시문 블록을 구조화했다.
- attached context는 `5건`이다.
- 시문이 확인된 section:
  - `勝地`
  - `學校`
  - `宮室`
  - `山川`
  - `陵墓`
  - `風俗編髮蓋首君臣男女飮食居處之制自檀君爲始`
  - `驛院`

# 운영 판단

- 첫째 권은 둘째 권처럼 특정 항목 밑 시문이 붙는 구조와 셋째 권처럼 `題詠`이 몰린 구조의 중간 형태에 가깝다.
- 즉 `동경잡기(東京雜記)`는 권차마다 시문 분포 방식이 다르지만, 공개 raw만 확보되면 일괄 수확 자체는 충분히 가능하다.
- attached context가 `5건` 나온 것은 첫째 권에 시 앞 설명문이나 기문 성격 문장이 상대적으로 더 섞여 있다는 뜻으로 볼 수 있다.

# 바로 활용 가능한 의미

- 첫째 권 `28건`, 둘째 권 `21건`, 셋째 권 `45건`으로 이어지면서 `동경잡기(東京雜記)` 전권 수확이 실제로 작동한다는 근거가 생겼다.
- 따라서 이후에는 `작품 한 편 찾기`보다 `권차별 수확 -> 후보 창고 적재 -> 정식 작품 승격` 흐름을 기본값으로 삼는 편이 맞다.

# 다음 단계

1. 첫째 권 `28건`의 시인별/항목별 분포를 정리한다.
2. 첫째·둘째·셋째 권을 합쳐 `동경잡기(東京雜記)` 전권 후보 묶음을 만든다.
3. attached context 8건을 시와 분리된 설명문 자산으로 관리할지 정책을 정한다.
4. 그 뒤 `東文選` 다른 권차에도 같은 수확 방식을 확장한다.
