---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 당 이전 중국 한시 first tranche 실제 추출 시작
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

`4327dd25 [지훈][Data] 당 이전 중국 한시 manifest 추가` 커밋 후, 실제 위키문헌 덤프 추출을 시작했다.

처음에는 `jinas` NAS에서 직접 XML dump scan을 돌렸지만 CPU 99%로 오래 걸렸다. 형님 판단대로 macmini가 디스크 여유와 작업 안정성 면에서 더 적합하다고 보고, 작업 장소를 macmini로 바꿨다.

macmini 상태:

- 여유 디스크: 약 651GiB
- `jinas` 접근: 가능
- 덤프 복사 위치: `/tmp/hanshinaru-zhwikisource/zhwikisource-latest-pages-articles.xml.bz2`
- 작업 디렉터리: `/tmp/hanshinaru-cn-pre-tang/`

# dump exact title 추출 결과

macmini에서 `scripts/extract_cn_wikisource_manifest_pages.py`를 실행했다.

결과 파일:

- `docs/spec/cn-pre-tang-whole-corpus-first-tranche.dump.raw.v1.json`

요약:

- selectedVolumes: 19
- lookupTitles: 38
- fetchedOk: 0
- missing: 38
- byEra: `pre-qin 14`, `han 24`

즉 `先秦漢魏晉南北朝詩/先秦詩卷一`, `漢詩卷一` 같은 exact title은 현재 zhwikisource dump에 없다. 총집 권차명 자체로는 회수할 수 없고, companion source에서 작품 단위로 회수해야 한다.

# companion source 실제 추출 결과

기존 `docs/spec/cn-non-tang-tranche1.sources.raw.json` 안에 이미 있는 `古詩源`, `上邪`, `行行重行行`, `迢迢牽牛星` raw를 재사용해 first tranche companion-source 추출기를 추가했다.

추가 파일:

- `scripts/build_cn_pre_tang_first_tranche_from_cached_sources.mjs`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.v1.json`
- `docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json`

요약:

- sourcePages: 10
- extractedRecords: 29
- byEra: `pre-qin 26`, `han 3`
- bySourcePage: `古詩源 26`, `上邪 1`, `行行重行行 1`, `迢迢牽牛星 1`

샘플:

- `擊壤歌`
- `康衢謠`
- `伊耆氏蠟辭`
- `堯戒`
- `卿雲歌`
- `八伯歌`
- `帝載歌`
- `南風歌`
- `上邪`
- `行行重行行`
- `迢迢牽牛星`

# 핵심 판단

`先秦漢魏晉南北朝詩`는 여전히 기준 색인으로 유지한다. 다만 위키문헌 dump에서는 그 권차명이 직접 페이지로 존재하지 않으므로, 원문 회수는 다음 순서가 맞다.

1. 기준 색인: `先秦漢魏晉南北朝詩`
2. 실제 원문 witness: `古詩源`, `樂府詩集`, `昭明文選`, 개별 작품 페이지
3. record화 전 단계: source witness record
4. 이후 normalized record/review queue/dry-run으로 승격

# 검증

- `npm run cn:pre-tang-cached-first-tranche`: 통과
- `node --check scripts/build_cn_pre_tang_first_tranche_from_cached_sources.mjs`: 통과

# 다음 세션 첫 행동

1. `docs/spec/cn-pre-tang-first-tranche.cached-source-records.report.v1.json`을 읽어 현재 29건을 확인한다.
2. `古詩源`의 `卷二/卷三 漢詩`에서 왜 단일 제목 문단으로 잡히지 않는 작품들이 많은지 HTML 구조를 별도 분석한다.
3. `樂府詩集`, `昭明文選`, `玉臺新詠` 쪽 cached/source lookup을 추가해 漢 12권의 빈 부분을 채운다.
4. 29건은 아직 DB upsert 대상이 아니라 source witness record다. review queue로 한 단계 더 정규화한 뒤 DB dry-run으로 간다.

# 피해야 할 함정

- exact title miss를 "당 이전 corpus 없음"으로 해석하지 않는다. 권차 페이지가 없을 뿐, 원문 witness는 `古詩源`과 개별 작품 페이지에 있다.
- `古詩源` 파싱에서 링크 목록 문단이 뒤쪽 poem div까지 먹히는 문제가 한 번 있었다. 현재 추출기는 "단일 작품 제목 문단 바로 뒤 poem div"만 잡도록 좁혔다.
- `詩經`, `楚辭`는 계속 별도 family로 둔다.
- 기존 HTML/PSD 변경분은 이번 데이터 작업과 섞지 않는다.
