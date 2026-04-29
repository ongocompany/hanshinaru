#!/usr/bin/env python3
import argparse
import bz2
import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import quote


NS = "{http://www.mediawiki.org/xml/export-0.11/}"


def main():
    parser = argparse.ArgumentParser(
        description="Extract Wikisource dump pages for manifest lookup candidates."
    )
    parser.add_argument("--dump", required=True, help="Path to zhwikisource pages-articles XML bz2 dump")
    parser.add_argument(
        "--manifest",
        default="docs/spec/cn-pre-tang-whole-corpus-manifest.v1.json",
        help="Manifest JSON with volume sourceLookupCandidates",
    )
    parser.add_argument("--out", required=True, help="Output raw pages JSON")
    parser.add_argument(
        "--lookup-status",
        default="first-tranche",
        help="Only extract manifest volumes with this lookupStatus",
    )
    args = parser.parse_args()

    manifest = read_json(args.manifest)
    selected_volumes = [
        volume for volume in manifest["volumes"] if volume.get("lookupStatus") == args.lookup_status
    ]
    lookup_items = build_lookup_items(selected_volumes)
    by_title = {item["title"]: item for item in lookup_items}
    remaining = set(by_title.keys())
    pages = []

    with bz2.open(args.dump, "rb") as handle:
        context = ET.iterparse(handle, events=("end",))
        for _, elem in context:
            if elem.tag != f"{NS}page":
                continue
            title = text_of(elem, f"{NS}title")
            if title in remaining:
                lookup_item = by_title[title]
                text = text_of(elem, f"{NS}revision/{NS}text")
                pages.append(
                    {
                        **lookup_item,
                        "sourceUrl": f"https://zh.wikisource.org/wiki/{quote_wiki_title(title)}",
                        "fetchStatus": "ok",
                        "dumpTitle": title,
                        "dumpTextBytes": len(text.encode("utf-8")),
                        "wikitext": text,
                    }
                )
                remaining.remove(title)
                if not remaining:
                    elem.clear()
                    break
            elem.clear()

    for title in sorted(remaining):
        lookup_item = by_title[title]
        pages.append(
            {
                **lookup_item,
                "sourceUrl": f"https://zh.wikisource.org/wiki/{quote_wiki_title(title)}",
                "fetchStatus": "missing-in-dump",
                "error": "exact title not found in dump",
                "wikitext": "",
            }
        )

    doc = {
        "version": manifest["version"],
        "batchId": "cn-pre-tang-whole-corpus-manifest-dump-pages",
        "source": args.manifest,
        "dump": args.dump,
        "selection": {
            "lookupStatus": args.lookup_status,
            "volumes": len(selected_volumes),
            "lookupTitles": len(lookup_items),
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "selectedVolumes": len(selected_volumes),
            "lookupTitles": len(lookup_items),
            "fetchedOk": sum(1 for page in pages if page["fetchStatus"] == "ok"),
            "missing": sum(1 for page in pages if page["fetchStatus"] != "ok"),
            "byEra": count_by(pages, lambda page: page.get("eraSlug")),
        },
        "pages": sorted(pages, key=lambda page: (page["volumeId"], page["lookupTitle"])),
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as out:
        json.dump(doc, out, ensure_ascii=False, indent=2)
        out.write("\n")
    print(json.dumps(doc["summary"], ensure_ascii=False, indent=2))


def build_lookup_items(volumes):
    lookup_items = []
    for volume in volumes:
        for candidate in volume.get("sourceLookupCandidates", []):
            if candidate.get("status") != "needs-dump-lookup":
                continue
            lookup_items.append(
                {
                    "volumeId": volume["volumeId"],
                    "sourceWorkTitleZh": volume["sourceWorkTitleZh"],
                    "eraSlug": volume["eraSlug"],
                    "eraNameZh": volume["eraNameZh"],
                    "displayEraZh": volume["displayEraZh"],
                    "collectionFamily": volume["collectionFamily"],
                    "volumeNumberWithinEra": volume["volumeNumberWithinEra"],
                    "volumeTitleZh": volume["volumeTitleZh"],
                    "firstPassPolicy": volume["firstPassPolicy"],
                    "lookupSource": candidate["source"],
                    "lookupTitle": candidate["title"],
                    "title": candidate["title"],
                }
            )
    return lookup_items


def read_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def text_of(elem, path):
    found = elem.find(path)
    return found.text if found is not None and found.text is not None else ""


def quote_wiki_title(title):
    return quote(title.replace(" ", "_"), safe="/:_()")


def count_by(items, selector):
    counts = {}
    for item in items:
        key = selector(item) or "(none)"
        counts[key] = counts.get(key, 0) + 1
    return counts


if __name__ == "__main__":
    main()
