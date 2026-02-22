#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path("/Users/jin/Documents/tangshi")
RESEARCH_MD = ROOT / "한시사이트개발/한국의한시/research.md"
OUT_JSON = ROOT / "한시사이트개발/한국의한시/poem_korean.json"
OUT_REPORT = ROOT / "한시사이트개발/한국의한시/poem_korean_build_report.md"


# Title Hanja mapping (best-effort)
HANJA_TITLE_MAP: dict[str, str] = {
    "공후인": "箜篌引",
    "공무도하가": "公無渡河歌",
    "구지가": "龜旨歌",
    "황조가": "黃鳥歌",
    "여수장우중문시": "與隋將于仲文詩",
    "서동요": "薯童謠",
    "혜성가": "彗星歌",
    "풍요": "風謠",
    "원왕생가": "願往生歌",
    "모죽지랑가": "慕竹旨郎歌",
    "헌화가": "獻花歌",
    "원가": "怨歌",
    "도솔가": "兜率歌",
    "안민가": "安民歌",
    "제망매가": "祭亡妹歌",
    "찬기파랑가": "讚耆婆郎歌",
    "도천수관음가": "禱千手觀音歌",
    "우적가": "遇賊歌",
    "처용가": "處容歌",
    "보현십원가": "普賢十願歌",
    "예경제불가": "禮敬諸佛歌",
    "칭찬여래가": "稱讚如來歌",
    "광수공양가": "廣修供養歌",
    "참회업장가": "懺悔業障歌",
    "수희공덕가": "隨喜功德歌",
    "청전법륜가": "請轉法輪歌",
    "청불왕생가": "請佛往生歌",
    "상수불학가": "常隨佛學歌",
    "항순중생가": "恒順衆生歌",
    "보현회향가": "普賢廻向歌",
    "총결무진가": "總結無盡歌",
    "도이장가": "悼二將歌",
    "정과정곡": "鄭瓜亭曲",
    "가시리": "可是里",
    "서경별곡": "西京別曲",
    "청산별곡": "靑山別曲",
    "만전춘": "滿殿春",
    "쌍화점": "雙花店",
    "정석가": "鄭石歌",
    "동동": "動動",
    "사모곡": "思母曲",
    "이상곡": "履霜曲",
    "송인": "送人",
    "동명왕편": "東明王篇",
    "다정가": "多情歌",
    "소악부": "小樂府",
    "단심가": "丹心歌",
    "용비어천가": "龍飛御天歌",
    "월인천강지곡": "月印千江之曲",
    "상춘곡": "賞春曲",
    "절명시": "絶命詩",
    "어부단가": "漁父短歌",
    "어부가": "漁父歌",
    "면앙정가": "俛仰亭歌",
    "도산십이곡": "陶山十二曲",
    "고산구곡가": "高山九曲歌",
    "관동별곡": "關東別曲",
    "사미인곡": "思美人曲",
    "속미인곡": "續美人曲",
    "성산별곡": "星山別曲",
    "곡자": "哭子",
    "누항사": "陋巷詞",
    "선상탄": "船上歎",
    "태평사": "太平詞",
    "묏버들 가려 꺾어": "山柳折贈",
    "어부사시사": "漁父四時詞",
    "오우가": "五友歌",
    "탐진악부": "耽津樂府",
    "장부가": "丈夫歌",
    "촉규화": "蜀葵花",
    "추야우중": "秋夜雨中",
    "토황소격문": "討黃巢檄文",
    "秋夜雨中": "秋夜雨中",
    "江南女": "江南女",
    "蜀葵花": "蜀葵花",
    "檄黃巢書": "檄黃巢書",
}


# Manual seeds for key works with stable text tradition
MANUAL_TEXT: dict[str, dict[str, str]] = {
    "공무도하가": {
        "본문": "公無渡河\n公竟渡河\n墮河而死\n當奈公何",
        "번역문": "님아, 그 강을 건너지 마오.\n님은 끝내 강을 건너셨네.\n강에 빠져 돌아가시니,\n장차 님을 어찌하리오.",
    },
    "공후인": {
        "본문": "公無渡河\n公竟渡河\n墮河而死\n當奈公何",
        "번역문": "님아, 그 강을 건너지 마오.\n님은 끝내 강을 건너셨네.\n강에 빠져 돌아가시니,\n장차 님을 어찌하리오.",
    },
    "구지가": {
        "본문": "龜何龜何\n首其現也\n若不現也\n燔灼而喫也",
        "번역문": "거북아, 거북아.\n머리를 내놓아라.\n만약 내놓지 않으면\n구워 먹으리.",
    },
    "황조가": {
        "본문": "翩翩黃鳥\n雌雄相依\n念我之獨\n誰其與歸",
        "번역문": "펄펄 나는 저 꾀꼬리\n암수 서로 의지하는데\n외로운 이 몸 생각하니\n누구와 함께 돌아갈까",
    },
    "여수장우중문시": {
        "본문": "神策究天文\n妙算窮地理\n戰勝功旣高\n知足願云止",
        "번역문": "",
    },
    "송인": {
        "본문": "雨歇長堤草色多\n送君南浦動悲歌\n大同江水何時盡\n別淚年年添綠波",
        "번역문": "",
    },
    "추야우중": {
        "본문": "秋風唯苦吟\n世路少知音\n窓外三更雨\n燈前萬里心",
        "번역문": "",
    },
    "단심가": {
        "본문": "이 몸이 죽고 죽어 일백 번 고쳐 죽어\n백골이 진토되어 넋이라도 있고 없고\n임 향한 일편단심이야 가실 줄이 있으랴",
        "번역문": "",
    },
}


# Prefer stable aliases for page lookup
TITLE_ALIAS_MAP: dict[str, list[str]] = {
    "공후인(공무도하가)": ["공후인", "공무도하가"],
    "정과정곡": ["정과정곡", "정과정"],
    "도천수관음가": ["도천수관음가", "도천수대비가"],
    "예경제불가": ["보현십원가/예경제불가", "예경제불가"],
    "칭찬여래가": ["보현십원가/칭찬여래가", "칭찬여래가"],
    "광수공양가": ["보현십원가/광수공양가", "광수공양가"],
    "참회업장가": ["보현십원가/참회업장가", "참회업장가"],
    "수희공덕가": ["보현십원가/수희공덕가", "수희공덕가"],
    "청전법륜가": ["보현십원가/청전법륜가", "청전법륜가"],
    "청불왕생가": ["보현십원가/청불왕생가", "청불왕생가"],
    "상수불학가": ["보현십원가/상수불학가", "상수불학가"],
    "항순중생가": ["보현십원가/항순중생가", "항순중생가"],
    "보현회향가": ["보현십원가/보현회향가", "보현회향가"],
    "총결무진가": ["보현십원가/총결무진가", "총결무진가"],
    "어부단가": ["어부단가", "어부가"],
    "어부가": ["어부가", "어부단가"],
}


# Titles that are prose/collections in this dataset scope; keep conservative
NON_POEM_OR_COLLECTION: set[str] = {
    "가락국기",
    "대견훤기고려왕서",
    "토황소격문",
    "檄黃巢書",
    "보현십원가",
    "동명왕편",
    "소악부",
    "용비어천가",
    "월인천강지곡",
    "탐진악부",
}


NOISE_KEYWORDS: tuple[str, ...] = (
    "각주",
    "주석",
    "참고 문헌",
    "참고 자료",
    "외부 링크",
    "같이 보기",
    "라이선스",
    "분류:",
    "유튜브",
    "갤러리",
    "가족 관계",
    "역대 선거",
    "소속 정당",
    "국가유산포털",
    "드라마",
    "중학교 국사",
    "글로벌 세계 대백과사전",
)

SEARCH_ENGINE_URL = "https://duckduckgo.com/html/"
DEFAULT_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
)


def curl_json(url: str, params: dict[str, str]) -> dict[str, Any] | None:
    cmd = ["curl", "-sSLG", "--connect-timeout", "5", "--max-time", "20", url]
    for k, v in params.items():
        cmd += ["--data-urlencode", f"{k}={v}"]

    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        return None

    out = (p.stdout or "").strip()
    if not out.startswith("{"):
        return None

    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def curl_text(url: str, params: dict[str, str] | None = None, max_time: int = 20) -> str:
    cmd = [
        "curl",
        "-sSLG",
        "--connect-timeout",
        "5",
        "--max-time",
        str(max_time),
        "-A",
        DEFAULT_UA,
        url,
    ]
    if params:
        for k, v in params.items():
            cmd += ["--data-urlencode", f"{k}={v}"]

    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        return ""
    return p.stdout or ""


def clean_author(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"\(.*?\)", "", raw).strip()
    return raw


def normalize_title(title: str) -> str:
    t = title.strip()
    t = t.replace("〈", "").replace("〉", "").strip()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"^['\"“”‘’]+|['\"“”‘’]+$", "", t)
    return t


def normalize_for_match(text: str) -> str:
    t = normalize_title(text)
    t = re.sub(r"\(.*?\)", "", t)
    t = t.replace("·", "")
    t = t.replace("ㆍ", "")
    t = re.sub(r"[\s\-–—_.,:;!?\"'`~()\[\]{}<>《》〈〉/]", "", t)
    return t.lower()


def split_title_variants(title: str) -> list[str]:
    t = normalize_title(title)
    if not t:
        return []
    parts = [p.strip() for p in t.split("/") if p.strip()]
    return parts if parts else [t]


def extract_titles_from_work_cell(work_cell: str) -> list[str]:
    titles: list[str] = []
    for m in re.findall(r"〈([^〉]+)〉", work_cell):
        for t in split_title_variants(m):
            if t:
                titles.append(t)
    return titles


def build_query_titles(title: str) -> list[str]:
    out: list[str] = []
    t = normalize_title(title)

    def add(x: str) -> None:
        v = normalize_title(x)
        if v and v not in out:
            out.append(v)

    add(t)

    for a in TITLE_ALIAS_MAP.get(t, []):
        add(a)

    # Parenthesis variants: e.g. 공후인(공무도하가)
    m = re.match(r"^(.+?)\((.+?)\)$", t)
    if m:
        add(m.group(1))
        add(m.group(2))

    # Slash variants
    for p in split_title_variants(t):
        add(p)

    return out


def page_title_matches(query: str, candidate: str) -> bool:
    q = normalize_for_match(query)
    c = normalize_for_match(candidate)
    if not q or not c:
        return False
    if q in c or c in q:
        return True

    # Compare by segments for subpages like 보현십원가/예경제불가
    q_parts = [p for p in q.split("/") if p]
    c_parts = [p for p in c.split("/") if p]
    return any(p and p in c for p in q_parts) or any(p and p in q for p in c_parts)


def decode_ddg_href(href: str) -> str:
    if not href:
        return ""
    href = html.unescape(href).strip()

    # DuckDuckGo redirect pattern: /l/?kh=-1&uddg=<encoded-url>
    if "uddg=" in href:
        parsed = urlparse(href)
        qs = parse_qs(parsed.query)
        if "uddg" in qs and qs["uddg"]:
            return unquote(qs["uddg"][0])

    # Absolute URL already
    if href.startswith("http://") or href.startswith("https://"):
        return href

    return ""


def search_urls_duckduckgo(query: str, max_results: int = 6) -> list[str]:
    if not query:
        return []

    html_doc = curl_text(
        SEARCH_ENGINE_URL,
        {
            "q": query,
            "kl": "kr-ko",
        },
        max_time=25,
    )
    if not html_doc:
        return []

    out: list[str] = []
    seen: set[str] = set()

    # ddg result links appear in href attributes
    for href in re.findall(r'href="([^"]+)"', html_doc):
        url = decode_ddg_href(href)
        if not url:
            continue
        if "duckduckgo.com" in url:
            continue
        if not (url.startswith("http://") or url.startswith("https://")):
            continue
        if url in seen:
            continue
        seen.add(url)
        out.append(url)
        if len(out) >= max_results:
            break

    return out


def html_to_text(doc: str) -> str:
    if not doc:
        return ""

    s = doc
    s = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", s)
    s = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", s)
    s = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", s)
    s = re.sub(r"(?is)<br\\s*/?>", "\n", s)
    s = re.sub(r"(?is)</p>|</li>|</div>|</h\\d>", "\n", s)
    s = re.sub(r"(?is)<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\r\n?", "\n", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def extract_poem_from_plain_text(text: str) -> str:
    if not text:
        return ""

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    cands: list[list[str]] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        ok_len = 2 <= len(ln) <= 80
        ok_script = bool(re.search(r"[一-龥가-힣]", ln))
        bad = any(k in ln for k in NOISE_KEYWORDS)
        if ok_len and ok_script and not bad:
            block = [ln]
            j = i + 1
            while j < len(lines):
                l2 = lines[j]
                if (
                    2 <= len(l2) <= 80
                    and re.search(r"[一-龥가-힣]", l2)
                    and not any(k in l2 for k in NOISE_KEYWORDS)
                ):
                    block.append(l2)
                    j += 1
                else:
                    break
            if len(block) >= 2:
                cands.append(block)
            i = j
        else:
            i += 1

    if not cands:
        return ""

    best = sorted(cands, key=lambda b: score_block("\n".join(b)), reverse=True)[0]
    out = "\n".join(best[:40]).strip()
    return out if looks_like_poem(out) else ""


def fetch_from_broad_web(title: str, author: str = "") -> tuple[str, str]:
    title = normalize_title(title)
    author = normalize_title(author)

    queries = [
        f'"{title}" 원문',
        f'"{title}" 전문',
        f'"{title}" {author} 원문'.strip(),
        f'"{title}" 블로그',
    ]
    queries = [q for q in queries if q]
    queries = queries[:2]

    checked_urls: set[str] = set()
    fetched_pages = 0

    def domain_rank(url: str) -> int:
        host = (urlparse(url).hostname or "").lower()
        if "blog.naver.com" in host or host.endswith(".tistory.com"):
            return 0
        if "encykorea.aks.ac.kr" in host or "db.itkc.or.kr" in host:
            return 1
        return 2

    for q in queries:
        urls = sorted(search_urls_duckduckgo(q, max_results=5), key=domain_rank)
        for url in urls[:4]:
            if url in checked_urls:
                continue
            checked_urls.add(url)

            # Skip obvious binaries
            low = url.lower()
            if any(low.endswith(ext) for ext in (".pdf", ".jpg", ".jpeg", ".png", ".gif", ".zip")):
                continue

            doc = curl_text(url, max_time=12)
            fetched_pages += 1
            if fetched_pages > 8:
                return "", ""
            if not doc:
                continue

            plain = html_to_text(doc)
            if not plain:
                continue

            # Focus on local window around title mention when possible.
            body = ""
            idx = plain.find(title) if title else -1
            if idx == -1 and " " in title:
                head = title.split(" ", 1)[0]
                idx = plain.find(head)
            if idx != -1:
                start = max(0, idx - 3500)
                end = min(len(plain), idx + 3500)
                body = extract_poem_from_plain_text(plain[start:end])
            if not body:
                body = extract_poem_from_plain_text(plain)

            if body:
                return body, ""

    return "", ""


def strip_wiki_markup(text: str) -> str:
    t = html.unescape(text)

    # Remove refs first
    t = re.sub(r"<ref[^>]*?>.*?</ref>", "", t, flags=re.S)
    t = re.sub(r"<ref[^>]*/>", "", t)

    # Newline tags
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.I)

    # Simplify links [[A|B]] -> B, [[A]] -> A
    t = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]+)\]\]", r"\1", t)

    # Remove templates (best-effort, non-nested pass)
    for _ in range(3):
        new_t = re.sub(r"\{\{[^{}]*\}\}", "", t)
        if new_t == t:
            break
        t = new_t

    # Remove remaining html tags
    t = re.sub(r"<[^>]+>", "", t)

    return t


def sanitize_block(text: str) -> str:
    t = strip_wiki_markup(text)
    lines: list[str] = []

    for raw in t.splitlines():
        ln = raw.strip()
        if not ln:
            continue
        if len(ln) > 120:
            continue
        if not re.search(r"[一-龥가-힣]", ln):
            continue
        if any(k in ln for k in NOISE_KEYWORDS):
            continue
        lines.append(ln)

    if len(lines) < 2:
        return ""

    return "\n".join(lines[:40]).strip()


def extract_poem_blocks_from_wikitext(wikitext: str) -> list[str]:
    if not wikitext:
        return []

    blocks: list[str] = []

    # 1) explicit <poem> blocks
    for m in re.findall(r"<poem[^>]*>(.*?)</poem>", wikitext, flags=re.S | re.I):
        b = sanitize_block(m)
        if b:
            blocks.append(b)

    # 2) old Korean sections often wrapped by templates, no <poem>
    for m in re.findall(
        r"\{\{옛한글\s*(?:처음|시작)\}\}(.*?)\{\{옛한글\s*끝\}\}",
        wikitext,
        flags=re.S,
    ):
        b = sanitize_block(m)
        if b:
            blocks.append(b)

    # 3) fallback: first prose-like cluster in raw wikitext after cleanup
    if not blocks:
        cleaned = sanitize_block(wikitext)
        if cleaned:
            blocks.append(cleaned)

    # Dedupe by normalized block
    uniq: list[str] = []
    seen: set[str] = set()
    for b in blocks:
        key = normalize_for_match(b)
        if not key or key in seen:
            continue
        seen.add(key)
        uniq.append(b)

    return uniq


def looks_like_poem(text: str) -> bool:
    if not text:
        return False

    if any(k in text for k in NOISE_KEYWORDS):
        return False

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) < 2:
        return False

    structural_bad_prefix = (
        "==",
        "1장 -",
        "2장 -",
        "3장 -",
        "4장 -",
        "5장 -",
        "6장 -",
    )
    structural_bad_exact = {
        "내용",
        "전문",
        "작품 구성",
        "유명한 절명시",
        "시조의 내용",
    }
    structural_bad_substr = (
        "작품 구성",
        "유명한 절명시",
        "시조의 내용",
        "해석이 잘 되지",
    )

    bad_line_hits = 0
    for ln in lines:
        if ln in structural_bad_exact:
            bad_line_hits += 1
        if any(ln.startswith(p) for p in structural_bad_prefix):
            bad_line_hits += 1
        if any(s in ln for s in structural_bad_substr):
            bad_line_hits += 1
        if re.match(r"^\d+장\s*-\s*", ln):
            bad_line_hits += 1

    if bad_line_hits >= 1 and len(lines) <= 6:
        return False
    if bad_line_hits >= 2:
        return False

    if not any(re.search(r"[一-龥가-힣]", ln) for ln in lines):
        return False

    long_lines = sum(1 for ln in lines if len(ln) > 70)
    if long_lines > max(1, len(lines) // 4):
        return False

    return True


def score_block(text: str) -> int:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    hanja = len(re.findall(r"[一-龥]", text))
    hangul = len(re.findall(r"[가-힣]", text))
    score = hanja * 4 + hangul * 2 + min(len(lines), 20) * 3
    score -= sum(12 for ln in lines if len(ln) > 50)
    return score


def select_body_translation(blocks: list[str]) -> tuple[str, str]:
    good = [b for b in blocks if looks_like_poem(b)]
    if not good:
        return "", ""

    ranked = sorted(good, key=score_block, reverse=True)
    body = ranked[0]

    # Translation candidate: different block, mostly Hangul
    trans = ""
    body_key = normalize_for_match(body)
    for b in ranked[1:]:
        if normalize_for_match(b) == body_key:
            continue
        hanja = len(re.findall(r"[一-龥]", b))
        hangul = len(re.findall(r"[가-힣]", b))
        if hangul >= hanja and 20 <= len(b) <= 2500:
            trans = b
            break

    return body, trans


def wikisource_parse_wikitext(page: str) -> str:
    data = curl_json(
        "https://ko.wikisource.org/w/api.php",
        {
            "action": "parse",
            "page": page,
            "prop": "wikitext",
            "format": "json",
        },
    )
    if not data or "error" in data:
        return ""
    return (data.get("parse", {}).get("wikitext", {}).get("*") or "").strip()


def wikisource_search_titles(query: str) -> list[str]:
    data = curl_json(
        "https://ko.wikisource.org/w/api.php",
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": "10",
            "format": "json",
        },
    )
    if not data:
        return []

    out: list[str] = []
    for item in data.get("query", {}).get("search", []):
        t = (item.get("title") or "").strip()
        if t and t not in out:
            out.append(t)
    return out


def fetch_from_wikisource(title: str) -> tuple[str, str]:
    for q in build_query_titles(title):
        # direct parse first
        wt = wikisource_parse_wikitext(q)
        if wt:
            body, trans = select_body_translation(extract_poem_blocks_from_wikitext(wt))
            if body:
                return body, trans

        # then search matched titles
        for cand in wikisource_search_titles(q):
            if not page_title_matches(q, cand):
                continue
            wt2 = wikisource_parse_wikitext(cand)
            if not wt2:
                continue
            body, trans = select_body_translation(extract_poem_blocks_from_wikitext(wt2))
            if body:
                return body, trans

    return "", ""


def wikipedia_extract_exact(title: str) -> str:
    data = curl_json(
        "https://ko.wikipedia.org/w/api.php",
        {
            "action": "query",
            "prop": "extracts",
            "explaintext": "1",
            "exsectionformat": "plain",
            "format": "json",
            "titles": title,
        },
    )
    if not data:
        return ""

    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return ""

    page = next(iter(pages.values()))
    return (page.get("extract") or "").strip()


def strip_after_noise_sections(text: str) -> str:
    # Cut before common reference sections
    markers = [
        "\n== 주석 ==",
        "\n== 각주 ==",
        "\n== 참고 문헌 ==",
        "\n== 참고 자료 ==",
        "\n== 외부 링크 ==",
        "\n== 같이 보기 ==",
        "\n== 라이선스 ==",
    ]
    cut = len(text)
    for m in markers:
        idx = text.find(m)
        if idx != -1:
            cut = min(cut, idx)
    return text[:cut]


def extract_poem_body_from_extract(extract: str) -> str:
    if not extract:
        return ""

    s = strip_after_noise_sections(extract)
    lines = [ln.strip() for ln in s.splitlines() if ln.strip()]

    cands: list[list[str]] = []
    i = 0
    while i < len(lines):
        ln = lines[i]

        ok_len = 2 <= len(ln) <= 60
        ok_script = bool(re.search(r"[一-龥가-힣]", ln))
        bad = any(k in ln for k in NOISE_KEYWORDS)

        if ok_len and ok_script and not bad:
            block = [ln]
            j = i + 1
            while j < len(lines):
                l2 = lines[j]
                if (
                    2 <= len(l2) <= 60
                    and re.search(r"[一-龥가-힣]", l2)
                    and not any(k in l2 for k in NOISE_KEYWORDS)
                ):
                    block.append(l2)
                    j += 1
                else:
                    break
            if len(block) >= 2:
                cands.append(block)
            i = j
        else:
            i += 1

    if not cands:
        return ""

    def cand_score(block: list[str]) -> int:
        txt = "\n".join(block)
        return score_block(txt)

    best = sorted(cands, key=cand_score, reverse=True)[0]
    body = "\n".join(best[:40]).strip()
    return body if looks_like_poem(body) else ""


def extract_translation_from_extract(extract: str, body: str) -> str:
    if not extract or not body:
        return ""

    # Marker-based small section
    m = re.search(r"(현대어 풀이|해석|번역)\s*\n(.+?)(?:\n\n|\Z)", extract, flags=re.S)
    if m:
        txt = m.group(2).strip()
        txt = strip_after_noise_sections(txt)
        if 20 <= len(txt) <= 2500:
            return txt

    # Tail block after body with Hangul dominance
    pos = extract.find(body)
    if pos == -1:
        return ""

    tail = extract[pos + len(body) :]
    lines = [ln.strip() for ln in tail.splitlines() if ln.strip()]
    out: list[str] = []
    for ln in lines[:25]:
        if any(k in ln for k in NOISE_KEYWORDS):
            break
        if re.search(r"[一-龥]", ln):
            break
        if re.search(r"[가-힣]", ln) and len(ln) <= 80:
            out.append(ln)
    if len(out) >= 2:
        txt = "\n".join(out)
        if 20 <= len(txt) <= 2500:
            return txt

    return ""


def fetch_from_wikipedia(title: str) -> tuple[str, str]:
    for q in build_query_titles(title):
        ext = wikipedia_extract_exact(q)
        if not ext:
            continue
        body = extract_poem_body_from_extract(ext)
        if not body:
            continue
        trans = extract_translation_from_extract(ext, body)
        return body, trans
    return "", ""


def build_poem_entries() -> list[dict[str, Any]]:
    text = RESEARCH_MD.read_text(encoding="utf-8")
    entries: list[tuple[str, str]] = []

    for ln in text.splitlines():
        if not ln.startswith("|") or "---" in ln:
            continue
        cols = [c.strip() for c in ln.strip().strip("|").split("|")]
        if len(cols) < 5:
            continue
        if cols[0] == "시대":
            continue

        author = clean_author(cols[1])
        works_cell = cols[4]
        titles = extract_titles_from_work_cell(works_cell)
        for t in titles:
            entries.append((author, t))

    # Dedupe by author+title
    seen = set()
    uniq: list[tuple[str, str]] = []
    for a, t in entries:
        key = (a, t)
        if key in seen:
            continue
        seen.add(key)
        uniq.append((a, t))

    out: list[dict[str, Any]] = []
    idx = 1
    title_cache: dict[str, tuple[str, str]] = {}

    for author, title_ko in uniq:
        title_hanja = HANJA_TITLE_MAP.get(title_ko, "미상")

        body = ""
        trans = ""

        if title_ko in title_cache:
            body, trans = title_cache[title_ko]
        elif title_ko in MANUAL_TEXT:
            body = MANUAL_TEXT[title_ko].get("본문", "").strip()
            trans = MANUAL_TEXT[title_ko].get("번역문", "").strip()
            title_cache[title_ko] = (body, trans)
        elif title_ko not in NON_POEM_OR_COLLECTION:
            body, trans = fetch_from_wikisource(title_ko)
            if not body:
                body, trans = fetch_from_wikipedia(title_ko)
            if not body:
                body, trans = fetch_from_broad_web(title_ko, author)
            title_cache[title_ko] = (body, trans)

        # Final safety filter: if doubtful, keep empty and let report capture it.
        if body and not looks_like_poem(body):
            body = ""
            trans = ""

        if trans and any(k in trans for k in NOISE_KEYWORDS):
            trans = ""

        out.append(
            {
                "작품번호": f"KPOEM-{idx:04d}",
                "작가이름": author,
                "시제목": {"한자": title_hanja, "한글": title_ko},
                "본문": body,
                "번역문": trans,
                "해설": "",
            }
        )
        idx += 1

    return out


def write_report(items: list[dict[str, Any]]) -> None:
    total = len(items)
    body_ok = sum(1 for x in items if (x.get("본문") or "").strip())
    trans_ok = sum(1 for x in items if (x.get("번역문") or "").strip())
    expl_ok = sum(1 for x in items if (x.get("해설") or "").strip())

    body_missing = [x for x in items if not (x.get("본문") or "").strip()]
    trans_missing = [x for x in items if not (x.get("번역문") or "").strip()]
    expl_missing = [x for x in items if not (x.get("해설") or "").strip()]

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines: list[str] = []
    lines.append("# poem_korean 빌드 리포트")
    lines.append("")
    lines.append(f"- 생성 시각: {now}")
    lines.append(f"- 대상 파일: `{OUT_JSON.as_posix()}`")
    lines.append("")
    lines.append("## 집계")
    lines.append("")
    lines.append(f"- 총 작품 수: {total}")
    lines.append(f"- 본문 확보: {body_ok} / {total}")
    lines.append(f"- 번역문 확보: {trans_ok} / {total}")
    lines.append(f"- 해설 확보: {expl_ok} / {total}")
    lines.append("")
    lines.append("## 누락 요약")
    lines.append("")
    lines.append(f"- 본문 누락: {len(body_missing)}")
    lines.append(f"- 번역문 누락: {len(trans_missing)}")
    lines.append(f"- 해설 누락: {len(expl_missing)}")
    lines.append("")
    lines.append("## 본문 누락 목록")
    lines.append("")
    if body_missing:
        for i, x in enumerate(body_missing, 1):
            lines.append(
                f"{i}. {x['작품번호']} | {x['작가이름']} | {x['시제목']['한글']} ({x['시제목']['한자']})"
            )
    else:
        lines.append("- 없음")
    lines.append("")
    lines.append("## 번역문 누락 목록")
    lines.append("")
    if trans_missing:
        for i, x in enumerate(trans_missing, 1):
            lines.append(
                f"{i}. {x['작품번호']} | {x['작가이름']} | {x['시제목']['한글']} ({x['시제목']['한자']})"
            )
    else:
        lines.append("- 없음")
    lines.append("")
    lines.append("## 해설 누락 목록")
    lines.append("")
    if expl_missing:
        for i, x in enumerate(expl_missing, 1):
            lines.append(
                f"{i}. {x['작품번호']} | {x['작가이름']} | {x['시제목']['한글']} ({x['시제목']['한자']})"
            )
    else:
        lines.append("- 없음")
    lines.append("")
    lines.append("## 전체 상태 테이블")
    lines.append("")
    lines.append("| 작품번호 | 작가 | 제목(한글) | 제목(한자) | 본문 | 번역문 | 해설 |")
    lines.append("|---|---|---|---|---|---|---|")
    for x in items:
        b = "O" if (x.get("본문") or "").strip() else "X"
        t = "O" if (x.get("번역문") or "").strip() else "X"
        e = "O" if (x.get("해설") or "").strip() else "X"
        lines.append(
            f"| {x['작품번호']} | {x['작가이름']} | {x['시제목']['한글']} | {x['시제목']['한자']} | {b} | {t} | {e} |"
        )

    OUT_REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    poems = build_poem_entries()
    OUT_JSON.write_text(json.dumps(poems, ensure_ascii=False, indent=2), encoding="utf-8")
    write_report(poems)
    print(f"poems={len(poems)}")
    print(f"json={OUT_JSON}")
    print(f"report={OUT_REPORT}")


if __name__ == "__main__":
    main()
