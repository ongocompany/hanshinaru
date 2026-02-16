#!/usr/bin/env python3
"""
320편 시에 대해 간체자(poemSimp) + 병음(pinyin) + 평측(pingze) 일괄 생성
- opencc: 번체 → 간체
- pypinyin: 간체 → 병음 (성조부호)
- pingshui_yun.json char_map: 평측 판별 (절구/율시만)
"""

import json
import os
import re
from pypinyin import pinyin, Style
from opencc import OpenCC

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
POEMS_PATH = os.path.join(PROJECT_DIR, "public", "index", "poems.full.json")
PINGSHUI_PATH = os.path.join(PROJECT_DIR, "public", "index", "pingshui_yun.json")

# 평측 적용 카테고리 (절구/율시만)
PINGZE_CATEGORIES = {"五言律詩", "七言律詩", "五言絶句", "七言絶句"}

# opencc 번체 → 간체 변환기
cc = OpenCC("t2s")

# 이체자 → 표준 번체 매핑 (char_map에 없는 변이체 → 표준형)
VARIANT_MAP = {
    "値": "值", "偸": "偷", "却": "卻", "卽": "即", "呑": "吞",
    "塚": "冢", "尙": "尚", "屛": "屏", "岳": "嶽", "强": "強",
    "愼": "慎", "戱": "戲", "揷": "插", "擧": "舉", "敎": "教",
    "晩": "晚", "氷": "冰", "淸": "清", "爲": "為", "牀": "床",
    "珮": "佩", "疎": "疏", "盃": "杯", "眞": "真", "絶": "絕",
    "蔲": "蔻", "衆": "眾", "裡": "裏", "賖": "賒", "迴": "回",
    "逈": "迥", "郞": "郎", "鄕": "鄉", "鏁": "鎖", "隣": "鄰",
    "靑": "青", "顔": "顏", "飮": "飲", "鬪": "鬥", "鷄": "雞",
}

# char_map에도 없고 표준형도 없는 글자 → 직접 평측 지정
DIRECT_TONE_MAP = {
    "啼": "平", "堤": "平", "嫦": "平", "廻": "平", "掃": "仄",
    "棹": "仄", "樽": "平", "汚": "平", "浣": "仄", "溪": "平",
    "燃": "平", "爐": "平", "竈": "仄", "竝": "仄", "葡": "平",
    "藁": "仄", "蝴": "平", "螂": "平", "袴": "仄", "跡": "仄",
    "遍": "仄", "鄜": "平", "針": "平",
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def clean_poem_text(text):
    """원문에서 주석번호 [숫자] 제거 → 순수 한자 텍스트"""
    return re.sub(r"\[\d+\]", "", text or "")


def get_pinyin_line(line):
    """한 행의 한자를 병음으로 변환 (성조부호, 공백 구분)"""
    # 한자가 아닌 문자는 건너뜀
    chars = [ch for ch in line if "\u4e00" <= ch <= "\u9fff"]
    if not chars:
        return ""
    result = pinyin(chars, style=Style.TONE)
    return " ".join([item[0] for item in result])


def get_pingze_line(line, char_map):
    """한 행의 한자에 대해 평(平)/측(仄) 판별"""
    chars = [ch for ch in line if "\u4e00" <= ch <= "\u9fff"]
    if not chars:
        return ""
    result = []
    for ch in chars:
        info = char_map.get(ch)
        if info:
            result.append(info["tone"])
        elif ch in VARIANT_MAP and VARIANT_MAP[ch] in char_map:
            result.append(char_map[VARIANT_MAP[ch]]["tone"])
        elif ch in DIRECT_TONE_MAP:
            result.append(DIRECT_TONE_MAP[ch])
        else:
            result.append("?")
    return "".join(result)


def process_poems():
    # 데이터 로드
    poems = load_json(POEMS_PATH)
    pingshui = load_json(PINGSHUI_PATH)
    char_map = pingshui.get("char_map", {})

    print(f"총 {len(poems)}편 처리 시작...")
    print(f"평수운 char_map: {len(char_map)}자")

    stats = {
        "total": len(poems),
        "pinyin_done": 0,
        "pingze_done": 0,
        "pingze_skipped": 0,
        "unknown_chars": set(),
    }

    for i, poem in enumerate(poems):
        poem_text = clean_poem_text(poem.get("poemZh", ""))
        lines = [l.strip() for l in poem_text.split("\n") if l.strip()]
        category = poem.get("category", "")

        # 1. 간체자 변환 (번체 원문 → 간체)
        simp_lines = []
        for line in lines:
            simp_lines.append(cc.convert(line))
        poem["poemSimp"] = "\n".join(simp_lines)

        # 2. 병음 생성 (간체자 기준)
        pinyin_lines = []
        for simp_line in simp_lines:
            pinyin_lines.append(get_pinyin_line(simp_line))
        poem["pinyin"] = "\n".join(pinyin_lines)
        stats["pinyin_done"] += 1

        # 3. 평측 생성 (절구/율시만, 번체 기준 — char_map이 번체)
        if category in PINGZE_CATEGORIES:
            pingze_lines = []
            for line in lines:
                pz = get_pingze_line(line, char_map)
                # 미확인 글자 수집
                for ch in line:
                    if "\u4e00" <= ch <= "\u9fff" and ch not in char_map:
                        stats["unknown_chars"].add(ch)
                pingze_lines.append(pz)
            poem["pingze"] = "\n".join(pingze_lines)
            stats["pingze_done"] += 1
        else:
            poem["pingze"] = ""
            stats["pingze_skipped"] += 1

        # 진행 표시 (50편마다)
        if (i + 1) % 50 == 0 or i == len(poems) - 1:
            print(f"  {i + 1}/{len(poems)} 완료")

    # 저장
    save_json(POEMS_PATH, poems)

    # 결과 출력
    print(f"\n=== 완료 ===")
    print(f"총 {stats['total']}편")
    print(f"병음 생성: {stats['pinyin_done']}편")
    print(f"평측 생성: {stats['pingze_done']}편 (절구/율시)")
    print(f"평측 건너뜀: {stats['pingze_skipped']}편 (고시/악부)")
    if stats["unknown_chars"]:
        print(f"평수운 미등록 글자 ({len(stats['unknown_chars'])}자): {''.join(sorted(stats['unknown_chars']))}")
    else:
        print("평수운 미등록 글자: 없음")
    print(f"\n저장 완료: {POEMS_PATH}")


if __name__ == "__main__":
    process_poems()
