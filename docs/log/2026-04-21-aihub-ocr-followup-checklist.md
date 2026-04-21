---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: log
status: active
title: AI Hub OCR 후속 체크리스트
date: 2026-04-21
author: 태훈
---

# 왜 이 문서를 남기나

- 형이 AI Hub `603` 고서 한자 OCR 데이터 전체를 이미 내려받았기 때문이다.
- 다만 현재 한국 한시 파이프라인의 우선순위는 **OCR 자체가 아니라 텍스트 직접 수집**이다.
- 그래서 OCR은 지금 바로 돌리는 주 작업이 아니라, **텍스트 수집이 막히는 지점에서 꺼내는 보조 트랙**으로 관리해야 한다.
- 이 문서는 그 맥락을 잊지 않고, 나중에 바로 실행 가능한 점검 순서를 남기기 위한 로그다.

# 현재 맥락

- 실제 텍스트 수집 파일럿은 이미 돌았고, 직접 열리는 텍스트 기준으로 15건 레코드까지 생성했다.
- 하지만 보드 후보와 실제 접근 가능한 텍스트가 어긋나는 구간이 남아 있다.
- 특히 아래 후보들은 OCR 트랙 후보로 보는 것이 타당하다.
  - 최치원: `江南女`, `鄕樂雜詠`
  - 정지상: `新雪`, `鄕宴致語`, `栢律寺`, `西樓`
  - 허난설헌: `送荷谷謫甲山`, `寄夫讀書江舍`, `哭子`, `遣興`

# 운영 원칙

- OCR은 **직접 텍스트 수집 실패 후**에만 투입한다.
- OCR 결과는 바로 본 레코드에 넣지 않는다.
- 반드시 아래 순서를 지킨다.
  1. 이미지/PDF 출처 확인
  2. OCR 실행
  3. 원문 이미지 대조
  4. 권차/수록 위치 고정
  5. source policy 검토
  6. 그 다음에만 poem record 반영

# 후속 체크리스트

- [ ] AI Hub 603 다운로드 위치와 압축 해제 위치를 확정한다.
- [ ] 데이터셋을 `jinas`에 둘지 `jinserver`에 둘지 결정한다.
- [ ] OCR 실험용 런타임을 정한다.
- [ ] 이미지/PDF 입력 경로 규칙을 정한다.
- [ ] 첫 OCR 대상 2건을 고른다.
- [ ] OCR 결과와 원문 이미지를 대조하는 검수 규칙을 정한다.
- [ ] OCR 결과를 넣을 임시 산출물 경로를 정한다.
- [ ] 검수 통과본만 poem record로 승격하는 절차를 스크립트화할지 결정한다.

# 첫 실험 권장 순서

- [ ] 정지상 후보 1건 선택
- [ ] 최치원 후보 1건 선택
- [ ] 각 작품의 원문 이미지/PDF 확보
- [ ] AI Hub 603 기반 OCR 실험 1회
- [ ] 결과 정확도와 수정량 기록
- [ ] 성공 시 OCR queue 상위 항목으로 확대

# 나중에 반드시 확인할 것

- [ ] AI Hub 603은 학습/평가용 데이터로 쓰고 있는지 확인
- [ ] 실제 작품 텍스트 출처와 OCR bootstrap 데이터 출처를 혼동하지 않는지 확인
- [ ] OCR 결과가 기존 공개 번역/주석과 섞이지 않았는지 확인
- [ ] OCR 결과 반영 전 권리 상태가 다시 점검되었는지 확인

# 참고

- AI Hub 데이터셋: `https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=603`
- 관련 검토 문서: [2026-04-21-korean-hansi-ocr-integration-aihub.md](/Users/jinwoo/Documents/development/hanshinaru/docs/research/2026-04-21-korean-hansi-ocr-integration-aihub.md:1)
- OCR 큐: [korean-hansi-ocr-queue.v1.json](/Users/jinwoo/Documents/development/hanshinaru/docs/spec/korean-hansi-ocr-queue.v1.json:1)
