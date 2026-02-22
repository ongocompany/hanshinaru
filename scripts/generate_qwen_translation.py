#!/usr/bin/env python3
"""
Generate Korean translations for Tangshi poems using Qwen API (DashScope).

Mirrors the user's proven manual workflow: Qwen acts as a classical Chinese
literature PhD + Korean literature PhD, producing scholarly markdown output
with literary poem translations, academic jipyeong, rich notes, and detailed
commentary in plain declarative style (no honorifics).

Usage:
  # Dry-run (no API call):
  python scripts/generate_qwen_translation.py --dry-run --poem-nos 001,006

  # Translate specific poems:
  python scripts/generate_qwen_translation.py --poem-nos 001,006

  # Translate a range:
  python scripts/generate_qwen_translation.py --start 1 --end 10

  # Translate all:
  python scripts/generate_qwen_translation.py --all
"""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import certifi
except Exception:
    certifi = None

# ──────────────────────────────────────────────────────────
# Defaults
# ──────────────────────────────────────────────────────────
DEFAULT_POEMS_PATH = "public/index/poems.full.json"
DEFAULT_OUTPUT_DIR = "docs/research/qwen_translations"
DEFAULT_MODEL = "qwen-plus-latest"
DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

SYSTEM_PROMPT = """\
너는 중국고전시문학 박사이고 한국문학박사이다. 지금 사용자를 도와 당시삼백수 번역 및 교재 작업중이다.

사용자가 시 번역을 요청하면 아래의 규칙을 항상 지킨다.

[번역 원칙]
- 시 본문은 문학성을 살려 번역한다. 시어체의 리듬, 도치, 압축을 적극 활용한다.
- 반드시 한국어 시어체 어미를 사용한다: ~네, ~구나, ~도다, ~랴, ~리, ~러니, ~더니 등. 산문투 어미(~다, ~이다, ~음, ~임)는 절대 사용하지 않는다.
- 각 행의 어미를 다양하게 변화시켜 시적 리듬감을 만든다. 같은 어미가 연속으로 반복되지 않도록 한다.
- 한국어로 번역하는 것보다 원래 한자어를 그대로 쓰는 편이 의미 전달에 더 용이하거나 고시(古詩)의 풍취를 살릴 때는 한자를 그대로 사용해도 좋다.
- 단, 시 번역에서 일상·산업 용어(봉제, 가동, 수리 등)는 피하고, 한국어 고유어나 시어를 우선 사용한다(예: 봉제→바느질, 저수지→연못).
- 반드시 대한민국 표준어를 사용한다. 조선어(북한말)·연변 조선족 한국어 어휘를 사용하지 않는다(예: 봉제→바느질, 로동→노동, 녀인→여인).
- 시어체 어미의 문법을 정확히 지킨다. "~다리", "~는다리" 같은 잘못된 어미를 만들지 않는다. 올바른 예: ~리(만나리, 그리우리), ~네(날아오네), ~구나(틀었구나), ~도다(되었도다), ~랴(탐내랴).
- 집평 부분은 학술 스타일로 번역한다.
- 한국의 대학생 정도 되는 사람들이 읽고 이해할 만한 수준의 용어를 사용한다.
- 주석은 고대어와 현대어가 달라서 이해하기 힘든 부분, 전고를 알아야 해석이 가능한 부분, 역사적 배경을 알아야 해석이 가능한 부분등에 달고, 시에서 핵심 시어가 되는 부분도 주석 처리한다.

[번역 스타일 예시]
아래는 감우(感遇) 번역의 좋은 예시이다. 이 문체와 어감을 참고하여 모든 시를 번역하라:

원문: 孤鴻海上來 / 池潢不敢顧 / 側見雙翠鳥 / 巢在三珠樹 / 矯矯珍木巓 / 得無金丸懼 / 美服患人指 / 高明逼神惡 / 今我遊冥冥 / 弋者何所慕
좋은 번역:
외로운 기러기 바다 위에서 날아오네
연못 물가 감히 돌아보지 못하네
곁에서 한 쌍의 물떼새 보았더니
삼주수 위에 둥지 틀었구나
높은 귀한 나무 꼭대기에서
금탄환을 두려워하지 않는가
아름다운 옷은 사람의 손가락질 걱정이고
높은 지혜는 신의 질투를 부르네
이제 나는 아득한 곳 유유하리
새 사냥꾼이 무엇을 탐내랴

[출력 형식]
각 시마다 아래 구조를 반드시 따른다. 반드시 마크다운 형태로 출력한다.

## {시번호}. {제목}

(원문)

(집평 원문 — 후대의 집평을 검색해서, 유명한 것 위주로)

### 번역
(시 본문 번역 — 행 구분 유지, 한국어 시어체 어미 필수)

(집평 번역 — 학술스타일 평서문, 경어체 사용 금지)

### 주석
1) ...
2) ...

### 해설
(핵심 정리 — 풍부하고 자세하게)

[작성 규칙]
- 원문의 의미를 임의로 추가/삭제하지 않는다.
- 원문에 오타나 줄바꿈 오류가 있어도 '당시삼백수'라는 책에 있는 해당시를 우선으로 하여 처리한다.
- 주석은 자유롭게 달며, 시 제목, 시 본문, 집평, 한국어 해석 어디든 주석이 필요한 부분에는 주석을 달아도 된다 (단 주석이 총 15개를 넘지 않도록 한다).
- 해설은 풍부하고 자세히 하여 시를 공부하고 고전문학을 공부하는 사람들에게 도움을 줄 내용으로 서술한다.
- 존대말, 경어체 사용 금지. 평서문으로 작성한다.
- 줄임말 사용 금지.
"""


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────
def build_ssl_context(*, insecure: bool) -> tuple[ssl.SSLContext, str]:
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx, "insecure(no-verify)"
    env_cafile = (os.getenv("SSL_CERT_FILE") or "").strip()
    if env_cafile:
        ctx = ssl.create_default_context(cafile=env_cafile)
        return ctx, f"env:SSL_CERT_FILE={env_cafile}"
    if certifi is not None:
        cafile = certifi.where()
        ctx = ssl.create_default_context(cafile=cafile)
        return ctx, f"certifi:{cafile}"
    return ssl.create_default_context(), "system-default"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Qwen 당시삼백수 번역기")
    p.add_argument("--poems-path", default=DEFAULT_POEMS_PATH)
    p.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--base-url", default=DEFAULT_BASE_URL)
    p.add_argument("--poem-nos", default="", help="Comma-separated: 001,006,042")
    p.add_argument("--start", type=int, default=0, help="Start poem number (inclusive)")
    p.add_argument("--end", type=int, default=0, help="End poem number (inclusive)")
    p.add_argument("--all", action="store_true", help="Translate all poems")
    p.add_argument("--temperature", type=float, default=0.3)
    p.add_argument("--max-tokens", type=int, default=8192)
    p.add_argument("--sleep", type=float, default=1.5, help="Seconds between API calls")
    p.add_argument("--insecure", action="store_true", help="Disable SSL verification")
    p.add_argument("--retries", type=int, default=3)
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def text_val(v: Any) -> str:
    if isinstance(v, dict):
        return str(v.get("zh") or v.get("ko") or next(iter(v.values()), ""))
    return str(v or "")


def text_val_ko(v: Any) -> str:
    if isinstance(v, dict):
        return str(v.get("ko") or v.get("zh") or next(iter(v.values()), ""))
    return str(v or "")


def norm_no(v: Any) -> str:
    s = str(v or "").strip()
    digits = "".join(c for c in s if c.isdigit())
    return digits.zfill(3) if digits else ""


def load_poems(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("poems", [])


def get_api_key() -> str:
    for name in ("DASHSCOPE_API_KEY", "QWEN_API_KEY"):
        val = os.getenv(name)
        if val:
            return val
    return ""


def build_user_prompt(poem: dict[str, Any]) -> str:
    """Build the user prompt providing poem data for Qwen to translate."""
    no = norm_no(poem.get("poemNoStr") or poem.get("poemNo"))
    title_zh = text_val(poem.get("title"))
    poet_zh = text_val(poem.get("poet"))
    poem_zh = (poem.get("poemZh") or "").strip()
    jipyeong_zh = (poem.get("jipyeongZh") or "").strip()
    category = poem.get("category", "")

    # Remove note markers like [1], [2] from poem text for cleaner input
    clean_poem = re.sub(r"\[\d+\]", "", poem_zh)

    prompt = f"아래 시를 번역해 주세요.\n\n"
    prompt += f"시 번호: {no}\n"
    prompt += f"시 제목: {title_zh}\n"
    prompt += f"시인 이름: {poet_zh}\n"
    prompt += f"시체(詩體): {category}\n\n"
    prompt += f"원문:\n{clean_poem}\n"

    if jipyeong_zh:
        prompt += f"\n집평 원문:\n{jipyeong_zh}\n"

    # Include existing notes as additional reference
    orig_notes = poem.get("notes") or []
    if orig_notes:
        prompt += "\n참고 주석 (기존 자료):\n"
        for n in orig_notes:
            head = n.get("head", "")
            text = n.get("text", "")
            if head and text:
                prompt += f"- {head}: {text}\n"

    return prompt


def call_qwen(
    *,
    api_key: str,
    base_url: str,
    model: str,
    user_prompt: str,
    system_prompt: str,
    temperature: float,
    max_tokens: int,
    ssl_context: ssl.SSLContext,
) -> tuple[str, dict]:
    """Call Qwen API and return (markdown_content, usage_dict)."""
    endpoint = f"{base_url.rstrip('/')}/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180, context=ssl_context) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Qwen API HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Qwen API network error: {e}") from e

    obj = json.loads(raw)
    choices = obj.get("choices") or []
    if not choices:
        raise RuntimeError(f"No choices in Qwen response: {raw[:500]}")

    content = (choices[0].get("message") or {}).get("content", "")
    if not content.strip():
        raise RuntimeError(f"Empty content in Qwen response: {raw[:500]}")

    usage = obj.get("usage", {})
    return content.strip(), usage


# ──────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────
def main() -> int:
    args = parse_args()
    poems_path = Path(args.poems_path)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not poems_path.exists():
        print(f"[ERROR] 파일 없음: {poems_path}", file=sys.stderr)
        return 1

    all_poems = load_poems(poems_path)
    poems_by_no: dict[str, dict[str, Any]] = {}
    for p in all_poems:
        no = norm_no(p.get("poemNoStr") or p.get("poemNo"))
        if no:
            poems_by_no[no] = p

    # Determine targets
    target_nos: list[str] = []
    if args.poem_nos.strip():
        target_nos = [norm_no(x) for x in args.poem_nos.split(",") if x.strip()]
    elif args.start and args.end:
        target_nos = [str(i).zfill(3) for i in range(args.start, args.end + 1)]
    elif args.all:
        target_nos = sorted(poems_by_no.keys())
    else:
        print("[ERROR] --poem-nos, --start/--end, 또는 --all 중 하나를 지정하세요.", file=sys.stderr)
        return 1

    api_key = get_api_key()
    if not args.dry_run and not api_key:
        print("[ERROR] API 키 없음. DASHSCOPE_API_KEY 환경변수를 설정하세요.", file=sys.stderr)
        return 1

    ssl_context, ssl_source = build_ssl_context(insecure=args.insecure)

    print(f"[INFO] 대상: {len(target_nos)}편 ({','.join(target_nos[:5])}{'...' if len(target_nos) > 5 else ''})")
    print(f"[INFO] 모델: {args.model}")
    print(f"[INFO] 모드: {'dry-run' if args.dry_run else 'live'}")
    print(f"[INFO] SSL: {ssl_source}")
    print(f"[INFO] max-tokens: {args.max_tokens}")
    print()

    md_parts: list[str] = []
    json_results: list[dict[str, Any]] = []
    total_input_tokens = 0
    total_output_tokens = 0
    fail_count = 0

    for idx, no in enumerate(target_nos, start=1):
        poem = poems_by_no.get(no)
        if poem is None:
            print(f"[{idx}/{len(target_nos)}] {no} SKIP: 시 데이터 없음")
            continue

        title_zh = text_val(poem.get("title"))
        title_ko = text_val_ko(poem.get("title"))
        poet_zh = text_val(poem.get("poet"))
        poet_ko = text_val_ko(poem.get("poet"))
        prompt = build_user_prompt(poem)

        if args.dry_run:
            print(f"[{idx}/{len(target_nos)}] {no} {title_zh} ({poet_zh}) — READY")
            json_results.append({
                "poemNoStr": no,
                "title": title_zh,
                "poet": poet_zh,
                "dry_run": True,
            })
            continue

        print(f"[{idx}/{len(target_nos)}] {no} {title_zh} ({poet_zh}) — 번역 중...", end=" ", flush=True)

        success = False
        for attempt in range(1, args.retries + 1):
            try:
                content, usage = call_qwen(
                    api_key=api_key,
                    base_url=args.base_url,
                    model=args.model,
                    user_prompt=prompt,
                    system_prompt=SYSTEM_PROMPT,
                    temperature=args.temperature,
                    max_tokens=args.max_tokens,
                    ssl_context=ssl_context,
                )
                inp_t = usage.get("prompt_tokens", 0)
                out_t = usage.get("completion_tokens", 0)
                total_input_tokens += inp_t
                total_output_tokens += out_t
                print(f"OK ({inp_t}+{out_t} tokens)")

                md_parts.append(content)
                json_results.append({
                    "poemNoStr": no,
                    "title": title_zh,
                    "poet": poet_zh,
                    "markdown": content,
                    "usage": usage,
                })
                success = True
                break
            except Exception as exc:
                if attempt < args.retries:
                    print(f"재시도 {attempt}/{args.retries}...", end=" ", flush=True)
                    time.sleep(3)
                else:
                    print(f"FAIL: {exc}")
                    fail_count += 1
                    json_results.append({
                        "poemNoStr": no,
                        "title": title_zh,
                        "poet": poet_zh,
                        "error": str(exc),
                    })

        if success and idx < len(target_nos):
            time.sleep(args.sleep)

    # Save
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = output_dir / f"qwen_translation_{ts}.json"
    md_path = output_dir / f"qwen_translation_{ts}.md"

    # Markdown: header + all results concatenated
    header = (
        f"# Qwen 당시삼백수 번역\n\n"
        f"- 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"- 모델: {args.model}\n"
        f"- 총 {len(json_results)}편 (성공 {len(json_results) - fail_count} / 실패 {fail_count})\n"
        f"- 토큰 합계: input {total_input_tokens:,} + output {total_output_tokens:,}\n\n"
        f"---\n\n"
    )
    md_content = header + "\n\n---\n\n".join(md_parts)
    md_path.write_text(md_content.strip() + "\n", encoding="utf-8")

    # JSON
    payload = {
        "generatedAt": ts,
        "mode": "dry-run" if args.dry_run else "live",
        "model": args.model,
        "totalInputTokens": total_input_tokens,
        "totalOutputTokens": total_output_tokens,
        "count": len(json_results),
        "results": json_results,
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print()
    print(f"[완료] Markdown: {md_path}")
    print(f"[완료] JSON: {json_path}")
    print(f"[완료] 총 {len(json_results)}편 (성공 {len(json_results) - fail_count} / 실패 {fail_count})")
    print(f"[완료] 토큰: input {total_input_tokens:,} + output {total_output_tokens:,}")

    if total_input_tokens > 0:
        cost_input = total_input_tokens / 1_000_000 * 0.40
        cost_output = total_output_tokens / 1_000_000 * 1.20
        print(f"[완료] 예상 비용: ${cost_input + cost_output:.4f} (input ${cost_input:.4f} + output ${cost_output:.4f})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
