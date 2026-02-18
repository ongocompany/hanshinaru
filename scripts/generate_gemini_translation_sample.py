#!/usr/bin/env python3
"""
Generate sample translation drafts for Tangshi poems with Gemini API.

Pipeline intent (single-pass):
- Poem body: poetic Korean translation
- Jipyeong: literal Korean translation
- Notes: 5-8 items for difficult/allusion terms
- Commentary: concise scholarly explanation

Default mode selects first N pending items from:
  docs/research/13_심층번역_작업큐_260216_CH.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import certifi
except Exception:  # pragma: no cover - optional dependency
    certifi = None

DEFAULT_POEMS_PATH = "public/index/poems.full.owned.json"
DEFAULT_QUEUE_PATH = "docs/research/13_심층번역_작업큐_260216_CH.csv"
DEFAULT_OUTPUT_DIR = "docs/research/samples"
DEFAULT_MODEL = "gemini-2.5-pro"

FIXED_EMPTY_JIPYEONG = "해당 수록본에는 별도의 집평 원문이 실려 있지 않다."

SYSTEM_PROMPT = """당신은 한문학 박사이며 당대 시가(唐詩) 전문 번역가다.
출력은 반드시 JSON만 반환한다.

절대 규칙:
1) 번역 입력은 오직 제공된 poemZh / jipyeongZh / 메타만 사용한다.
2) 기존 상용 번역 문체를 복제하지 않는다.
3) 시 번역은 한국어 문학역으로 작성하되, 원문 행 수를 보존한다.
4) 집평 번역은 직역 우선의 현대 한국어로 작성한다.
5) notesOwned는 5~8개로 작성한다.
6) notesOwned.head는 원문에 실제로 등장하는 핵심 어구를 우선 사용한다.
7) 출력 필드 외 텍스트, 마크다운, 코드펜스는 금지한다.
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate 5-poem Gemini translation sample")
    parser.add_argument("--poems-path", default=DEFAULT_POEMS_PATH)
    parser.add_argument("--queue-path", default=DEFAULT_QUEUE_PATH)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument(
        "--poem-nos",
        default="",
        help="Comma-separated poem numbers (e.g. 023,024,025). If set, queue is ignored.",
    )
    parser.add_argument("--temperature", type=float, default=0.4)
    parser.add_argument("--max-output-tokens", type=int, default=4096)
    parser.add_argument(
        "--ca-bundle",
        default="",
        help="Path to custom CA bundle PEM file. If omitted, certifi bundle is auto-used when available.",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable SSL certificate verification (temporary troubleshooting only).",
    )
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def normalize_poem_no(value: Any) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    digits = "".join(ch for ch in s if ch.isdigit())
    return digits.zfill(3) if digits else s


def text_value(value: Any) -> str:
    if isinstance(value, dict):
        if value.get("ko"):
            return str(value["ko"])
        if value.get("zh"):
            return str(value["zh"])
        if value:
            return str(next(iter(value.values())))
        return ""
    return str(value or "")


def load_poems(path: Path) -> dict[str, dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    poems = data if isinstance(data, list) else data.get("poems", [])
    result: dict[str, dict[str, Any]] = {}
    for poem in poems:
        no = normalize_poem_no(poem.get("poemNoStr") or poem.get("poemNo"))
        if no:
            result[no] = poem
    return result


def load_queue(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def choose_poem_numbers(args: argparse.Namespace, queue_rows: list[dict[str, str]]) -> list[str]:
    if args.poem_nos.strip():
        raw = [x.strip() for x in args.poem_nos.split(",") if x.strip()]
        return [normalize_poem_no(x) for x in raw]

    pending = [r for r in queue_rows if (r.get("status") or "").strip() == "pending"]
    chosen = pending[: max(0, args.count)]
    return [normalize_poem_no(r.get("poemNoStr")) for r in chosen]


def queue_lookup(queue_rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for row in queue_rows:
        no = normalize_poem_no(row.get("poemNoStr"))
        if no:
            out[no] = row
    return out


def build_user_prompt(no: str, poem: dict[str, Any], meta: dict[str, str]) -> str:
    title_ko = meta.get("titleKo") or text_value(poem.get("title"))
    poet_ko = meta.get("poetKo") or text_value(poem.get("poet"))
    poem_zh = (poem.get("poemZh") or "").strip()
    jipyeong_zh = (poem.get("jipyeongZh") or "").strip()
    poem_lines = [ln.strip() for ln in poem_zh.splitlines() if ln.strip()]

    schema = {
        "poemNoStr": "string",
        "titleKo": "string",
        "poetKo": "string",
        "translationKoPoetic": "string (원문 행 수와 동일한 줄 수, 줄바꿈 유지)",
        "jipyeongKoLiteral": "string (집평 원문 직역. 집평 원문이 비어 있으면 고정문장 사용)",
        "notesOwned": [
            {"head": "string", "body": "string"},
            {"head": "string", "body": "string"},
            {"head": "string", "body": "string"},
            {"head": "string", "body": "string"},
            {"head": "string", "body": "string"},
        ],
        "commentaryKo": "string (3~6문장, 작품 정서/구도/핵심 이미지 해설)",
    }

    return (
        "아래 정보를 바탕으로 번역 산출물을 JSON으로 생성하라.\n\n"
        f"- poemNoStr: {no}\n"
        f"- titleKo: {title_ko}\n"
        f"- poetKo: {poet_ko}\n"
        f"- poemZh line count: {len(poem_lines)}\n"
        f"- poemZh:\n{poem_zh}\n\n"
        f"- jipyeongZh:\n{jipyeong_zh if jipyeong_zh else '(없음)'}\n\n"
        f"- jipyeongZh가 비어 있으면 jipyeongKoLiteral은 반드시 \"{FIXED_EMPTY_JIPYEONG}\" 사용.\n"
        "- notesOwned는 한국 학생이 헷갈리는 고유명사/전고/고어를 우선 선정.\n"
        "- notesOwned.head는 가능하면 원문 표기를 그대로 사용.\n"
        "- 시 번역은 과장하지 말고 원의미 충실 + 한국어 시어체 리듬 유지.\n"
        "- 반드시 아래 JSON 스키마 키 이름을 그대로 사용.\n\n"
        f"JSON_SCHEMA_EXAMPLE:\n{json.dumps(schema, ensure_ascii=False, indent=2)}"
    )


def get_api_key() -> str:
    for name in ("AI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"):
        value = os.getenv(name)
        if value:
            return value
    return ""


def build_ssl_context(*, ca_bundle: str, insecure: bool) -> tuple[ssl.SSLContext, str]:
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx, "insecure(no-verify)"

    # 1) explicit cli path
    if ca_bundle.strip():
        ctx = ssl.create_default_context(cafile=ca_bundle.strip())
        return ctx, f"custom:{ca_bundle.strip()}"

    # 2) env override
    env_cafile = (os.getenv("SSL_CERT_FILE") or "").strip()
    if env_cafile:
        ctx = ssl.create_default_context(cafile=env_cafile)
        return ctx, f"env:SSL_CERT_FILE={env_cafile}"

    # 3) certifi bundle (most stable across local Python installs)
    if certifi is not None:
        cafile = certifi.where()
        ctx = ssl.create_default_context(cafile=cafile)
        return ctx, f"certifi:{cafile}"

    # 4) fallback to system default
    return ssl.create_default_context(), "system-default"


def extract_json(text: str) -> dict[str, Any]:
    s = (text or "").strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        start = s.find("{")
        end = s.rfind("}")
        if start >= 0 and end > start:
            return json.loads(s[start : end + 1])
        raise


def call_gemini(
    *,
    api_key: str,
    model: str,
    user_prompt: str,
    temperature: float,
    max_output_tokens: int,
    ssl_context: ssl.SSLContext,
) -> dict[str, Any]:
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{urllib.parse.quote(model)}:generateContent?key={urllib.parse.quote(api_key)}"
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180, context=ssl_context) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        detail = str(e)
        if "CERTIFICATE_VERIFY_FAILED" in detail:
            hint = (
                "SSL verify failed. Try --ca-bundle /path/to/cacert.pem or set "
                "SSL_CERT_FILE. Temporary test only: --insecure."
            )
            raise RuntimeError(f"Gemini API network error: {e} | hint: {hint}") from e
        raise RuntimeError(f"Gemini API network error: {e}") from e

    obj = json.loads(raw)
    candidates = obj.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"No candidates in Gemini response: {raw[:500]}")
    parts = ((candidates[0].get("content") or {}).get("parts")) or []
    text = "".join(str(p.get("text") or "") for p in parts)
    if not text.strip():
        raise RuntimeError(f"No text payload in Gemini response: {raw[:500]}")
    return extract_json(text)


def write_markdown(output_path: Path, samples: list[dict[str, Any]], dry_run: bool) -> None:
    lines: list[str] = []
    failed = sum(1 for s in samples if s.get("error"))
    succeeded = len(samples) - failed
    lines.append("# Gemini 번역 샘플")
    lines.append("")
    lines.append(f"- 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"- 샘플 개수: {len(samples)}")
    lines.append(f"- 모드: {'dry-run' if dry_run else 'live'}")
    if not dry_run:
        lines.append(f"- 성공: {succeeded}")
        lines.append(f"- 실패: {failed}")
    lines.append("")

    for item in samples:
        lines.append(f"## {item['poemNoStr']} {item.get('titleKo','')}")
        lines.append("")
        lines.append(f"- 시인: {item.get('poetKo','')}")
        if dry_run:
            lines.append("- 상태: prompt 준비 완료 (API 미호출)")
            lines.append("")
            continue

        if item.get("error"):
            lines.append("- 상태: 실패")
            lines.append(f"- 오류: `{item.get('error')}`")
            lines.append("")
            continue

        lines.append("### 시 본문 문학역")
        lines.append(item.get("translationKoPoetic", "").strip())
        lines.append("")
        lines.append("### 집평 직역")
        lines.append(item.get("jipyeongKoLiteral", "").strip())
        lines.append("")
        lines.append("### 주석")
        notes = item.get("notesOwned") or []
        if not notes:
            lines.append("(생성된 주석 없음)")
        for idx, note in enumerate(notes, start=1):
            head = str(note.get("head") or "").strip()
            body = str(note.get("body") or "").strip()
            lines.append(f"{idx}. **{head}**: {body}")
        lines.append("")
        lines.append("### 해설")
        lines.append(item.get("commentaryKo", "").strip())
        lines.append("")

    output_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    poems_path = Path(args.poems_path)
    queue_path = Path(args.queue_path)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not poems_path.exists():
        raise SystemExit(f"[ERROR] Missing poems file: {poems_path}")
    if not queue_path.exists():
        raise SystemExit(f"[ERROR] Missing queue file: {queue_path}")

    poems_by_no = load_poems(poems_path)
    queue_rows = load_queue(queue_path)
    queue_by_no = queue_lookup(queue_rows)
    poem_nos = choose_poem_numbers(args, queue_rows)
    if not poem_nos:
        raise SystemExit("[ERROR] No target poems selected.")

    api_key = get_api_key()
    if not args.dry_run and not api_key:
        raise SystemExit(
            "[ERROR] Gemini API key not found. Set one of AI_API_KEY / GEMINI_API_KEY / GOOGLE_API_KEY."
        )

    ssl_context, ssl_source = build_ssl_context(ca_bundle=args.ca_bundle, insecure=args.insecure)

    selected_samples: list[dict[str, Any]] = []
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    print(f"[INFO] selected poems: {','.join(poem_nos)}")
    print(f"[INFO] mode: {'dry-run' if args.dry_run else 'live'}")
    print(f"[INFO] model: {args.model}")
    print(f"[INFO] ssl trust: {ssl_source}")

    for idx, no in enumerate(poem_nos, start=1):
        poem = poems_by_no.get(no)
        if poem is None:
            print(f"[{idx}/{len(poem_nos)}] {no} SKIP: poem not found")
            continue
        queue_meta = queue_by_no.get(no, {})
        title_ko = (queue_meta.get("titleKo") or "").strip() or text_value(poem.get("title"))
        poet_ko = (queue_meta.get("poetKo") or "").strip() or text_value(poem.get("poet"))
        prompt = build_user_prompt(no, poem, queue_meta)

        record: dict[str, Any] = {
            "poemNoStr": no,
            "titleKo": title_ko,
            "poetKo": poet_ko,
            "prompt": prompt,
        }

        if args.dry_run:
            selected_samples.append(record)
            print(f"[{idx}/{len(poem_nos)}] {no} READY")
            continue

        try:
            generated = call_gemini(
                api_key=api_key,
                model=args.model,
                user_prompt=prompt,
                temperature=args.temperature,
                max_output_tokens=args.max_output_tokens,
                ssl_context=ssl_context,
            )
            generated["poemNoStr"] = no
            generated["titleKo"] = generated.get("titleKo") or title_ko
            generated["poetKo"] = generated.get("poetKo") or poet_ko
            generated["prompt"] = prompt
            selected_samples.append(generated)
            print(f"[{idx}/{len(poem_nos)}] {no} DONE")
        except Exception as exc:  # noqa: BLE001
            record["error"] = str(exc)
            selected_samples.append(record)
            print(f"[{idx}/{len(poem_nos)}] {no} FAIL: {exc}")

    json_path = output_dir / f"gemini_translation_sample_{ts}.json"
    md_path = output_dir / f"gemini_translation_sample_{ts}.md"
    latest_json_path = output_dir / "gemini_translation_sample_latest.json"
    latest_md_path = output_dir / "gemini_translation_sample_latest.md"

    payload = {
        "generatedAt": ts,
        "mode": "dry-run" if args.dry_run else "live",
        "model": args.model,
        "poemsPath": str(poems_path),
        "queuePath": str(queue_path),
        "countRequested": len(poem_nos),
        "selectedPoemNos": poem_nos,
        "samples": selected_samples,
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    latest_json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(md_path, selected_samples, args.dry_run)
    write_markdown(latest_md_path, selected_samples, args.dry_run)

    print(
        f"[SUMMARY] json={json_path} md={md_path} "
        f"latest_json={latest_json_path} latest_md={latest_md_path} "
        f"samples={len(selected_samples)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
