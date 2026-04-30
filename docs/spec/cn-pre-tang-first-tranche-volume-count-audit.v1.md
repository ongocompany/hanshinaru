---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: audit
status: active
title: 先秦漢 first tranche 권별 시편수 확인 감사
date: 2026-04-30
author: 지훈
---

# 목적

`先秦漢魏晉南北朝詩`의 첫 DB화 범위인 `先秦詩` 7권과 `漢詩` 12권을 권별로 점검한다.

이 문서는 “권수 범위에 착수했다”와 “권별 총 시편수를 확인했다”를 분리하기 위한 중간 감사표다.

# 결론

- 전체 source work 권수: 135권
- first tranche 권수: 19권 = `先秦詩` 7권 + `漢詩` 12권
- first tranche exact dump lookup: 38개 title 모두 missing
  - `先秦漢魏晉南北朝詩/{권명}`
  - `{권명}`
- 따라서 현재 repo 안에는 `先秦漢魏晉南北朝詩` first tranche의 권별 총 시편수가 아직 없다.
- 현재 DB dry-run 57편은 exact source volume이 아니라 companion source witness에서 회수한 부분 추출이다.

# 권별 총 시편수 확인표

| source volume id | 권명 | 시대 | 권별 총 시편수 | exact source lookup | 현재 DB화 claim |
|---|---|---|---:|---|---:|
| CN-PRETANG-PRE-QIN-01 | 先秦詩卷一 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-02 | 先秦詩卷二 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-03 | 先秦詩卷三 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-04 | 先秦詩卷四 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-05 | 先秦詩卷五 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-06 | 先秦詩卷六 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-PRE-QIN-07 | 先秦詩卷七 | 先秦 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-01 | 漢詩卷一 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-02 | 漢詩卷二 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-03 | 漢詩卷三 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-04 | 漢詩卷四 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-05 | 漢詩卷五 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-06 | 漢詩卷六 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-07 | 漢詩卷七 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-08 | 漢詩卷八 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-09 | 漢詩卷九 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-10 | 漢詩卷十 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-11 | 漢詩卷十一 | 漢 | 미확인 | missing | 0 |
| CN-PRETANG-HAN-12 | 漢詩卷十二 | 漢 | 미확인 | missing | 0 |

# 현재 확보한 companion source witness

현재 57편은 원 source volume별 완전 추출이 아니라, 공개 witness로 확인 가능한 작품을 먼저 회수한 것이다.

| companion source | 구간 | 후보/추출 상태 | 현재 DB dry-run 반영 |
|---|---|---|---:|
| 古詩源 | 卷一古逸 | anthology-section 직접 추출 | 26 |
| zh Wikisource standalone | 上邪, 行行重行行, 迢迢牽牛星 | 개별 페이지 직접 추출 | 3 |
| 古詩源 link candidates | 卷二漢詩 | 후보 15개 중 본문 추출 10개 | 10 |
| 古詩源 link candidates | 卷三漢詩 | 후보 39개 중 본문 추출 16개 | 16 |
| 古詩源 link candidates | 卷四漢詩 | 후보 4개 중 본문 추출 2개 | 2 |

# 다음 작업 순서

1. `先秦漢魏晉南北朝詩` 자체의 first tranche 권별 목차 또는 OCR source를 확보한다.
2. 각 권마다 총 시편수를 먼저 확정한다.
3. `volumeCountStatus=confirmed`가 된 권부터 source witness lookup을 실행한다.
4. DB dry-run은 “권별 총수 대비 추출수”를 같이 출력하도록 바꾼다.
5. companion source만으로 회수한 57편은 `volumeId`를 임시 배정하지 않고, source volume 매핑이 확인될 때까지 `sourceVolumeStatus=unmapped-companion-witness`로 둔다.

# 파이프라인 중단 원인 메모

이전 진행이 중간에 자주 멈춘 이유는 파이프라인 완료 조건을 잘못 잡았기 때문이다.

- 잘못된 완료 조건: source witness 57편과 DB dry-run 생성
- 실제 완료 조건: 권별 총 시편수 확인, 권별 추출수 확인, 누락수 산정, review queue 생성, dry-run/SQL 생성

앞으로 이 tranche는 권별 총수 표를 먼저 채우고, 그다음 권 단위로 추출률을 계산한다.
