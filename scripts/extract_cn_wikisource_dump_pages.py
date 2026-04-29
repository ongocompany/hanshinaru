#!/usr/bin/env python3
import argparse
import bz2
import json
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone


NS = "{http://www.mediawiki.org/xml/export-0.11/}"


def main():
    parser = argparse.ArgumentParser(
        description="Extract selected zhwikisource pages from a Wikimedia XML bz2 dump."
    )
    parser.add_argument("--dump", required=True, help="Path to zhwikisource pages-articles XML bz2 dump")
    parser.add_argument("--candidates", required=True, help="cn-non-tang category candidate index JSON")
    parser.add_argument("--out", required=True, help="Output raw pages JSON")
    parser.add_argument("--limit", type=int, default=0, help="Limit selected author-parentheses candidates")
    parser.add_argument("--era", default=None, help="Optional eraSlug filter")
    args = parser.parse_args()

    candidates_doc = read_json(args.candidates)
    selected = [
        item for item in candidates_doc["candidates"]
        if item.get("priority") == "author-parentheses-likely"
        and (args.era is None or item.get("eraSlug") == args.era)
    ]
    if args.limit:
        selected = selected[:args.limit]

    by_title = {item["rawTitle"]: item for item in selected}
    remaining = set(by_title.keys())
    pages = []

    with bz2.open(args.dump, "rb") as handle:
        context = ET.iterparse(handle, events=("end",))
        for _, elem in context:
            if elem.tag != f"{NS}page":
                continue
            title = text_of(elem, f"{NS}title")
            if title in remaining:
                candidate = by_title[title]
                text = text_of(elem, f"{NS}revision/{NS}text")
                pages.append({
                    **candidate,
                    "sourceUrl": f"https://zh.wikisource.org/wiki/{quote_wiki_title(title)}",
                    "categoryTitle": category_title_for_era(candidate.get("eraSlug")),
                    "fetchStatus": "ok",
                    "dumpTitle": title,
                    "dumpTextBytes": len(text.encode("utf-8")),
                    "wikitext": text,
                })
                remaining.remove(title)
                if not remaining:
                    elem.clear()
                    break
            elem.clear()

    for title in sorted(remaining):
        candidate = by_title[title]
        pages.append({
            **candidate,
            "sourceUrl": f"https://zh.wikisource.org/wiki/{quote_wiki_title(title)}",
            "categoryTitle": category_title_for_era(candidate.get("eraSlug")),
            "fetchStatus": "missing-in-dump",
            "error": "exact title not found in dump",
            "wikitext": "",
        })

    doc = {
        "version": "2026-04-30.v1",
        "source": args.candidates,
        "dump": args.dump,
        "selection": {
            "priority": "author-parentheses-likely",
            "eraFilter": args.era,
            "limit": args.limit,
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "selected": len(selected),
            "fetchedOk": sum(1 for page in pages if page["fetchStatus"] == "ok"),
            "missing": sum(1 for page in pages if page["fetchStatus"] != "ok"),
            "byEra": count_by(pages, lambda page: page.get("eraSlug")),
        },
        "pages": pages,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as out:
        json.dump(doc, out, ensure_ascii=False, indent=2)
        out.write("\n")
    print(json.dumps(doc["summary"], ensure_ascii=False, indent=2))


def read_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def text_of(elem, path):
    found = elem.find(path)
    return found.text if found is not None and found.text is not None else ""


def quote_wiki_title(title):
    from urllib.parse import quote
    return quote(title.replace(" ", "_"), safe="/:_()")


def category_title_for_era(era_slug):
    return {
        "song": "Category:宋詩",
        "yuan": "Category:元詩",
        "ming": "Category:明詩",
        "qing": "Category:清詩",
    }.get(era_slug)


def count_by(items, selector):
    counts = {}
    for item in items:
        key = selector(item) or "(none)"
        counts[key] = counts.get(key, 0) + 1
    return counts


if __name__ == "__main__":
    main()
