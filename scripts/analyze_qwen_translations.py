#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Qwen 번역 데이터 품질 분석 스크립트
- 한글/한자 제목 체크
- 집평 원문/번역 존재 여부 체크
"""

import json
import re
from pathlib import Path

def analyze_poem(item):
    """각 시의 품질 문제를 분석"""
    poem_no = item.get('poemNoStr', 'N/A')
    title_chinese = item.get('title', '')
    markdown = item.get('markdown', '')
    poet = item.get('poet', '')

    issues = []

    # 1. 한글 제목 추출 (## NNN. 한글제목 형식)
    korean_title_match = re.search(r'^##\s+\d+\.\s+(.+)$', markdown, re.MULTILINE)
    korean_title = korean_title_match.group(1) if korean_title_match else None

    # 한글 제목 검증
    if not korean_title:
        issues.append('한글제목: 없음')
    elif re.search(r'[\u4e00-\u9fff]', korean_title):  # 한자 포함 체크
        issues.append('한글제목: 한자 섞임')

    # 2. 한자 제목 검증
    if not title_chinese or title_chinese.strip() == '':
        issues.append('한자제목: 없음')

    # 3. 집평 분석
    # 집평 섹션 찾기 (다양한 패턴)
    jipyeong_patterns = [
        r'###?\s*집평\s*원문',
        r'###?\s*\[?집평\]?',
        r'###?\s*\[?集評\]?',
        r'###?\s*집평\s*번역',
    ]

    has_jipyeong_section = False
    for pattern in jipyeong_patterns:
        if re.search(pattern, markdown, re.IGNORECASE):
            has_jipyeong_section = True
            break

    if not has_jipyeong_section:
        issues.append('집평: 없음')
    else:
        # 집평 원문 체크 (한자가 있는지)
        jipyeong_original_match = re.search(
            r'###?\s*(?:집평\s*원문|集評|\[집평\])(.*?)(?=###|$)',
            markdown,
            re.DOTALL | re.IGNORECASE
        )

        # 집평 번역 체크
        jipyeong_translation_match = re.search(
            r'###?\s*집평\s*번역(.*?)(?=###|$)',
            markdown,
            re.DOTALL | re.IGNORECASE
        )

        has_original = False
        has_translation = False

        if jipyeong_original_match:
            original_text = jipyeong_original_match.group(1).strip()
            # 한자가 있으면 원문으로 간주
            if re.search(r'[\u4e00-\u9fff]', original_text) and len(original_text) > 10:
                has_original = True

        if jipyeong_translation_match:
            translation_text = jipyeong_translation_match.group(1).strip()
            # 한글이 주로 있으면 번역으로 간주
            if len(translation_text) > 10:
                has_translation = True

        # 집평은 있는데 내용 문제
        if not has_original and not has_translation:
            issues.append('집평: 내용 없음')
        elif not has_original and has_translation:
            issues.append('집평: 원문 누락 (번역만 있음)')
        elif has_original and not has_translation:
            issues.append('집평: 번역 누락 (원문만 있음)')

    return {
        'poemNo': poem_no,
        'title_chinese': title_chinese,
        'title_korean': korean_title or '',
        'poet': poet,
        'issues': issues
    }

def main():
    json_path = Path('/Users/jin/Documents/tangshi/docs/research/qwen_translations/qwen_translation_20260221_143125.json')

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # data는 dict이고, results 키 안에 시 배열이 들어있음
    poems = data.get('results', [])

    results = []
    for item in poems:
        result = analyze_poem(item)
        results.append(result)

    # 통계
    total = len(results)
    normal = sum(1 for r in results if len(r['issues']) == 0)

    jipyeong_none = sum(1 for r in results if '집평: 없음' in r['issues'])
    jipyeong_original_only = sum(1 for r in results if '집평: 번역 누락 (원문만 있음)' in r['issues'])
    jipyeong_translation_only = sum(1 for r in results if '집평: 원문 누락 (번역만 있음)' in r['issues'])
    jipyeong_empty = sum(1 for r in results if '집평: 내용 없음' in r['issues'])

    korean_title_issues = sum(1 for r in results if any('한글제목' in issue for issue in r['issues']))
    chinese_title_issues = sum(1 for r in results if any('한자제목' in issue for issue in r['issues']))

    # 출력
    print("=" * 100)
    print("Qwen 번역 데이터 품질 분석 결과")
    print("=" * 100)
    print()
    print(f"{'번호':<6} | {'한자제목':<30} | {'시인':<15} | 문제유형")
    print("-" * 100)

    for r in results:
        status = '정상' if len(r['issues']) == 0 else ', '.join(r['issues'])
        # 한자 제목 길이 제한 (표시용)
        title_display = r['title_chinese'][:28] + '..' if len(r['title_chinese']) > 30 else r['title_chinese']
        poet_display = r['poet'][:13] + '..' if len(r['poet']) > 15 else r['poet']

        print(f"{r['poemNo']:<6} | {title_display:<30} | {poet_display:<15} | {status}")

    # 통계 요약
    print()
    print("=" * 100)
    print("통계 요약")
    print("=" * 100)
    print(f"총 시 수:                          {total:>4}편")
    print(f"정상 (문제 없음):                   {normal:>4}편")
    print(f"집평 아예 없음:                     {jipyeong_none:>4}편")
    print(f"집평 원문만 있음 (번역 누락):        {jipyeong_original_only:>4}편")
    print(f"집평 번역만 있음 (원문 누락):        {jipyeong_translation_only:>4}편")
    print(f"집평 섹션은 있으나 내용 없음:       {jipyeong_empty:>4}편")
    print(f"한글 제목 문제:                     {korean_title_issues:>4}편")
    print(f"한자 제목 문제:                     {chinese_title_issues:>4}편")
    print("=" * 100)

if __name__ == '__main__':
    main()
