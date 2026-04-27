---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 라운드 2 데이터 풍부화 — tang300 시인 백필 + CN era 정밀 + 한국 향찰·카테고리
date: 2026-04-27
author: 민철
---

# 이번 세션에서 완료한 작업

라운드 1 (SSR + 데이터 통합)에 이은 라운드 2 데이터 풍부화. 시인 메타 정밀화·CN era 세분·한국 한시 카테고리 정합·향찰 27수 학계 표준 번역 적용.

## B1+B2: 당시삼백수 시인 76명 정밀 백필 (jds 커밋 875e258)

소스: `hanshinaru/public/index/db_author.with_ko.json` (사이버서당 기반 76명)
대상: jds.poets country='CN'

| 매칭 | 건수 |
|---|---|
| 정확 일치 | 71명 UPDATE |
| 정규화 일치 (陳子昻→陳子昂 등 異体字) | 1명 UPDATE |
| jds 미존재 INSERT | 4명 (邱爲, 金昌緖, 唐玄宗, 杜秋娘) |

채운 컬럼: `name_ko, life_birth/death/raw, birth_approx, death_approx, bio_ko, era_period(early/mid/high/late→초당/중당/성당/만당), birthplace, relations`. CN 시인 풍부 메타 보유 0 → 76명.

## B3: CN era_period 정밀 분류 (jds 커밋 6bada98)

대상: jds.poets country='CN' AND era_period='당' (2,659명 일괄 백필 잔재)
방법:
- 황실 시호 룰 (太宗/中宗/玄宗 등) — 1명 (武則天) 변경
- 대시인 50명 수기 매핑 (poem_count 101+ TOP) — 35명 변경

총 36명 정밀 분류. 분류 모호 시인(未詳/無名氏/寒山/呂巖)은 '당' 유지.

CN era 최종 분포: 당 2,627 / 만당 35 / 중당 33 / 성당 29 / 초당 11

## B4 샘플: qwen3.6:27b 한국 한시 5수 시범 (jds 커밋 5495253)

jinserver SSH tunnel + qwen3.6:27b로 5수 번역 테스트. **핵심 발견**:
- 정통 한문 한시(을지문덕 등): 우수
- 향찰 시(서동요/도솔가/안민가): LLM 직역 부적절 → 별도 처리 필요
- 한국사 사실 정확도: 시인 era 메타 부족 시 commentary 오류 발생 (예: 유리왕을 "신라 14대"로 잘못 — 실제 고구려)

추가물: `pipeline/translate/prompts/v4_batch_korean.txt` (한국 한시용 프롬프트), `scripts/sample_translate_korean.py` (샘플 번역 도구).

## B4-1: 향찰 27수 학계 표준 해독 적용 (jds 커밋 1666658)

Claude Sonnet 4 subagent 4개 병렬:
- 신라 향가 8수 (월명사·충담사·융천사·신충·영재·처용)
- 균여 보현십원가 11수
- 서동요 1수
- 고려가요 7수 (가시리·사모곡·상저가·청산별곡·서경별곡·동동·쌍화점)

각 시 `title_ko + translation_ko + commentary_ko` 채움. `quality='canonical'`로 LLM 번역과 구분.

부수 — 카테고리 매핑 오류 4건 정정 (`fix_korean_hyangchal_metadata.py`):
- id=47525 이언진 7언율시가 '향가'로 잘못 매핑 → 七言律詩
- id=47379 「怨歌」 시인이 申師任堂으로 잘못 매핑 → 信忠 신규 INSERT 후 변경
- 均如 11수 미확정 → 향가

## B4-2: KR 미확정 1,478수 카테고리 자동 분류 (jds 커밋 933c255)

본래 외부 검색 + subagent 6개 병렬 호출(TOP 25 시인 1,305수)했으나, agent들이 대부분 형태 기반(`n=4 char=5` 등) 분류로 회귀하고 A1(이언진 251수)은 stall. 결정:
- 형태 기반 자동 룰을 확장(古詩/排律/雜言까지)해 일괄 적용
- 句 분리 룰 보강 (「。，.,？？！！；;」 모두 인식)
- 樂府 자동 분류는 위양성(`~之行` 같은 일반 시 제목)이 많아 제외 → 후속 작업

KR 시 최종 카테고리 분포 (1,616수 전원 분류, 미확정 0):

| 카테고리 | 수 |
|---|---|
| 五言律詩 | ~454 |
| 七言絶句 | 374 |
| 七言律詩 | 234 |
| 五言絶句 | 176 |
| 五言排律 | 142 |
| 雜言古詩 | 90 |
| 七言排律 | 59 |
| 五言古詩 | 28 |
| 향가 | 19 |
| 七言古詩 | 10 |
| 국한혼용 | 8 |
| 고려가요 | 7 |
| 그 외 (고대/왕실 시가, 시조, 가사, 致語 등) | 15 |

## e: 한국 시인 NULL slug 73명 보정 (jds 커밋 f7ffb1b)

소스: 시인 한자 이름 → 한국 한자음 → 로마자 표기 (Revised Romanization 변형 + 관용 표기) 직접 매핑.
73명 모두 매핑, 충돌 0건. KR 시인 118명 전원 slug 보유. `/poets/[slug]` 라우트 모두 동작.

# 어디서 멈췄는지

라운드 2 (B1·B2·B3·B4-1·B4-2 + e) 완료. 한문 한시 1,589수 본 번역(B4 일괄), 평측 분석 도구, jinas 배포는 다음 세션 후보.

# 핵심 판단과 이유

## 1. tang300 76명 정밀 백필 시 4명 신규 INSERT
**판단**: jds에 없던 邱爲, 金昌緖, 唐玄宗, 杜秋娘을 신규 시인으로 INSERT (`title_id="TANG300-Cxxx"` prefix).
**이유**: db_author.with_ko.json의 사이버서당 76명에 다 있는데 jds 전당시에는 누락. 시인 페이지 라우트(`/poets/[slug]`)가 동작하려면 신규 등록 필요. 작품(시) 매칭은 후속 (poem_annotations 테이블에 저장된 본문과 새 poet_id 연결 필요).

## 2. CN era 정밀 분류는 황실+대시인까지
**판단**: 2,659명 일괄 '당' 잔재 중 36명만 변경. 나머지 2,627명은 '당' 유지.
**이유**: 마이너 시인(poem_count 1~5수) 1,500여명에 대해 외부 lookup은 비용·시간 大. 큐레이션·사이트 동작에 임팩트 큰 황실+대시인만 정밀화. eras.ts의 tang matchPeriods가 '당'을 다 잡으므로 사이트 동작에는 무해.

## 3. B4 향찰은 Claude 수작 번역, 한문은 qwen 일괄
**판단**: 향찰/고려가요 27수만 Claude subagent 4개로 학계 표준 해독 → DB 직접 입력. 한문 한시 1,589수는 다음 세션에 qwen3.6:27b 일괄.
**이유**: 향찰은 학계 정설(양주동·김완진 등) 해독본이 정립되어 있고 LLM 직역은 부적절. 27수 한정이라 수작 가능. 1,589수 일괄 번역은 5~10시간 + jinserver SSH tunnel 안정성 필요해 별도 세션.

## 4. 카테고리 분류는 형태 기반 자동 룰로 일관성 확보
**판단**: subagent 외부검색을 시도했으나 대부분 형태 기반 회귀 + A1 stall. 형태 룰을 확장(古詩/排律/雜言)해 1,478수 일괄 적용.
**이유**: agent 결과들이 사실상 같은 형태 룰을 적용한 것이라 자동 룰로 대체 가능. 樂府 자동 분류만 위양성 多(예: 제목 끝 "之行" 같은 일반 시)로 제외. 평측·압운 분석으로 학술 정확도 높이는 작업은 한시 작성 도우미 구현 시 통합 (별도 spec).

## 5. KR 시인 slug는 한국 한자음 + 관용 표기
**판단**: 73명을 한자→한국 한자음→로마자(RR 변형 + 관용)으로 직접 매핑. Lee가 아닌 yi(姓 李), park(姓 朴) 등 관용 우선.
**이유**: 한국 시인 URL이 `/poets/yi-eonjin` 같이 자연스러워야 함. RR 표준만 따르면 'i-eonjin'(姓 i?) 같이 어색. 73명 한정이라 직접 매핑이 정확.

# 생성/수정/참조한 문서

## 생성

### jds (커밋 875e258 / 6bada98 / 5495253 / 1666658 / f7ffb1b / 933c255)
- `scripts/backfill_tang300_authors.py`
- `scripts/backfill_cn_era_precise.py`
- `scripts/sample_translate_korean.py`
- `scripts/fix_korean_hyangchal_metadata.py`
- `scripts/apply_hyangchal_translations.py`
- `scripts/backfill_kr_poet_slug.py`
- `scripts/classify_korean_uncategorized.py`
- `pipeline/translate/prompts/v4_batch_korean.txt`

### hanshinaru
- `docs/handoff/2026-04-27-data-enrichment-round2.md` (본 문서)

## 참조
- `public/index/db_author.with_ko.json` (당시삼백수 76명 풍부 메타 — B1+B2 소스)
- `src/data/eras.ts` (era 매핑 룰 — B3 정합)
- `docs/spec/2026-04-27-site-rebuild-master-plan.md`
- `docs/handoff/2026-04-27-site-rebuild-round1-complete.md` (이전 세션)

# 원래 계획과 달라진 점

## 1. B1과 B2 통합 처리
- 원 계획: B1(71명 백필) + B2(5명 표기 정리) 분리
- 실제: db_author 76명 안에 5명 다 있어 한 스크립트로 처리. 1명(陳子昻) 정규화 매칭, 4명 신규 INSERT.

## 2. B4-2 외부검색 → 형태 자동 룰
- 원 계획: TOP 25 시인 외부검색(subagent 6개)으로 학술 분류
- 실제: agent들 대부분 형태 기반 회귀 + A1 stall. 형태 룰 확장으로 일괄 처리. 결과 일관성↑, 시간 절약.

## 3. 균여 11수 카테고리 미확정 → 향가 정정
- 원 계획에 없었음
- B4-2 분석 중 발견 — 보현십원가 11수가 향찰인데 cat='미확정'. fix 스크립트로 정정.

# 다음 세션의 첫 행동

## 부트 루틴
1. 본 핸드오프 + `.rules/` + `git log -20`
2. `git status` — round1 잔재(.bkit/, .gemini/ 등 38k+ untracked) 확인 후 손대지 않기

## 라운드 3 후보 (진우형 결정 필요)

### A. 한문 한시 1,589수 qwen3.6:27b 일괄 번역 (B4 본 작업)
- 5~10시간 소요 (백그라운드)
- jinserver SSH tunnel 안정성 + ollama 메모리 관리
- 흐름: pipeline.cli translate 통합 (country='KR' 필터 추가) 또는 standalone 배치
- 시인 era 메타 보강 후 진행 권장 (commentary 사실 오류 감소)

### B. 평측 분석 도구 + 한시 작성 도우미 통합
- 평측·압운 룰 구현 → 古體 vs 近體 정확 구별
- 한시 작성 도우미 페이지(현재 placeholder)와 통합
- 별도 spec 작성 후 진행

### C. tang300 매칭 안 된 시 데이터 정합
- B1+B2에서 INSERT한 4명(邱爲·金昌緖·唐玄宗·杜秋娘)의 작품
- poem_annotations 테이블에 poem_id=NULL로 저장된 본문을 새 poets와 매칭
- poems 테이블에 신규 INSERT + poem_annotations.poem_id 채우기

### D. featured_poets/poems 진우형 수기 검수
- 현재 자동 ranking 시드 (`picked_by='auto'`)
- 형 검수해서 `picked_by='human'`으로 덮어쓰기

### E. 樂府 정확 분류 (B4-2 보완)
- 알려진 樂府 제목 list 작성 + 매칭
- 약 50~150수 추정

### F. jinas docker-compose 배포 (라운드 1 잔여)
- `hanshinaru-web` 컨테이너 추가
- CF Tunnel + production read-only DB role

# 다음 세션이 피해야 할 함정

## 데이터
- **CN 2,627명 era='당' 유지**: 마이너 시인. eras.ts tang matchPeriods가 다 잡지만 정밀화 원하면 위키 lookup 별도 spec.
- **均如 시인 era_period NULL**: tang300이 아니라 db_author 백필 대상 아님. 고려 시인 era 별도 보강 필요.
- **'잡언고시' 1수 vs '雜言古詩' 90수**: 한자/한글 혼용 카테고리 잔재. 통합 정정 필요 (소문자 '잡언고시'는 별도).
- **'미상' 카테고리 2수**: 정체 모호. 후속 점검.

## 분류 정확도
- **형태 기반 분류 한계**: 五言絶句와 五言古絶, 七言古詩와 일반 古詩 구별은 평측·압운 분석 없이 불가. 현재 분류는 형태 룰 기반 추정.
- **樂府 미분류**: 자동 룰이 위양성 多로 제외. 후속 list 매칭으로 약 50~150수 정확화 가능.

## 환경
- **Local ollama 사용 금지**: macbook ollama가 동작해도 사용 X. jinserver SSH tunnel 통한 사용만 (마스터플랜 명시).
- **`think: false` 필수**: qwen3.6 모델 호출 시. 안 끄면 timeout.
- **jinas DB 일시 timeout**: SQLAlchemy connection pool이 가끔 stuck. 재시도 또는 직접 psycopg2 connection으로 우회.

## 코드
- **classify_korean_uncategorized.py 재실행 주의**: 이미 적용됨. 다시 돌리면 미확정 0개라 NoOp이지만, 룰 변경 시 기존 분류 덮어쓰기 가능.
- **자동 권한 룰 미설정**: jds backfill 스크립트 실행 시 production DB 쓰기 컨펌 매번 필요 (이번 세션 형 결정). 형이 룰 추가 원하면 `/permissions` 슬래시 커맨드 활용.

# 후속 작업 (라운드 3 spec 또는 별도 세션)

- **A**: 한문 1,589수 qwen 일괄 번역 (가장 큰 작업)
- **B**: 평측 분석 + 한시 작성 도우미 (별도 spec)
- **C**: tang300 4명 시인 작품 정합
- **D**: featured 수기 검수
- **E**: 樂府 정확 분류
- **F**: jinas 배포 (라운드 1 잔여)
- KR 시인 era_period 보강 (균여 등)
- 카테고리 한자/한글 혼용 통합 (잡언고시→雜言古詩 등)
- '미상' 카테고리 2수 점검
- 한국어 시(국한혼용 8 + 고려가요 7) commentary 검수 (이미 채움, 정확도 검증 후속)
