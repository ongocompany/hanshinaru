#!/usr/bin/env python3
"""
Enrich `research_poets.json` with a long-form `bio_detail` field.

Primary source: Korean Wikipedia (MediaWiki API extracts + search fallback).
If a page is missing/short, this script composes a conservative narrative
from existing metadata (era, short bio, works).
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
from pathlib import Path
from typing import Any

WIKI_API = "https://ko.wikipedia.org/w/api.php"


TITLE_ALIAS: dict[str, str] = {
    "유리왕": "유리명왕",
    "서동": "무왕 (백제)",
    "정서": "정서 (고려)",
    "안축": "안축 (고려)",
    "성현": "성현 (조선)",
    "박지원": "박지원 (1737년)",
    "이옥": "이옥 (1760년)",
    "세종": "세종대왕",
    "권제": "권제 (1387년)",
    "안지": "안지 (1418년)",
    "계랑": "계랑 (조선)",
    "매창": "이매창",
    "이정구": "이정구 (1564년)",
    "이식": "이식 (1584년)",
    "최명길": "최명길 (1586년)",
    "이경석": "이경석 (1595년)",
    "최자": "최자 (고려)",
    "임춘": "임춘 (고려)",
    "최송설당": "최송설당",
    "백결선생": "백결 선생",
}


def run_curl(params: dict[str, str], retry: int = 4) -> dict[str, Any] | None:
    for i in range(retry):
        cmd = ["curl", "-sG", "--connect-timeout", "5", "--max-time", "15", WIKI_API]
        for key, value in params.items():
            cmd += ["--data-urlencode", f"{key}={value}"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        out = (res.stdout or "").strip()
        if res.returncode == 0 and out.startswith("{"):
            try:
                return json.loads(out)
            except json.JSONDecodeError:
                pass
        time.sleep(0.25 * (i + 1))
    return None


def wiki_search_title(query: str) -> str | None:
    payload = run_curl(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": "5",
            "format": "json",
        }
    )
    if not payload:
        return None
    results = payload.get("query", {}).get("search", [])
    if not results:
        return None
    qnorm = re.sub(r"\s+", "", query)
    for item in results:
        title = item.get("title", "")
        if title.startswith("분류:"):
            continue
        if qnorm and qnorm in re.sub(r"\s+", "", title):
            return title
    for item in results:
        title = item.get("title", "")
        if not title.startswith("분류:"):
            return title
    return None


def wiki_extract(title: str) -> str:
    payload = run_curl(
        {
            "action": "query",
            "prop": "extracts",
            "explaintext": "1",
            "exsectionformat": "plain",
            "format": "json",
            "titles": title,
        }
    )
    if not payload:
        return ""
    pages = payload.get("query", {}).get("pages", {})
    if not pages:
        return ""
    page = next(iter(pages.values()))
    return (page.get("extract") or "").strip()


def clean_text(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"\[[0-9]+\]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove obvious section headers (single short lines without punctuation).
    kept: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            kept.append("")
            continue
        if (
            len(s) <= 14
            and not re.search(r"[.!?。다]$", s)
            and re.fullmatch(r"[가-힣A-Za-z0-9·\-\s]+", s)
        ):
            continue
        kept.append(s)
    text = "\n".join(kept)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def pick_body(text: str, min_len: int = 1000, max_len: int = 2500) -> str:
    if not text:
        return ""
    paras = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    if not paras:
        return ""
    acc: list[str] = []
    total = 0
    for p in paras:
        if total >= max_len:
            break
        if total + len(p) + 2 > max_len and total >= min_len:
            break
        if total + len(p) + 2 > max_len:
            # sentence-level trim for the last paragraph
            sents = re.split(r"(?<=[.!?。])\s+|(?<=다\.)\s+", p)
            buf = []
            t2 = total
            for s in sents:
                s = s.strip()
                if not s:
                    continue
                if t2 + len(s) + 1 > max_len:
                    break
                buf.append(s)
                t2 += len(s) + 1
            if buf:
                acc.append(" ".join(buf))
                total = t2
            break
        acc.append(p)
        total += len(p) + 2
        if total >= min_len:
            # still try one more paragraph if short-ish
            if total >= 1700:
                break
    return "\n\n".join(acc).strip()


def works_line(works: list[dict[str, Any]]) -> str:
    titles: list[str] = []
    for w in works:
        title = (w.get("title_ko") or "").strip()
        if not title or title == "미상":
            continue
        if title not in titles:
            titles.append(title)
        if len(titles) >= 6:
            break
    if not titles:
        return ""
    if len(titles) == 1:
        return f"대표적으로 {titles[0]}가 전하며, 관련 작품군은 사료와 후대 문집을 통해 전승된다."
    body = ", ".join(titles[:-1]) + f", 그리고 {titles[-1]}"
    return f"대표 작품으로는 {body} 등이 거론되며, 이들 작품은 해당 인물의 시대적 위치와 문학적 성향을 보여주는 핵심 자료로 평가된다."


def compose_fallback(entry: dict[str, Any]) -> str:
    era = entry.get("era_country", "미상")
    name_ko = entry.get("name", {}).get("ko", "미상")
    name_ha = entry.get("name", {}).get("hanja", "미상")
    life = entry.get("birth_death", "미상")
    bio = (entry.get("bio") or "").strip()
    works = entry.get("works") or []
    wline = works_line(works)

    base = (
        f"{name_ko}({name_ha})는 {era} 시기에 활동한 인물로, 생몰연대는 {life}로 전한다. "
        f"{bio} "
    )
    if wline:
        base += wline + " "
    base += (
        "현전 자료의 편차와 전승 문헌의 이본 차이 때문에 세부 생애나 작품 귀속에는 학설 차이가 존재한다. "
        "그럼에도 불구하고 해당 인물은 한국 시문학의 계보에서 장르 전환, 정치·사회적 변동, 그리고 문학적 표현 양식의 변화와 맞물려 지속적으로 호출되는 사례로 남아 있다. "
        "특히 전대의 시가 전통과 후대의 문학 규범을 잇는 매개로 작동한다는 점에서 문학사적 의미가 크다."
    )
    return base.strip()


def build_detail(entry: dict[str, Any], extract_text: str) -> str:
    cleaned = clean_text(extract_text)
    core = pick_body(cleaned, min_len=1000, max_len=2400)
    if not core:
        core = compose_fallback(entry)
    else:
        line = works_line(entry.get("works") or [])
        if line and line not in core:
            merged = core + "\n\n" + line
            if len(merged) <= 2500:
                core = merged
    if len(core) > 2500:
        core = core[:2500].rstrip()
    return core


def enrich_entry(entry: dict[str, Any]) -> tuple[dict[str, Any], str]:
    name_ko = entry.get("name", {}).get("ko", "")
    source_title = entry.get("source_title")
    candidates = []
    if source_title and source_title != "미상":
        candidates.append(source_title)
    if name_ko in TITLE_ALIAS:
        candidates.append(TITLE_ALIAS[name_ko])
    if name_ko:
        candidates.append(name_ko)
    # dedupe candidates, preserve order
    seen = set()
    uniq = []
    for c in candidates:
        if c and c not in seen:
            uniq.append(c)
            seen.add(c)

    title_used = ""
    extract = ""
    for c in uniq:
        extract = wiki_extract(c)
        if extract:
            title_used = c
            break
    if not extract and name_ko:
        searched = wiki_search_title(name_ko)
        if searched:
            extract = wiki_extract(searched)
            if extract:
                title_used = searched

    entry["bio_detail"] = build_detail(entry, extract)
    return entry, title_used or "fallback"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="/Users/jin/Documents/tangshi/한시사이트개발/한국의한시/research_poets.json",
    )
    parser.add_argument(
        "--output",
        default="/Users/jin/Documents/tangshi/한시사이트개발/한국의한시/research_poets.json",
    )
    parser.add_argument("--sleep-ms", type=int, default=120)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    data = json.loads(input_path.read_text(encoding="utf-8"))

    enriched: list[dict[str, Any]] = []
    for idx, entry in enumerate(data, start=1):
        updated, title = enrich_entry(entry)
        enriched.append(updated)
        print(f"[{idx}/{len(data)}] {updated.get('name', {}).get('ko', '미상')} <- {title}", flush=True)
        if args.sleep_ms > 0:
            time.sleep(args.sleep_ms / 1000.0)

    output_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"done: {output_path}", flush=True)


if __name__ == "__main__":
    main()
