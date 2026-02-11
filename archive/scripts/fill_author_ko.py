import json
import re
from collections import Counter, defaultdict

POEMS_PATH = "poems.compact.json"
AUTHORS_PATH = "db_author.json"
OUT_PATH = "db_author.with_ko.json"

def clean_zh(name: str) -> str:
    # 예: "張九齡[1]" -> "張九齡"
    if not name:
        return ""
    name = re.sub(r"\[.*?\]", "", name)      # [1] 같은 각주 제거
    name = re.sub(r"（.*?）", "", name)       # （...） 제거(혹시 있을 경우)
    name = re.sub(r"\(.*?\)", "", name)      # (...) 제거(혹시 있을 경우)
    return name.strip()

# 1) poems에서 zh->ko 후보를 수집 (동일 zh가 여러 ko로 나오면 빈도 최다를 채택)
with open(POEMS_PATH, "r", encoding="utf-8") as f:
    poems = json.load(f)

freq = defaultdict(Counter)  # zh_clean -> Counter({ko: n})
for p in poems:
    poet = p.get("poet") or {}
    zh = clean_zh(poet.get("zh", ""))
    ko = (poet.get("ko") or "").strip()
    if zh and ko:
        freq[zh][ko] += 1

best_map = {}
conflicts = {}
for zh, counter in freq.items():
    if not counter:
        continue
    best_ko, best_n = counter.most_common(1)[0]
    best_map[zh] = best_ko
    if len(counter) > 1:
        conflicts[zh] = dict(counter)

# 2) db_author의 authors[*].name.ko 채우기 (비어있는 것만)
with open(AUTHORS_PATH, "r", encoding="utf-8") as f:
    db = json.load(f)

authors = db.get("authors")
if not isinstance(authors, dict):
    raise ValueError("db_author.json의 authors가 dict 형태가 아닙니다. (예: {'C328': {...}})")

filled = 0
missing = []
for aid, a in authors.items():
    name = a.get("name") or {}
    zh = clean_zh(name.get("zh", ""))
    ko = (name.get("ko") or "").strip()

    if ko:  # 이미 있으면 스킵
        continue

    if zh and zh in best_map:
        name["ko"] = best_map[zh]
        a["name"] = name
        filled += 1
    else:
        missing.append((aid, zh))

# 3) 저장(원본 유지)
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f"완료: name.ko 채움 {filled}명")
print(f"매핑 충돌(동일 zh에 ko가 여러개): {len(conflicts)}건")
if conflicts:
    # 너무 길면 앞부분만 출력
    sample = list(conflicts.items())[:10]
    print("충돌 샘플(최대 10건):")
    for zh, c in sample:
        print(" -", zh, c)

print(f"매핑 못한 author: {len(missing)}명")
if missing:
    sample = missing[:20]
    print("미매핑 샘플(최대 20명):")
    for aid, zh in sample:
        print(" -", aid, zh)

print(f"출력 파일: {OUT_PATH}")
