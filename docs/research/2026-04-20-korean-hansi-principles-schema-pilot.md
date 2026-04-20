---
epic_id: d2fcf245-b314-4881-827a-8e178167c643
doc_type: research
status: active
title: 한국 한시 프로젝트 원칙·스키마·파일럿 기준
date: 2026-04-20
author: 태훈
---

# 한국 한시 프로젝트 원칙·스키마·파일럿 기준

작성일: 2026-04-20  
작성자: 태훈

관련 문서:
- [한국 한시 공개 자료원 소스맵](/Users/jinwoo/Documents/development/hanshinaru/docs/research/2026-04-20-korean-hansi-source-map.md:1)
- [심층번역 운영프로토콜](/Users/jinwoo/Documents/development/hanshinaru/docs/research/12_심층번역_운영프로토콜_260216_CH.md:1)

## 0. 전제

- 한국 한시의 **원문 자체**는 대체로 공공영역(public domain)로 보되, 실제 서비스에서 접하는 **디지털 텍스트/이미지/번역본/주석본**은 별도 권리 상태를 가진다.
- 따라서 **“작품 단위 권리”가 아니라 “자산(asset) 단위 권리”**로 관리해야 한다.
- 특히 같은 작품 안에서도 아래는 서로 다르게 취급한다.
  - 원문 텍스트
  - 원문 이미지
  - 기존 번역문
  - 기존 주석/해설
  - Hanshinaru 자체 번역문
  - Hanshinaru 자체 주석/해설

## 1. 권리 원칙

### 1-1. 핵심 원칙

1. **원문과 번역문을 절대 같은 권리 묶음으로 취급하지 않는다.**
2. **원문은 수집하되, 번역문은 권리 상태를 확인한 뒤에만 저장/노출한다.**
3. **비상업 허용 번역문도 반드시 마킹한다.**
4. **상업 전환 시 교체가 필요한 자산은 지금부터 식별 가능해야 한다.**
5. **현재 사용 가능 여부와 미래 상업 가능 여부를 분리 기록한다.**

### 1-2. 운영 분기

#### A. 원문

- 기본값:
  - `public_domain_text`로 취급
- 단, 별도 확인 필요:
  - 디지털 이미지 다운로드 조건
  - OCR 텍스트 재배포 허용 여부
  - 출처 표기 의무

#### B. 타기관 기존 번역문/주석문

- 기본값:
  - `copyrighted`
  - `commercial_not_safe`
- 허용 케이스:
  - 비상업 공개 허용
  - 별도 승인 시 상업 허용
  - 공공누리 등으로 상업 이용 가능
- 이 경우에도 반드시 남겨야 하는 값:
  - 근거 URL
  - 확인 일시
  - 현재 허용 범위
  - 상업 전환 시 교체 필요 여부

#### C. Hanshinaru 자체 번역문/주석문

- 목표값:
  - `owned`
  - `commercial_safe`
- 단, 저작권 리스크 관리 차원에서 아래를 같이 기록:
  - 레거시 번역을 모델에 주입했는지 여부
  - 사람 검수를 거쳤는지 여부
  - 표절/유사성 점검 여부

### 1-3. 서비스 원칙

1. **내부 연구용 저장**과 **대외 서비스 노출**을 분리한다.
2. 권리 불명확 번역문은 수집 가능하더라도 기본적으로:
   - 내부 참고용 저장은 가능
   - 대외 노출은 보수적으로 제한
3. 향후 상업 전환 시 아래 중 하나라도 걸리면 교체 대상으로 본다.
   - `commercialAllowedNow = false`
   - `requiresPermissionForCommercial = true`
   - `mustReplaceBeforeCommercial = true`
   - `copyrightStatus = unknown`

## 2. 데이터 스키마 원칙

### 2-1. 스키마 레이어

권리 관리는 최소 2계층으로 간다.

1. `source_policy`
- 사이트/기관 단위 정책
- 예: 한국고전종합DB, 한국민족문화대백과, 특정 블로그, 특정 PDF 아카이브

2. `poem_asset_rights`
- 작품 내부 자산별 권리
- 예: 원문은 안전, 기존 번역은 비상업만 가능, 자체 번역은 상업 가능

이렇게 나누면 같은 사이트 정책을 작품마다 중복 기록하지 않아도 되고, 나중에 정책이 바뀌었을 때 일괄 갱신하기 쉽다.

### 2-2. 권장 source_policy 스키마

```json
{
  "policyId": "SRC-ITKC-001",
  "siteName": "한국고전종합DB",
  "siteUrl": "https://db.itkc.or.kr/",
  "termsUrl": "https://www.itkc.or.kr/content/contents.do?cid=20160826064519&menuId=112",
  "assetType": "text",
  "crawlAllowed": "unknown",
  "storeInternallyAllowed": true,
  "publicDisplayAllowed": "conditional",
  "nonCommercialAllowed": "conditional",
  "commercialAllowed": false,
  "requiresPermissionForCommercial": true,
  "attributionRequired": true,
  "policyStatus": "checked",
  "checkedAt": "2026-04-20T16:35:00+09:00",
  "checkedBy": "태훈",
  "evidenceNote": "홈페이지 콘텐츠 무단 복제·배포 금지 명시",
  "notes": "원문 열람/연구와 공개 재배포를 분리해 판단"
}
```

### 2-3. 작품 단위 기본 스키마

현재 `poems.v3.json`과 `ownedContentMeta` 구조를 고려하면, 한국 한시용 신규 스키마는 아래처럼 가는 게 좋다.

```json
{
  "poemId": "KHS-000001",
  "canonicalId": "KHS-CANON-000001",
  "title": {
    "zh": "黃鳥歌",
    "ko": "황조가"
  },
  "author": {
    "authorId": "KAUTH-0001",
    "zh": "琉璃王",
    "ko": "유리왕"
  },
  "era": {
    "label": "고구려",
    "startYear": -19,
    "endYear": 18,
    "confidence": "medium"
  },
  "genre": {
    "broad": "한시",
    "form": "사언고시"
  },
  "sourceWork": {
    "collectionTitle": "미상",
    "juan": "",
    "entryTitle": "黃鳥歌",
    "sourceUrl": "",
    "sourcePolicyId": "SRC-XXX-001"
  },
  "text": {
    "poemZh": "翩翩黃鳥\n雌雄相依\n念我之獨\n誰其與歸",
    "poemKoReading": "",
    "poemKoGloss": ""
  },
  "legacyAssets": {
    "translationKo": "",
    "notes": [],
    "commentaryKo": ""
  },
  "ownedAssets": {
    "translationKoOwned": "",
    "notesOwned": [],
    "commentaryKoOwned": "",
    "ownedContentMeta": {}
  },
  "rights": {
    "originalText": {},
    "legacyTranslation": {},
    "legacyNotes": {},
    "ownedTranslation": {},
    "ownedNotes": {},
    "images": {}
  },
  "commercialTransition": {
    "isCommercialReady": false,
    "blockingAssets": [],
    "replacementRequired": []
  }
}
```

### 2-4. 꼭 들어가야 하는 rights 필드

형 말씀대로 **나중에 상업 전환 시 번역만 다시 갈아끼우는 것**이 가능해야 하므로, 아래 필드는 필수다.

```json
{
  "rights": {
    "legacyTranslation": {
      "exists": true,
      "sourcePolicyId": "SRC-ABC-002",
      "sourceUrl": "https://example.org/work/123",
      "copyrightStatus": "copyrighted",
      "usageClass": "noncommercial_only",
      "publicDisplayAllowedNow": true,
      "commercialAllowedNow": false,
      "requiresPermissionForCommercial": true,
      "mustReplaceBeforeCommercial": true,
      "replacementPriority": "high",
      "attributionRequired": true,
      "checkedAt": "2026-04-20T16:40:00+09:00",
      "checkedBy": "태훈",
      "evidence": "사이트 이용조건에 비상업 허용 명시",
      "notes": "현재는 서비스 가능하나 상업 전환 시 자체 번역으로 교체"
    }
  }
}
```

### 2-5. 권장 enum

실무에서 헷갈리지 않게 enum을 고정한다.

#### `copyrightStatus`

- `public_domain`
- `copyrighted`
- `licensed`
- `owned`
- `unknown`

#### `usageClass`

- `internal_only`
- `reference_only`
- `noncommercial_only`
- `commercial_with_permission`
- `commercial_allowed`
- `unknown`

#### `replacementPriority`

- `low`
- `medium`
- `high`
- `critical`

#### `commercialTransition.isCommercialReady`

- `true`
- `false`

### 2-6. 상업 전환 판단 규칙

아래 중 하나라도 참이면 `isCommercialReady = false`

1. `legacyTranslation.exists = true`
2. `legacyTranslation.commercialAllowedNow = false`
3. `legacyTranslation.mustReplaceBeforeCommercial = true`
4. `legacyNotes.mustReplaceBeforeCommercial = true`
5. `rights.*.copyrightStatus = unknown`

예시:

```json
{
  "commercialTransition": {
    "isCommercialReady": false,
    "blockingAssets": [
      "legacyTranslation",
      "legacyNotes"
    ],
    "replacementRequired": [
      {
        "asset": "legacyTranslation",
        "reason": "noncommercial_only"
      },
      {
        "asset": "legacyNotes",
        "reason": "commercial permission not secured"
      }
    ]
  }
}
```

### 2-7. ownedContentMeta 확장 권장안

현재 문서의 `ownedContentMeta`는 품질 검증에 강하고 권리 필드는 약하다.  
아래 키를 추가하는 걸 권장한다.

```json
{
  "ownedContentMeta": {
    "status": "editing",
    "editedBy": "GPT-지훈",
    "reviewedBy": "",
    "approvedBy": "",
    "updatedAt": "2026-04-20 16:45",
    "researchBacked": true,
    "needsHumanReview": true,
    "generationPolicy": "deep-research-cross-validated",
    "sourceRefs": [],
    "rightsReview": {
      "legacyTranslationInjectedToModel": false,
      "legacyNotesInjectedToModel": false,
      "similarityCheckPassed": true,
      "copyrightRiskLevel": "low",
      "commercialSafe": true,
      "commercialSafeReason": "owned only"
    }
  }
}
```

## 3. 파일럿 작가 선정 기준

### 3-1. 파일럿 목표

처음부터 “유명 시인 전집”으로 가지 말고, **파이프라인 검증용으로 편향이 있는 50명**을 고른다.

파일럿의 목적은:

1. 수집 성공률 확인
2. 시 본문 파서 안정화
3. 권리 마킹 체계 검증
4. 시대/장르/작가군별 예외 확인
5. 자체 번역 워크플로우 검증

### 3-2. 선정 원칙

1. **원문 확보 쉬운 작가**를 일정 비율 포함한다.
2. **문학사 대표 작가**를 포함한다.
3. **여성/승려/왕실/비주류 작가**를 반드시 포함한다.
4. **시대 분산**을 준다.
5. **작품 수가 너무 적거나 너무 많은 작가**를 섞는다.

### 3-3. 파일럿 50명 구성 권장안

#### A군. 파이프라인 안정화용 20명

- 기준:
  - ITKC/규장각/KORCIS에서 흔적이 잘 잡히는 작가
  - 문집/편목색인/해제가 비교적 정돈된 작가
- 목적:
  - 첫 수집 자동화
  - 메타데이터 표준화
  - 시 추출 규칙 안정화

#### B군. 문학사 핵심축 15명

- 기준:
  - 고려~조선 후기의 대표 한시 작가
  - 후대 선집/평론/백과 설명이 풍부한 작가
- 목적:
  - 서비스 초기 인지도 확보
  - 번역 품질 기준 세우기

#### C군. 예외 처리용 10명

- 기준:
  - 여성 작가
  - 승려 시인
  - 왕/왕족
  - 기생/비정형 작가
  - 문집 구조가 불규칙한 작가
- 목적:
  - 데이터 예외 처리
  - 한국 한시의 대표성 확보

#### D군. 지방/문중/후기 확장용 5명

- 기준:
  - 유교넷/장서각/지역 자료에서 강한 작가
- 목적:
  - 중앙 문집 외 자료군 검증

### 3-4. 시대 비율 권장안

- 고대~통일신라/고려: 8명
- 조선 전기: 12명
- 조선 중기: 15명
- 조선 후기: 15명

### 3-5. 작가 선정 체크리스트

- [ ] 원문 출전이 최소 1개 이상 안정적으로 확인되는가
- [ ] 작가 기본 생몰/시대 메타데이터를 붙일 수 있는가
- [ ] 대표작 5수 이상 확보 가능성이 있는가
- [ ] 너무 특수한 예외만 가진 작가가 아닌가
- [ ] 파일럿 전체에서 시대/성별/신분 편향이 심하지 않은가

### 3-6. 추천 파일럿 성격

초기 파일럿은 “완전한 대표성”보다 아래에 더 가중치를 둔다.

1. 수집 쉬움
2. 권리 판정 쉬움
3. 메타데이터 정리 쉬움
4. 시 본문 구조가 비교적 명확함
5. 예외군이 적당히 섞여 있음

즉, **유명하지만 파싱이 지옥인 작가 전집보다**,  
**중간 난도의 다양한 작가군**이 파일럿에는 더 적합하다.

## 4. 바로 적용할 저장 규칙

### 4-1. 지금 당장 고정할 규칙

1. 기존 번역문을 저장하더라도 반드시 `legacyAssets`로 격리한다.
2. 자체 번역문은 반드시 `ownedAssets`에만 저장한다.
3. 권리 판단을 못한 자산은 `unknown`으로 두고 공개 기본값을 보수적으로 잡는다.
4. `legacyTranslation`이 존재하면 자동으로 `mustReplaceBeforeCommercial = true`를 기본값으로 둔다.
5. 추후 상업 전환 시에는 `commercialTransition.isCommercialReady = true`인 작품만 우선 공개 대상으로 삼는다.

### 4-2. 추천 기본값

#### 기존 번역문이 있는 경우

```json
{
  "rights": {
    "legacyTranslation": {
      "exists": true,
      "copyrightStatus": "copyrighted",
      "usageClass": "unknown",
      "publicDisplayAllowedNow": false,
      "commercialAllowedNow": false,
      "mustReplaceBeforeCommercial": true,
      "replacementPriority": "critical"
    }
  }
}
```

#### 자체 번역문만 있는 경우

```json
{
  "rights": {
    "ownedTranslation": {
      "exists": true,
      "copyrightStatus": "owned",
      "usageClass": "commercial_allowed",
      "publicDisplayAllowedNow": true,
      "commercialAllowedNow": true,
      "mustReplaceBeforeCommercial": false
    }
  }
}
```

## 5. 추천 다음 단계

1. `source_policy` JSON 초안 파일 생성
2. `korean_hansi_schema.json` 초안 작성
3. 파일럿 50명 후보군을 시대별로 실제 이름까지 뽑기
4. 기존 `poems.v3.json`/`owned` 구조와의 마이그레이션 맵 작성

## 6. 결론

형이 말씀하신 핵심은 스키마에서 이렇게 번역됩니다.

- **원문은 원문대로 관리**
- **번역은 번역대로 권리 관리**
- **비상업 허용 번역도 별도 마킹**
- **상업 전환 시 교체 필요 여부를 기계적으로 판별 가능하게 설계**

이 원칙만 제대로 박아두면, 지금은 비상업 서비스로 넓게 모으고,  
나중에는 `상업 안전한 자산만 남기는 방식`으로 부드럽게 전환할 수 있습니다.
