# 시 모달 UI 수정 실행 계획서

작성일: 2026-02-15
작성자: Claude (민철)
근거: `docs/FromJin/03_Jin_answer.md` (형 최종 결정사항)

---

## 형의 결정 요약

| # | 결정 | 비고 |
|---|------|------|
| 1 | 모달 폭 920px 이하 (800px도 OK) | 확정 |
| 2 | 좌우 2컬럼 반대 | 세로 1컬럼 유지 |
| 3 | 긴 시는 그냥 세로로 길게 | 별도 모드 불필요 |
| 4 | 상단=예술(시+그림), 하단=정보 | 두루마리 컨셉 채택 |
| 5 | 접기/펼치기 없이 한방에 다 펼침 | 섹션별 배경색 구분 |
| 6 | 미드저니: 세로 그림 + 주제 하단 배치 | 프롬프트 실험 필요 |
| 7 | 그림 없는 시: 시대별 기본 텍스처 | 바로 실행 |
| 8 | 정렬: 그림 배경 있는 시만 중앙정렬, 나머지 좌측 | 내부 마진 추가 |
| 9 | 콘텐츠 전부 한 페이지에 스크롤로 노출 | 클릭 인터페이스 최소화 |

---

## 실행 계획

### Step 1: 모달 폭 + 기본 정리

**변경 파일**: `styles.css`

1. 모달 폭 축소
```css
/* 변경 전 */
.modal { width: min(1400px, 96vw); }

/* 변경 후 */
.modal { width: min(860px, 96vw); }
```
860px 제안 이유: 920px에서 padding 빼면 본문 영역이 약 820px. 800px에 양쪽 padding 30px씩 = 860px이 딱 맞음.

2. `.modal-title` 다시 표시
```css
/* 변경 전 */
.modal-title { display: none !important; }

/* 변경 후 — 삭제 또는 display: block */
```

3. 본문 내부 마진 추가
```css
.poem-section {
  padding: 0 24px;  /* 좌우 여백 */
}
```

### Step 2: 아코디언/접기 제거 → 전부 펼침

**변경 파일**: `app.js`

현재 시인모달 내 시 본문은 아코디언(클릭해서 펼치기)으로 되어 있음.
이걸 기본 펼침으로 변경하되, 섹션 간 시각적 구분을 줌.

1. 시 본문 렌더링: 아코디언 헤더 클릭 없이 바로 내용 노출
2. 섹션별 배경색 구분:

```css
.poem-section-body {
  background: #faf8f5;       /* 시 본문: 따뜻한 종이색 */
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.poem-section-translation {
  background: #f5f5f0;       /* 번역: 약간 더 진한 종이 */
  padding: 20px 24px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.poem-section-commentary {
  background: #f0f0eb;       /* 집평: 더 진한 톤 */
  padding: 20px 24px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.poem-section-notes {
  background: #eceee8;       /* 주석: 가장 진한 톤 */
  padding: 20px 24px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.poem-section-advanced {
  background: #e8eae4;       /* 심화: 별도 톤 */
  padding: 20px 24px;
  border-radius: 8px;
}
```

배경색은 모두 따뜻한 종이색 계열로 통일하되, 위에서 아래로 갈수록 아주 조금씩 진해지면서 "섹션이 바뀌었구나"를 느끼게 함. 요란하지 않게.

### Step 3: 그림 + 시 본문 (상단 예술 영역)

**변경 파일**: `styles.css`, `app.js`

형의 결정: "세로로 긴 그림, 주제가 하단에 위치, 위쪽은 여백"

#### 3-1. 그림 있는 시

```
┌─────────────────────────────┐
│                             │
│   (여백 또는 하늘/산수)      │  ← 그림 상단: 여백
│                             │
│                             │
│   〈春望〉                   │  ← 시 텍스트 (일반 흐름)
│                杜甫          │
│                             │
│   國破山河在  城春草木深      │
│   感時花濺淚  恨別鳥驚心      │
│   烽火連三月  家書抵萬金      │
│   白頭搔更短  渾欲不勝簪      │
│                             │
│   ~~~~ (그림 주제 부분) ~~~~ │  ← 그림 하단: 주제
│                             │
├── 그라데이션 → 종이색 ───────┤
│                             │
│   (번역, 집평, 주석...)      │  ← 정보 영역
└─────────────────────────────┘
```

CSS 핵심:
```css
.poem-hero {
  position: relative;
  background-size: cover;
  background-position: bottom center;  /* 그림 하단 기준 정렬 */
  padding: 40px 32px;
}

/* 하단 그라데이션 페이드 */
.poem-hero::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  background: linear-gradient(transparent, #faf8f5);
  pointer-events: none;
}

/* 시 텍스트: absolute 아님! 일반 흐름 */
.poem-hero-text {
  position: relative;
  z-index: 1;
  color: #333;
  text-shadow: 0 0 12px rgba(255,255,255,0.8);  /* 밝은 그림자로 가독성 확보 */
  font-family: fangsong, 'LXGW WenKai Mono TC', serif;
  font-size: 20px;
  line-height: 2.2;
  text-align: center;
}
```

변경 포인트:
- `position: absolute` → `relative` (긴 시도 잘리지 않음)
- `background-position: bottom` (그림 하단=주제 부분이 항상 보임)
- 텍스트 색: 흰색 대신 `#333` + 밝은 text-shadow (한지 느낌)
- 중앙 정렬은 그림 있는 시에서만 적용

#### 3-2. 그림 없는 시

```css
.poem-hero-plain {
  background: #faf8f5;  /* 종이색 */
  /* 또는 한지 텍스처 이미지 */
  padding: 40px 32px;
}

.poem-hero-plain .poem-hero-text {
  text-align: left;      /* 좌측 정렬 (형 지시) */
  padding-left: 24px;    /* 내부 마진 */
}
```

시대별 기본 텍스처 옵션 (나중에 추가 가능):
- 초당: 밝은 백색 한지
- 성당: 연한 파란 톤 한지
- 중당: 연한 노란 톤 한지
- 만당: 연한 초록 톤 한지

### Step 4: 정렬 정리

**변경 파일**: `styles.css`, `app.js`

형 결정: "그림 배경 있는 시만 중앙정렬, 나머지는 좌측정렬"

```javascript
// app.js에서 renderPoemSection 시
const hasImage = !!poem.bgImage;

const textAlign = hasImage ? 'center' : 'left';
const heroClass = hasImage ? 'poem-hero' : 'poem-hero-plain';
```

추가: 번역/집평/주석은 항상 좌측정렬 (정보 영역이므로)

### Step 5: 미드저니 프롬프트 실험

형이 직접 실험할 부분. 추천 프롬프트 방향:

```
A vertical scroll painting in traditional Chinese ink wash style,
subject matter (mountains/river/figure/flowers) placed at the bottom third,
upper two-thirds is empty sky/mist/blank space in warm rice paper tone,
aspect ratio 2:3 or 3:5 (세로로 긴 비율),
soft edges, no hard borders, traditional 宣紙 (Xuan paper) texture
--ar 2:3
```

시 주제별 변형:
- 산수 풍경 시: `misty mountains at bottom, vast empty sky above`
- 전쟁/이별 시: `lone figure on horseback at bottom, desolate plain fading to empty sky`
- 꽃/봄 시: `cherry blossoms at bottom corner, soft empty space above`
- 달/밤 시: `crescent moon at bottom, deep indigo gradient fading to paper white`

핵심:
- `--ar 2:3` 또는 `--ar 9:16` (세로로 긴 비율)
- `bottom third composition` (하단 1/3에 주제 집중)
- `rice paper texture`, `ink wash style` (한지/수묵 느낌)
- `negative space`, `minimal` (상단 여백 확보)

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `styles.css` | 모달 폭, 섹션 배경색, poem-hero 스타일, 정렬, 마진 |
| `app.js` | 아코디언→전부 펼침, 섹션 클래스 부여, 정렬 조건분기, hero 렌더링 |

관리툴(`admin/`)은 이번에 안 건드림. 메인 사이트 모달만 수정.

---

## 작업 순서 (리스크 낮은 순)

1. **모달 폭 860px + 내부 마진** — CSS만, 즉시 효과
2. **아코디언 제거 → 전부 펼침** — app.js 렌더링 변경
3. **섹션별 배경색** — CSS 추가
4. **정렬 정리** (그림 있으면 중앙, 없으면 좌측) — CSS + app.js 조건분기
5. **poem-hero 구조** (absolute → relative, 그라데이션) — CSS + app.js
6. **그림 없는 시 기본 텍스처** — CSS
7. **QA**: 짧은 시 5편 + 긴 시 3편 + 그림 있는/없는 각 3편

---

## 미드저니 실험 결과 대기

Step 5 프롬프트 실험은 형이 진행. 결과에 따라 Step 3의 세부 CSS 조정 필요:
- 그림 하단 배치가 잘 되면 → `background-position: bottom` 유지
- 잘 안 되면 → `background-position: center` + 그라데이션 강화로 보정

형이 미드저니 실험 결과 보내주면 그때 최종 CSS 확정하고 구현 시작할게.

---

형 확인 후 수정 시작합니다. 의견이나 추가 요청 있으면 이 문서 하단에 추가해주세요.
