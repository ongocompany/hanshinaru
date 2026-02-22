#!/usr/bin/env python3
"""
집평 누락 보완 스크립트 — Qwen API 호출

사전 준비:
  1. node scripts/fix_jipyeong.js --generate  (요청 JSON 생성)
  2. export DASHSCOPE_API_KEY=sk-xxxxx

사용법:
  python scripts/fix_jipyeong.py                  # 전체 95편 실행
  python scripts/fix_jipyeong.py --dry-run         # API 호출 없이 확인만
  python scripts/fix_jipyeong.py --start 0 --end 9 # 0~9번째 요청만 (10편)
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

try:
    import certifi
except Exception:
    certifi = None

REQUESTS_PATH = "docs/research/qwen_translations/jipyeong_fix_requests.json"
OUTPUT_DIR = "docs/research/qwen_translations"
MODEL = "qwen-plus-latest"
BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

SYSTEM_PROMPT_TRANSLATE = """\
너는 중국고전시문학 박사이고 한국문학박사이다.
사용자가 제공하는 한자 집평 원문을 한국어로 번역해 주세요.

[번역 규칙]
- 학술 스타일 평서문으로 작성한다.
- 존대말, 경어체 사용 금지. 평서문으로 작성한다.
- 한국의 대학생 정도 되는 사람들이 읽고 이해할 만한 수준의 용어를 사용한다.
- 비평가 이름, 저서명은 한자를 병기한다.
- 반드시 대한민국 표준어를 사용한다.
"""

SYSTEM_PROMPT_REGENERATE = """\
너는 중국고전시문학 박사이고 한국문학박사이다.
사용자가 제공하는 시에 대해 후대 유명 비평가들의 집평(集評)을 찾아서,
한자 원문과 한국어 번역을 한 세트로 출력해 주세요.

[규칙]
- 집평 원문은 실제 존재하는 비평서에서 인용한다. 출처(비평가명, 저서명)를 반드시 밝힌다.
- 유명하고 권위 있는 비평을 우선 선택한다 (예: 심덕잠《당시별재집》, 왕부지《당시평선》, 고보영《당송시거요》 등).
- 한국어 번역은 학술 스타일 평서문으로, 경어체 사용 금지.
- 반드시 대한민국 표준어를 사용한다.
- 한국의 대학생 정도 되는 사람들이 읽고 이해할 만한 수준의 용어를 사용한다.
"""


def build_ssl_context(*, insecure: bool) -> ssl.SSLContext:
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    env_cafile = (os.getenv("SSL_CERT_FILE") or "").strip()
    if env_cafile:
        return ssl.create_default_context(cafile=env_cafile)
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()


def get_api_key() -> str:
    for name in ("DASHSCOPE_API_KEY", "QWEN_API_KEY"):
        val = os.getenv(name)
        if val:
            return val
    return ""


def call_qwen(
    api_key: str, model: str, system_prompt: str, user_prompt: str,
    ssl_context: ssl.SSLContext, temperature: float = 0.3, max_tokens: int = 4096,
) -> tuple[str, dict]:
    endpoint = f"{BASE_URL.rstrip('/')}/chat/completions"
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
        endpoint, data=body,
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
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e

    obj = json.loads(raw)
    choices = obj.get("choices") or []
    if not choices:
        raise RuntimeError(f"No choices: {raw[:300]}")
    content = (choices[0].get("message") or {}).get("content", "")
    return content.strip(), obj.get("usage", {})


def main() -> int:
    parser = argparse.ArgumentParser(description="집평 보완 — Qwen API")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--insecure", action="store_true")
    parser.add_argument("--start", type=int, default=0, help="시작 인덱스 (0-based)")
    parser.add_argument("--end", type=int, default=-1, help="끝 인덱스 (inclusive, -1=전체)")
    parser.add_argument("--sleep", type=float, default=1.5)
    parser.add_argument("--retries", type=int, default=3)
    args = parser.parse_args()

    req_path = Path(REQUESTS_PATH)
    if not req_path.exists():
        print(f"[ERROR] {REQUESTS_PATH} 없음. 먼저 node scripts/fix_jipyeong.js --generate 실행", file=sys.stderr)
        return 1

    data = json.loads(req_path.read_text("utf-8"))
    requests_list = data["requests"]

    end_idx = args.end if args.end >= 0 else len(requests_list) - 1
    targets = requests_list[args.start:end_idx + 1]

    api_key = get_api_key()
    if not args.dry_run and not api_key:
        print("[ERROR] API 키 없음. DASHSCOPE_API_KEY 환경변수 설정 필요", file=sys.stderr)
        return 1

    ssl_ctx = build_ssl_context(insecure=args.insecure)

    print(f"[INFO] 대상: {len(targets)}편 (인덱스 {args.start}~{end_idx})")
    print(f"[INFO] 모드: {'dry-run' if args.dry_run else 'live'}")
    print()

    results = []
    total_in = 0
    total_out = 0
    fails = 0

    for idx, item in enumerate(targets):
        no = item["poemNoStr"]
        title = item["title"]
        req_type = item["type"]
        label = "번역" if req_type == "translate_jipyeong" else "원문+번역 재생성"

        if args.dry_run:
            print(f"[{idx+1}/{len(targets)}] {no} {title} — {label} READY")
            results.append({"poemNoStr": no, "title": title, "type": req_type, "dry_run": True})
            continue

        sys_prompt = SYSTEM_PROMPT_TRANSLATE if req_type == "translate_jipyeong" else SYSTEM_PROMPT_REGENERATE
        print(f"[{idx+1}/{len(targets)}] {no} {title} — {label}...", end=" ", flush=True)

        ok = False
        for attempt in range(1, args.retries + 1):
            try:
                content, usage = call_qwen(
                    api_key, MODEL, sys_prompt, item["prompt"], ssl_ctx
                )
                inp = usage.get("prompt_tokens", 0)
                out = usage.get("completion_tokens", 0)
                total_in += inp
                total_out += out
                print(f"OK ({inp}+{out}t)")
                results.append({
                    "poemNoStr": no, "title": title, "type": req_type,
                    "response": content, "usage": usage,
                })
                ok = True
                break
            except Exception as e:
                if attempt < args.retries:
                    print(f"재시도 {attempt}...", end=" ", flush=True)
                    time.sleep(3)
                else:
                    print(f"FAIL: {e}")
                    fails += 1
                    results.append({
                        "poemNoStr": no, "title": title, "type": req_type,
                        "error": str(e),
                    })

        if ok and idx < len(targets) - 1:
            time.sleep(args.sleep)

    # 저장
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path(OUTPUT_DIR)
    out_path = out_dir / f"jipyeong_fix_{ts}.json"

    out_data = {
        "generatedAt": ts,
        "mode": "dry-run" if args.dry_run else "live",
        "model": MODEL,
        "totalInputTokens": total_in,
        "totalOutputTokens": total_out,
        "count": len(results),
        "failCount": fails,
        "results": results,
    }
    out_path.write_text(json.dumps(out_data, ensure_ascii=False, indent=2), "utf-8")

    print()
    print(f"[완료] {out_path}")
    print(f"[완료] {len(results)}편 (성공 {len(results)-fails} / 실패 {fails})")
    if total_in > 0:
        cost = total_in / 1e6 * 0.40 + total_out / 1e6 * 1.20
        print(f"[완료] 토큰: {total_in:,}+{total_out:,} / 예상 비용: ${cost:.4f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
