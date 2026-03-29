---
from: roy
to: claude
type: handoff
priority: high
created: 2026-03-29 20:40
sprint: SC-002
---

# Sprint Contract SC-002: 페이지 구조 통일 + CMS화

## 배경 (형의 요구)

현재 한시나루 사이트의 문제점:
1. **페이지마다 편집 스타일이 제각각** — HTML 직접 작성, 인라인 스타일, 구조 불일치
2. **내용 수정이 까다로움** — 콘텐츠가 HTML에 하드코딩되어 있어 비개발자가 수정 불가
3. **데이터 추가 시 깔끔하게 붙지 않음** — 통일된 템플릿/구조 없음
4. **admin 페이지에서 콘텐츠 관리가 안 됨** — 현재 admin은 DB 데이터만 관리 가능

형이 원하는 최종 상태:
> "admin 페이지에서 내가 올려도 깔끔하게 달라 붙게"

## 현재 페이지 구조 파악 필요

아래 페이지들의 현재 상태를 먼저 조사해야 함:

### 콘텐츠 페이지 (데이터 구조화 필요)
| 경로 | 현재 상태 | 비고 |
|------|-----------|------|
| `chinese-poetry/general/index.html` | HTML 직접 작성 추정 | 중국 한시 개요 |
| `chinese-poetry/general/literary-history/` | HTML 직접 작성 추정 | 문학사 |
| `chinese-poetry/general/masterworks/` | HTML 직접 작성 추정 | 명작 소개 |
| `chinese-poetry/books/` | HTML 직접 작성 추정 | 서적 소개 |
| `chinese-poetry/history/` | HTML 직접 작성 추정 | 역사 |
| `korean-poetry/general/` | HTML 직접 작성 추정 | 한국 한시 개요 |
| `korean-poetry/great-poets/` | HTML 직접 작성 추정 | 한국 대시인 |
| `hanja/` | HTML 직접 작성 추정 | 한자와 한문 |
| `terms/` | HTML 직접 작성 추정 | 용어 해설 |

### DB 기반 페이지 (이미 구조화됨)
| 경로 | 데이터 소스 | 비고 |
|------|------------|------|
| `timeline/` | Supabase (poets, poems, history) | app.js로 렌더링 |
| `chinese-poetry/poets/` | Supabase | 시인 목록/상세 |
| `poem/` | Supabase | 시 상세 |
| `tang300/` | Supabase | 당시삼백수 |
| `community/` | Supabase | 게시판 |
| `search/` | Supabase | 검색 |

## 해야 할 일

### Phase A: 현황 조사
- [ ] 각 콘텐츠 페이지의 HTML 구조, 스타일 방식, 데이터 형태 조사
- [ ] 어떤 콘텐츠가 DB화 가능한지 / 정적 유지해야 하는지 분류
- [ ] admin 현재 기능 범위 파악

### Phase B: 통일 템플릿 설계
- [ ] 공통 페이지 레이아웃 정의 (헤더/사이드바/본문/푸터)
- [ ] 콘텐츠 타입별 템플릿 설계:
  - **읽기 전용 아티클** (문학사, 개요, 한자 해설 등)
  - **목록+상세** (시인, 작품, 서적)
  - **인터랙티브** (타임라인, 검색, 작성도우미)
- [ ] CSS 통일 전략 (현재 styles.css 1,594줄 + shared/styles.css 691줄 + 각 페이지 인라인)

### Phase C: CMS화 (admin에서 관리)
- [ ] 콘텐츠 데이터를 Supabase 테이블로 이관 (또는 JSON 파일 구조화)
- [ ] admin에 콘텐츠 에디터 추가 (rich text → 저장 → 페이지 자동 반영)
- [ ] 이미지/미디어 관리 (Supabase Storage)

### Phase D: 마이그레이션
- [ ] 기존 HTML 콘텐츠를 새 구조로 이관
- [ ] 기존 URL 유지 (SEO/북마크 깨지지 않게)
- [ ] 페이지별 테스트

## 의사결정 필요 사항 (형과 논의)
1. **프레임워크 도입 여부**: Vanilla JS 유지 vs Astro/Next.js 전환
   - `docs/architecture.md`에 이미 pending decision으로 기록됨
   - 프레임워크 전환하면 템플릿 통일이 훨씬 수월하지만 학습/마이그레이션 비용 발생
2. **콘텐츠 저장 방식**: Supabase DB vs 구조화된 JSON 파일 vs Markdown
3. **admin 에디터 수준**: 단순 텍스트 vs rich text (Quill 등) vs Markdown

## 완료 조건
- [ ] Phase A 조사 보고서 → `docs/inbox/to-claude/`에 결과 남기기 (형 검토용)
- [ ] Phase B~D는 형 확인 후 진행

## 작업 방식
- SC-001 (모듈 분리) 완료 후 착수 권장 (코드 구조 이해 선행)
- `claude-feat-page-structure-01` 브랜치
- Phase A 완료 시 `docs/inbox/to-codex/`에 리뷰 요청
- 주요 의사결정은 형에게 질문 후 진행
