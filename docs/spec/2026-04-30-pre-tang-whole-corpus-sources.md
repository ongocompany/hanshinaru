---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: spec
status: active
title: 당 이전 중국 한시 전체 수집 소스 manifest
date: 2026-04-30
author: 지훈
---

# 목적

이 문서는 `先秦漢魏晉南北朝詩`를 한시나루의 당 이전 중국 한시 대량 수집 기준 색인으로 고정한다.

직전 handoff의 판단대로, 기존 `Category:宋詩`, `Category:元詩`, `Category:明詩` 중심 덤프 추출은 송/원/명 후보를 넓히는 데 좋지만 당 이전 전체 규모를 설명하기에는 작다. 당 이전 corpus는 먼저 권차 manifest를 세우고, 각 권차에서 공개 원문 witness를 찾는 순서로 진행한다.

# 기준 자료

| 자료 | 역할 | 이번 manifest 반영 |
|---|---|---|
| `先秦漢魏晉南北朝詩` | 先秦부터 隋까지의 기준 색인 | 135권 권차 manifest의 본체 |
| `詩經` | 별도 경전 family | 본체에서 제외하고 별도 collection으로 관리 |
| `楚辭` | 별도 초사 family | 본체에서 제외하고 별도 collection으로 관리 |
| `樂府詩集` | 漢樂府/민가 보조 witness | 원문 대조와 장르 분리에 사용 |
| `玉臺新詠` | 한~양 계열 보조 witness | 특정 계열 보강에 사용 |
| `昭明文選` | 대표작/출처 대조 | 시/賦/文 장르 경계 검토에 사용 |
| `古詩源` | 빠른 대표작 tranche | 先秦/漢 초기 proof에 사용 |

# 권차 구조

| 시대 | 권수 | 처리 방침 |
|---|---:|---|
| 先秦 | 7 | `詩經`, `楚辭`와 분리하고 가요/요언/逸詩 provenance를 보수적으로 검토 |
| 漢 | 12 | 漢樂府, 古詩十九首를 하위 family로 태깅 |
| 魏 | 12 | 曹氏/建安 core로 lookup 규칙 검증 |
| 晉 | 21 | 阮籍, 陶淵明을 anchor로 삼아 확장 |
| 南朝宋 | 12 | 후대 宋과 slug 충돌 방지 |
| 齊 | 7 | 永明體/謝朓 계열 태깅 |
| 梁 | 30 | 최대 덩어리라 parser 안정화 뒤 진입 |
| 北魏 | 4 | 북조 family로 별도 유지 |
| 北齊 | 4 | 저권수 처리 검증에 적합 |
| 北周 | 6 | 庾信 계열 남북조 경계 검토 |
| 陳 | 10 | 남조 말기 별도 유지 |
| 隋 | 10 | 당 인접 경계 검토 필수 |

# 산출물

- `scripts/data/cn_pre_tang_whole_corpus_manifest.mjs`: 사람이 검증한 권차 구조와 추출 정책.
- `scripts/build_cn_pre_tang_whole_corpus_manifest.mjs`: manifest/report 생성기.
- `scripts/extract_cn_wikisource_manifest_pages.py`: manifest의 first tranche lookup title을 위키문헌 XML 덤프에서 exact title로 추출하는 스크립트.
- `docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json`: 135권 volume manifest.
- `docs/spec/cn-pre-tang-whole-corpus-manifest.report.v1.json`: 권수 검증 report.

# 다음 추출 순서

1. `pre-qin`, `han` 19권만 먼저 dump/source lookup 대상으로 둔다.
2. 각 권차에 대해 `先秦漢魏晉南北朝詩/{권명}`과 `{권명}` title을 먼저 dump에서 찾는다.
3. 없는 경우 `古詩源`, `樂府詩集`, `昭明文選` 등 공개 witness로 회수한다.
4. 원문을 붙이는 순간에는 기존 규칙대로 raw source, normalized record, review queue, dry-run counts를 같이 남긴다.
5. `詩經`, `楚辭`는 별도 고전 family로 관리하고 이 manifest 본체에는 섞지 않는다.

# 덤프 추출 명령

`jinas` 원본 덤프 기준 실행 예시는 다음과 같다.

```bash
python3 scripts/extract_cn_wikisource_manifest_pages.py \
  --dump /volume1/homes/jinadmin/dumps/zhwikisource/latest/zhwikisource-latest-pages-articles.xml.bz2 \
  --manifest docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json \
  --out docs/spec/cn-pre-tang-whole-corpus-first-tranche.dump.raw.v1.json
```

현재 Codex SSH 즉석 명령에서는 한자 title이 `?`로 깨지는 현상이 있어, 원격에서 위 스크립트 파일을 직접 실행하는 방식이 안전하다.
