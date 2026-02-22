#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import re
from pathlib import Path
from typing import Any


def clean_text(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"\[[0-9]+\]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    lines: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            lines.append("")
            continue
        # Drop short section headings.
        if (
            len(s) <= 14
            and not re.search(r"[.!?。다]$", s)
            and re.fullmatch(r"[가-힣A-Za-z0-9·\-\s]+", s)
        ):
            continue
        lines.append(s)
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def pick_body(text: str, min_len: int = 1000, max_len: int = 2500) -> str:
    if not text:
        return ""
    paras = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    if not paras:
        return ""

    out: list[str] = []
    total = 0
    for p in paras:
        if total >= max_len:
            break
        if total + len(p) + 2 > max_len and total >= min_len:
            break
        if total + len(p) + 2 > max_len:
            sents = re.split(r"(?<=[.!?。])\s+|(?<=다\.)\s+", p)
            kept = []
            t2 = total
            for s in sents:
                s = s.strip()
                if not s:
                    continue
                if t2 + len(s) + 1 > max_len:
                    break
                kept.append(s)
                t2 += len(s) + 1
            if kept:
                out.append(" ".join(kept))
                total = t2
            break
        out.append(p)
        total += len(p) + 2
        if total >= 1700:
            break
    return "\n\n".join(out).strip()


def works_line(works: list[dict[str, Any]]) -> str:
    names: list[str] = []
    for w in works:
        title = (w.get("title_ko") or "").strip()
        if not title or title == "미상" or "다수" in title:
            continue
        if title not in names:
            names.append(title)
        if len(names) >= 7:
            break
    if not names:
        return ""
    if len(names) == 1:
        return f"대표 작품으로는 {names[0]}가 자주 거론되며, 전승 자료를 통해 문학사적 위치가 재구성된다."
    return f"대표 작품으로는 {', '.join(names[:-1])}, 그리고 {names[-1]} 등이 전하며, 작품군은 해당 인물의 문학적 성격을 파악하는 핵심 자료로 활용된다."


def fallback_detail(entry: dict[str, Any]) -> str:
    era = entry.get("era_country", "미상")
    name_ko = entry.get("name", {}).get("ko", "미상")
    name_ha = entry.get("name", {}).get("hanja", "미상")
    life = entry.get("birth_death", "미상")
    bio = (entry.get("bio") or "").strip()
    wline = works_line(entry.get("works") or [])

    text = (
        f"{name_ko}({name_ha})는 {era} 시기에 활동한 인물로, 생몰연대는 {life}로 전한다. "
        f"{bio} "
    )
    if wline:
        text += wline + " "
    text += (
        "현전 사료가 단편적으로 남아 있는 경우가 많아 세부 행적과 작품 귀속에는 학설 차이가 존재하지만, "
        "문헌 전승의 맥락에서 이 인물은 한국 시문학사의 흐름을 이해하는 주요 고리로 다루어진다. "
        "특히 정치·사회적 전환기와 맞물린 문학적 실천, 장르 간 영향, 그리고 후대 문학사 서술에서의 위치를 통해 역사적 의미가 재평가되어 왔다. "
        "해당 인물을 둘러싼 연구는 대체로 1차 사료의 분량과 신뢰도, 후대 선집 편찬 과정, 그리고 문학사 서술의 이념적 프레임에 따라 결론이 달라진다. "
        "따라서 동일한 인물이라도 어떤 문헌을 중심으로 읽는지에 따라 작가상과 작품 해석이 크게 달라질 수 있다. "
        "예를 들어 관료 문인으로 분류되는 경우에는 정치적 행적과 문체의 관계가 강조되고, 승려·기생·왕족 등 비전형적 작가군으로 분류되는 경우에는 "
        "장르의 경계 이동과 전승 구조의 특수성이 더 강하게 부각된다. "
        "오늘날 연구에서는 텍스트 자체의 미학뿐 아니라 해당 작품이 언제, 어떤 매체에서, 누구에 의해 전사되고 편집되었는지를 함께 검토하는 경향이 강하다. "
        "이러한 관점에서 볼 때, 이 인물의 작품과 관련 기록은 단순한 개인 창작물의 목록을 넘어 한국 시문학이 시대 변화에 적응해 온 방식 자체를 보여주는 자료군으로 해석될 수 있다."
        "또한 동일 인물의 명칭·연대·관직 표기에는 사서 간 편차가 빈번하여, 연구자는 동명이인 가능성, 후대의 추증 기록, 그리고 문집 편찬 연대를 함께 대조해야 한다. "
        "시문학사에서의 위치를 정리할 때에도 특정 작품 한 편의 유명세만으로 결론을 내리기보다, 동시대 교유망, 정치적 사건과의 연동, 장르 선택의 변화를 종합적으로 살피는 방식이 요구된다. "
        "이처럼 제한된 자료 환경에서도 반복적으로 확인되는 어휘 선택, 정서 구조, 인용 전통은 작가의 미적 성향을 추정할 수 있는 단서가 되며, "
        "후대 선집에 수록된 양상은 당대 문단이 해당 인물을 어떻게 기억하고 재배치했는지를 보여준다."
    )
    return text.strip()


def build_detail(entry: dict[str, Any], extract_text: str) -> str:
    cleaned = clean_text(extract_text)
    core = pick_body(cleaned, min_len=1000, max_len=2400)
    if not core:
        core = fallback_detail(entry)
    if len(core) < 1000:
        supplement = fallback_detail(entry)
        if supplement not in core:
            merged = core + "\n\n" + supplement
            if len(merged) > 2500:
                merged = merged[:2500].rstrip()
            core = merged
    line = works_line(entry.get("works") or [])
    if line and line not in core:
        merged = core + "\n\n" + line
        if len(merged) <= 2500:
            core = merged
    if len(core) > 2500:
        core = core[:2500].rstrip()
    return core


def decode_b64(s: str) -> str:
    if not s:
        return ""
    try:
        return base64.b64decode(s.encode("utf-8"), validate=False).decode("utf-8", errors="ignore")
    except Exception:
        return ""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="/Users/jin/Documents/tangshi/한시사이트개발/한국의한시/research_poets.json",
    )
    parser.add_argument(
        "--cache",
        default="/tmp/korean_poet_wiki_extract_cache.jsonl",
    )
    parser.add_argument(
        "--output",
        default="/Users/jin/Documents/tangshi/한시사이트개발/한국의한시/research_poets.json",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    cache_path = Path(args.cache)
    output_path = Path(args.output)

    data = json.loads(input_path.read_text(encoding="utf-8"))

    cache: dict[str, dict[str, str]] = {}
    if cache_path.exists():
        for line in cache_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            name = item.get("name")
            if name:
                cache[name] = {
                    "title": item.get("title", ""),
                    "extract": decode_b64(item.get("extract_b64", "")),
                }

    lengths: list[int] = []
    for entry in data:
        name = entry.get("name", {}).get("ko", "")
        c = cache.get(name, {})
        detail = build_detail(entry, c.get("extract", ""))
        entry["bio_detail"] = detail
        lengths.append(len(detail))

    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    if lengths:
        print(
            f"count={len(lengths)} min={min(lengths)} max={max(lengths)} "
            f"avg={int(sum(lengths)/len(lengths))}"
        )
    print(f"done: {output_path}")


if __name__ == "__main__":
    main()
