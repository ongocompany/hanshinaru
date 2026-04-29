---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: handoff
status: active
title: 당 이전 중국 한시 manifest와 덤프 추출기 추가
date: 2026-04-30
author: 지훈
---

# 이번 세션에서 완료한 작업

지난 커밋 `a3041d9a [지훈][Docs] 당 이전 중국 한시 전체 수집 전략 핸드오프`와 최신 handoff `docs/handoff/2026-04-30-pre-tang-whole-corpus-plan.md`를 읽고, `先秦漢魏晉南北朝詩` 중심 수집을 실행 가능한 manifest 단계로 옮겼다.

생성/수정한 파일은 다음과 같다.

- `docs/spec/2026-04-30-pre-tang-whole-corpus-sources.md`
- `scripts/data/cn_pre_tang_whole_corpus_manifest.mjs`
- `scripts/build_cn_pre_tang_whole_corpus_manifest.mjs`
- `scripts/extract_cn_wikisource_manifest_pages.py`
- `docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json`
- `docs/spec/cn-pre-tang-whole-corpus-manifest.report.v1.json`
- `package.json`

# 결과

`npm run cn:pre-tang-manifest`로 135권 권차 manifest를 생성했다.

- 시대 수: 12
- 전체 권수: 135
- 첫 tranche: `先秦` 7권 + `漢` 12권 = 19권
- validation: `ok: true`

`scripts/extract_cn_wikisource_manifest_pages.py`는 manifest의 `lookupStatus=first-tranche` 권차만 골라 `sourceLookupCandidates`의 exact title을 원본 `zhwikisource-latest-pages-articles.xml.bz2`에서 추출한다.

# 검증

- `npm run cn:pre-tang-manifest`: 통과
- `node --test tests/cn_hansi_pipeline.test.mjs`: 통과
- `python3 scripts/extract_cn_wikisource_manifest_pages.py --help`: 통과
- `PYTHONPYCACHEPREFIX=/tmp/hanshinaru-pycache python3 -m py_compile scripts/extract_cn_wikisource_manifest_pages.py`: 통과
- `git diff --check`: 통과
- `npx tsc --noEmit`: 실패
  - 기존 `docs/archive/2026-04-28-pre-cleanup/tang300/tang300.tsx`, `poets/poets.tsx` React/JSX 타입 문제다.
  - 이번 manifest/dump extractor 변경의 회귀로 보지 않는다.

# 멈춘 지점

`jinas`에서 즉석 `ssh python3 -c ...` 방식으로 exact title 스캔을 시도했지만, SSH 명령 문자열 안의 한자가 `?`로 깨져 잘못된 title을 찾는 상태가 되었다. 해당 원격 프로세스는 중단했다.

따라서 다음 세션에서는 즉석 one-liner가 아니라 repo 파일인 `scripts/extract_cn_wikisource_manifest_pages.py`를 `jinas` 작업 디렉터리에 두고 실행해야 한다.

# 다음 세션 첫 행동

1. 이 handoff와 `docs/spec/2026-04-30-pre-tang-whole-corpus-sources.md`를 읽는다.
2. `jinas`의 `/volume1/homes/jinadmin/dumps/zhwikisource/work/hanshinaru-cn-non-tang/` 또는 새 작업 디렉터리에 최신 `scripts/extract_cn_wikisource_manifest_pages.py`와 manifest JSON을 둔다.
3. 아래 명령을 원격 파일 기준으로 실행한다.

```bash
python3 scripts/extract_cn_wikisource_manifest_pages.py \
  --dump /volume1/homes/jinadmin/dumps/zhwikisource/latest/zhwikisource-latest-pages-articles.xml.bz2 \
  --manifest docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json \
  --out docs/spec/cn-pre-tang-whole-corpus-first-tranche.dump.raw.v1.json
```

4. exact title hit이 낮으면 `古詩源`, `樂府詩集`, `昭明文選` 같은 companion source에서 first tranche 원문을 회수한다.
5. 원문을 붙이는 즉시 raw source, normalized record, review queue, dry-run counts를 같이 남긴다.

# 피해야 할 함정

- `詩經`, `楚辭`를 `先秦漢魏晉南北朝詩` 본체에 섞지 않는다.
- 후대 `宋`과 남조 `宋`을 같은 slug로 처리하지 않는다. manifest에서는 남조 송을 `liu-song`으로 고정했다.
- `ssh python3 -c` 안에 한자 title을 직접 넣어 원격 덤프를 스캔하지 않는다. 인코딩이 깨질 수 있다.
- 기존 HTML/PSD 수정분은 이번 데이터 파이프라인 작업과 별개로 보인다. stage/commit 시 섞지 않는다.
