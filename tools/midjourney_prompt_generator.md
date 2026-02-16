# Midjourney Prompt Generator (GPT API)

작품 DB에서 시를 검색한 뒤, 작품별 Midjourney 이미지 프롬프트를 생성하는 CLI 도구입니다.

공통 스타일 요구사항은 항상 포함됩니다.
- `수묵화(문인화) 느낌`
- `단순한 색 사용`
- `시적인 느낌`

## 1) 준비

OpenAI API 키를 환경변수에 설정합니다.

```bash
export OPENAI_API_KEY="YOUR_API_KEY"
```

선택 사항:

```bash
export OPENAI_MODEL="gpt-4.1"
```

## 2) 기본 사용

기본 작품 DB는 `public/index/poems.full.json` 입니다.

```bash
node tools/midjourney_prompt_generator.js --query "정야사" --limit 3
```

`titleId`로 정확히 선택:

```bash
node tools/midjourney_prompt_generator.js --title-id C14,C27 --out output/mj_prompts.json
```

320편 일괄 생성(배치 호출):

```bash
OPENAI_API_KEY=... node tools/midjourney_prompt_generator.js \
  --all \
  --batch-size 20 \
  --out output/mj_prompts_all.json
```

중단 후 이어서 생성:

```bash
OPENAI_API_KEY=... node tools/midjourney_prompt_generator.js \
  --all \
  --batch-size 20 \
  --out output/mj_prompts_all.json \
  --resume-from output/mj_prompts_all.json
```

목록만 조회(`API 호출 없음`):

```bash
node tools/midjourney_prompt_generator.js --query "달 강" --limit 10 --list
```

드라이런(`API 호출 없음`, 템플릿 프롬프트 생성):

```bash
node tools/midjourney_prompt_generator.js --query "봄" --limit 2 --dry-run
```

## 3) 옵션

- `--db <path>`: 작품 DB 경로
- `--query <text>`: 제목/시인/본문 검색
- `--title-id <id,...>`: `titleId` 정확 매칭(콤마 구분)
- `--limit <n>`: 생성 개수 제한 (기본 5)
- `--all`: 매칭된 전체 작품 처리
- `--batch-size <n>`: 대량 생성 시 API 1회 호출당 작품 수
- `--resume-from <path>`: 기존 JSON 결과를 읽고 누락분만 이어서 생성
- `--model <name>`: 호출 모델 지정
- `--temperature <n>`: 샘플링 온도(0~2)
- `--aspect-ratio <w:h>`: 기본 비율(`--ar`)
- `--out <path>`: 결과 JSON 저장
- `--list`: 목록만 출력
- `--dry-run`: OpenAI API 호출 없이 샘플 생성
- `--help`: 도움말

## 4) 결과 형식

`--out` 사용 시 아래 형태로 저장됩니다.

```json
{
  "generatedAt": "2026-02-14T00:00:00.000Z",
  "dbPath": "public/index/poems.full.json",
  "model": "gpt-4.1-mini",
  "results": [
    {
      "titleId": "C14",
      "sceneSummaryKo": "...",
      "midjourneyPrompt": "... --ar 3:2 --stylize 200 --no ...",
      "midjourneyPromptKo": "...",
      "negativePrompt": "...",
      "aspectRatio": "3:2"
    }
  ]
}
```

## 5) 주의

- API 키는 코드에 하드코딩하지 말고 환경변수로만 관리하세요.
- `--all`은 작품 수가 많으면 비용/시간이 크게 증가합니다.
- 결과 프롬프트는 자동 생성이므로, 최종 사용 전 1회 검수하는 것을 권장합니다.

## 6) 브라우저 UI (프로토타입)

CLI 대신 브라우저에서 선택/생성/내보내기를 하고 싶다면:

- `tools/midjourney_prompt_generator.html`
- `tools/midjourney_prompt_generator_ui.js`

구성:
- 좌측: 작품 DB 로드 + 검색/선택
- 중앙: API 키/모델/비율/드라이런 설정 + 생성 + 결과/이미지 큐

주의:
- UI는 API 키를 브라우저 메모리에서 직접 사용합니다(서버 프록시 없음).
- 실서비스 목적이면 백엔드 프록시(서버에서 API 호출)로 전환하는 것을 권장합니다.

추가 기능:
- 생성 결과 카드에 영문/한글 프롬프트가 함께 표시됩니다.
- 한글 수정 후 `한글확정→영문반영`으로 영문 프롬프트를 재생성할 수 있습니다.
- 카드별 비율 선택(`--ar`)이 최종 영문 프롬프트에 반영됩니다.
- `확정+복사+Midjourney` 버튼으로 순차 실행(반영→복사→탭 열기) 가능합니다.
- 이미지 큐(최대 5개)에서 붙여넣기/파일 추가 시 `작품코드.jpg`로 자동 저장됩니다.
- 저장 이미지는 ZIP/manifest로 내보낼 수 있습니다.
- API 키 입력창에 `보기/숨기기`, `브라우저 저장`, `저장키 삭제`가 있습니다.
- 우측 미리보기 컬럼에서 썸네일 + 작품코드 + 시제목 매칭 상태를 확인할 수 있습니다.
- `프롬프트 JSON 불러오기`로 대량 생성한 catalog를 로드한 뒤, 작품 선택 시 저장 프롬프트를 자동 반영할 수 있습니다.
- `기존 이미지 폴더 불러오기`로 이미 있는 그림 파일(파일명=작품코드)을 썸네일/OK 상태로 한 번에 반영할 수 있습니다.
