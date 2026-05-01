---
epic_id: cn-translation-v2
doc_type: handoff
status: active
title: 중국 한시 번역 v2 public index 배포
date: 2026-05-01
author: 지훈
---

## 이번 세션에서 완료한 작업
- `npm run cn:translations:apply-public`로 번역 v2 결과를 public index에 반영했다.
- 반영 결과:
  - imported poems: `1040`
  - `public/index/poems.v3.json`: `1360`편
  - `public/index/poems.compact.json`: `1360`편
  - `public/index/db_author.with_ko.json`: authors `271`
  - 이번 묶음 poemNo: `321`~`1360`
- Node 22로 `npm run build`를 실행해 Astro 빌드 통과를 확인했다.
- `main`에 push했고 GitHub Actions `Deploy Astro to jinas` run `25210026756`이 성공했다.
- 운영 확인:
  - `https://hanshinaru.kr/index/poems.compact.json` status `200`
  - total `1360`
  - imported `1040`
  - first queueId `CN-TR-00001`
  - last queueId `CN-TR-01040`

## 어디서 멈췄는지
- `hanshinaru.kr` 운영 배포는 완료했다.
- 형님이 말한 `hanshinaru.co.kr`은 현재 DNS가 해석되지 않는다. `dig` 확인 결과 `hanshinaru.co.kr`, `www.hanshinaru.co.kr` 모두 A 레코드가 없고, repo의 `CNAME`, `astro.config.mjs`, GitHub Actions 배포 경로도 모두 `hanshinaru.kr` 기준이다.

## 핵심 판단과 이유
- 기존 배포 workflow가 `main` push 후 `/var/www/hanshinaru.kr`로 배포하므로, public index 반영 커밋을 push해 운영 반영했다.
- 정적 HTML/PSD 변경은 형님 작업으로 보이는 기존 dirty state라 커밋에 포함하지 않았다.

## 생성/수정/참조한 문서
- 수정: `public/index/poems.v3.json`
- 수정: `public/index/poems.compact.json`
- 수정: `public/index/db_author.with_ko.json`
- 생성: `docs/handoff/2026-05-01-cn-translation-public-deploy.md`

## 다음 세션의 첫 행동
1. 브라우저에서 `https://hanshinaru.kr/hansi/chinese/poets/` 또는 실제 작품 모달을 열어 중국 번역 1040편이 UI에서 보이는지 육안 확인한다.
2. `hanshinaru.co.kr`도 실제 운영 도메인으로 쓸 계획이면 DNS/Cloudflare에 `hanshinaru.kr`과 같은 origin 연결을 추가한다.

## 다음 세션이 피해야 할 함정
- 현재 운영 도메인으로 확인 가능한 것은 `hanshinaru.kr`이다. `hanshinaru.co.kr`은 배포 문제가 아니라 DNS 미설정 문제다.
- public index는 커밋됐지만, 형님이 수정한 정적 HTML/PSD dirty files는 여전히 working tree에 남아 있다. 섞어 커밋하면 안 된다.
