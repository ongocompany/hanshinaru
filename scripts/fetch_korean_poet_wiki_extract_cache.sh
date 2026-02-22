#!/usr/bin/env bash
set -euo pipefail

INPUT_JSON="${1:-한시사이트개발/한국의한시/research_poets.json}"
OUT_JSONL="${2:-/tmp/korean_poet_wiki_extract_cache.jsonl}"

alias_title() {
  case "$1" in
    "유리왕") printf '유리명왕' ;;
    "서동") printf '무왕 (백제)' ;;
    "정서") printf '정서 (고려)' ;;
    "안축") printf '안축 (고려)' ;;
    "성현") printf '성현 (조선)' ;;
    "박지원") printf '박지원 (1737년)' ;;
    "이옥") printf '이옥 (1760년)' ;;
    "세종") printf '세종대왕' ;;
    "권제") printf '권제 (1387년)' ;;
    "안지") printf '안지 (1418년)' ;;
    "계랑") printf '계랑 (조선)' ;;
    "매창") printf '이매창' ;;
    "이정구") printf '이정구 (1564년)' ;;
    "이식") printf '이식 (1584년)' ;;
    "최명길") printf '최명길 (1586년)' ;;
    "이경석") printf '이경석 (1595년)' ;;
    "최자") printf '최자 (고려)' ;;
    "임춘") printf '임춘 (고려)' ;;
    "최송설당") printf '최송설당' ;;
    "백결선생") printf '백결 선생' ;;
    *) printf '' ;;
  esac
}

fetch_extract() {
  local title="$1"
  local res ext
  res="$(
    curl -sG --connect-timeout 5 --max-time 20 'https://ko.wikipedia.org/w/api.php' \
      --data-urlencode 'action=query' \
      --data-urlencode 'prop=extracts' \
      --data-urlencode 'explaintext=1' \
      --data-urlencode 'exsectionformat=plain' \
      --data-urlencode 'format=json' \
      --data-urlencode "titles=${title}" || true
  )"
  if [[ -z "$res" ]]; then
    printf ''
    return 0
  fi
  ext="$(printf '%s' "$res" | jq -r '.query.pages[]?.extract // ""' 2>/dev/null || true)"
  printf '%s' "$ext"
}

search_title() {
  local q="$1"
  local res title
  res="$(
    curl -sG --connect-timeout 5 --max-time 20 'https://ko.wikipedia.org/w/api.php' \
      --data-urlencode 'action=query' \
      --data-urlencode 'list=search' \
      --data-urlencode "srsearch=${q}" \
      --data-urlencode 'srlimit=5' \
      --data-urlencode 'format=json' || true
  )"
  if [[ -z "$res" ]]; then
    printf ''
    return 0
  fi
  title="$(printf '%s' "$res" | jq -r '.query.search[]?.title' 2>/dev/null | rg -v '^분류:' | head -n 1 || true)"
  printf '%s' "$title"
}

: > "$OUT_JSONL"

jq -c '.[] | {name:.name.ko, source_title:(.source_title // "")}' "$INPUT_JSON" | while IFS= read -r row; do
  name="$(printf '%s' "$row" | jq -r '.name')"
  source_title="$(printf '%s' "$row" | jq -r '.source_title')"

  extract=''
  used=''

  declare -a candidates=()
  if [[ -n "$source_title" && "$source_title" != "미상" ]]; then
    candidates+=("$source_title")
  fi
  aliased="$(alias_title "$name")"
  if [[ -n "$aliased" ]]; then
    candidates+=("$aliased")
  fi
  candidates+=("$name")

  for c in "${candidates[@]}"; do
    [[ -z "$c" ]] && continue
    extract="$(fetch_extract "$c")"
    if [[ -n "$extract" ]]; then
      used="$c"
      break
    fi
  done

  if [[ -z "$extract" ]]; then
    st="$(search_title "$name")"
    if [[ -n "$st" ]]; then
      extract="$(fetch_extract "$st")"
      if [[ -n "$extract" ]]; then
        used="$st"
      fi
    fi
  fi

  b64="$(printf '%s' "$extract" | base64 | tr -d '\n')"
  jq -cn --arg name "$name" --arg title "$used" --arg extract_b64 "$b64" \
    '{name:$name,title:$title,extract_b64:$extract_b64}' >> "$OUT_JSONL"

  if [[ -n "$used" ]]; then
    printf 'cached: %s <- %s\n' "$name" "$used"
  else
    printf 'cached: %s <- fallback\n' "$name"
  fi
done

printf 'done: %s\n' "$OUT_JSONL"
