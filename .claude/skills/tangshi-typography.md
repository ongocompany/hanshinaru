---
name: tangshi-typography
description: 한시의모든것 타이포그래피 시스템. 디자인/UI 작업 시 자동 참조. Use when designing pages, creating components, or reviewing typography.
---

# Typography System — 한시의모든것

## Font Families (2종)

| 변수 | 폰트 스택 | 용도 |
|------|-----------|------|
| `--font-ko` | Noto Serif KR, serif | 한글 본문, UI 전반 |
| `--font-zh` | adobe-fangsong-std, fangsong, LXGW WenKai Mono TC, Noto Serif TC, serif | 한자 제목, 브랜드, 장식 |

### 규칙
- 한글 텍스트 → `--font-ko` (body 기본값)
- 한자가 포함된 제목/브랜드/장식 요소 → `--font-zh`
- HTML에서 인라인 한자 → `<span class="zh">漢字</span>`

## Font Scale (9단계)

| 변수 | 사이즈 | 용도 | 예시 |
|------|--------|------|------|
| `--fs-number` | 64px | 장식 넘버링 | 01, 02 섹션 번호 |
| `--fs-display` | 48px | 페이지 대제목 (한자) | 爲何唐詩, 詩之形態 |
| `--fs-h1` | 36px | 섹션 부제목 (한자) | 絶句與律詩, 形式之美學 |
| `--fs-h2` | 28px | 카드/박스 제목 | 平仄與四聲, 山水田園 |
| `--fs-h3` | 22px | 소제목 | 四聲, 切韻, 宋詩 |
| `--fs-lead` | 20px | 리드/강조 본문 | 인트로 문단, 결론 |
| `--fs-body` | 18px | 일반 에디토리얼 본문 | 설명, 해설 텍스트 |
| `--fs-small` | 14px | UI, 메뉴, 캡션 | 네비, 트리 항목, 버튼 |
| `--fs-xs` | 13px | 최소 텍스트 | 드롭다운, 트리 하위, 푸터 |

### 배율 근거
Major Third (1.25) 기반. 참고: https://typescale.com/

## Color Tokens

| 변수 | 값 | 용도 |
|------|-----|------|
| `--c-ink` | #333 | 본문 텍스트 |
| `--c-heading` | #3a2a18 | 제목, 강조 (짙은 갈색) |
| `--c-muted` | #666 | 보조 텍스트 |
| `--c-faint` | #999 | 비활성/힌트 텍스트 |
| `--c-warm-bg` | #faf8f5 | 따뜻한 배경색 |
| `--c-border` | #e8e4df | 구분선, 테두리 |

## 사용 가이드

### 새 페이지/컴포넌트 만들 때
```css
/* 좋은 예 */
.my-title { font-family: var(--font-zh); font-size: var(--fs-h2); color: var(--c-heading); }
.my-text  { font-size: var(--fs-body); color: var(--c-ink); }

/* 나쁜 예 — 하드코딩 금지 */
.my-title { font-family: 'adobe-fangsong-std', ...; font-size: 28px; color: #3a2a18; }
```

### 사이즈 선택 기준
1. **이 텍스트가 무슨 역할?** → 위 표에서 "용도" 매칭
2. **한자가 들어가나?** → Yes면 `--font-zh` + 보통 `--fs-display` ~ `--fs-h3`
3. **본문인가?** → 에디토리얼이면 `--fs-body`(18px), UI면 `--fs-small`(14px)

### 반응형 축소 규칙
768px 이하에서:
- `--fs-number` 64 → 40px
- `--fs-display` 48 → 36px
- `--fs-h1` 36 → 28px
- `--fs-small` (네비/탭) → 12px
- 본문(`--fs-body`)은 축소하지 않음 (가독성 유지)

## 웹폰트 로드 (모든 페이지 필수)

```html
<!-- Adobe Fonts -->
<link rel="stylesheet" href="https://use.typekit.net/dje5vco.css">
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+Mono+TC&family=Noto+Serif+KR:wght@200..900&family=Noto+Serif+TC:wght@200..900&display=swap" rel="stylesheet">
```

## CSS 변수 정의 위치
`/shared/styles.css` — `:root { }` 블록 (파일 최상단)
